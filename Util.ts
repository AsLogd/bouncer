import * as fs from "fs";
import * as path from "path"
import * as ts from "typescript"
import * as assert from "assert"

// Interfaces with this tag in JSDocs will be
// considered when creating boundary validators
const BOUNDARY_JSDOC_TAG = "@boundary"

export function parseFile(fileName: string) {
	return ts.createSourceFile(
		fileName,
		fs.readFileSync(fileName).toString(),
		ts.ScriptTarget.ES2015,
		/*setParentNodes */ true
	);
}


/**
 * Maps the input files with function f
 */
export function mapFiles(fileNames: string[], f: (sourceFile: ts.SourceFile) => any): ts.Node[] {
	return fileNames.map(fn => f(parseFile(fn)))
}

function makeTypeAliasValidator(tanode: ts.TypeAliasDeclaration): ts.FunctionDeclaration {
	const name = tanode.name.getText()

	//Validator parameter
	const paramName = ts.createIdentifier("data");
	const parameter = ts.createParameter(
		/*decorators*/ undefined,
		/*modifiers*/ undefined,
		/*dotDotDotToken*/ undefined,
		paramName,
		/*questionToken*/ undefined,
		/*type*/ ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
	);

	// Children 5 is the type being assigned to the type alias
	const statements = [ts.createReturn(
		makeTypeValidator(paramName, tanode.getChildAt(5))
	)]

	// Type guard magic
	const typeAliasSymbol = checker.getSymbolAtLocation(tanode.name)
	const typeAliasType = checker.typeToTypeNode(
		checker.getDeclaredTypeOfSymbol(typeAliasSymbol)
	)
	const returnType = ts.createTypePredicateNode(paramName, typeAliasType)

	// Build and return validator
	return ts.createFunctionDeclaration(
		/*decorators*/
		undefined,
		/*modifiers*/
		[ts.createToken(ts.SyntaxKind.ExportKeyword)],
		/*asteriskToken*/
		undefined,
		/*identifier*/
		"isValid"+name,
		/*typeParameters*/
		undefined,
		/*parameters*/
		[parameter],
		/*returnType*/
		//ts.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword),
		returnType,
		ts.createBlock(statements, /*multiline*/ true)
	);

}

function symbolIsAlias(symbol: ts.Symbol): boolean {
	return !!(symbol.flags & ts.SymbolFlags.TypeAlias)
}

function symbolIsInterface(symbol: ts.Symbol): boolean {
	return !!(symbol.flags & ts.SymbolFlags.Interface)
}

function symbolIsEnum(symbol: ts.Symbol): boolean {
	return !!(symbol.flags & ts.SymbolFlags.Enum)
}

/**
 * Given an <id> to an array, validate all the items with the type <baseType>
 */
function createMultipleValidator(id: ts.Expression, baseType: ts.Node) {
	// -Check that every element is of the base type
	// 		<id>.every( x => *childValidator(x)* )
	// 		<id>.every is defined because we know <id> is an array
	const everyName = ts.createIdentifier("every");
	const everyValidator = ts.createPropertyAccess(id, everyName)
	const paramName = ts.createIdentifier("x");
	const functionParam = ts.createParameter(
		[],
		[],
		undefined,
		paramName,
		undefined,
		ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
	)

	const everyValidatorBody = ts.createArrowFunction(
		// Modifiers
		[],
		// Type params
		[],
		// Parameters
		[functionParam],
		undefined,
		undefined,
		makeTypeValidator(paramName, baseType)
	)

	return ts.createCall(
		everyValidator,
		[],
		[everyValidatorBody]
	)
}

function createArrayValidator(id: ts.Expression, baseType: ts.Node): ts.Expression {
	// -Check array type
	const arrayGlobal = ts.createIdentifier("Array")
	const isArrayId = ts.createPropertyAccess(arrayGlobal, "isArray")

	return ts.createLogicalAnd(
		ts.createCall(
			isArrayId,
			[],
			[id]
		),
		createMultipleValidator(id, baseType)
	)
}
/**
 * Makes an expression to validate a node's members
 */
function createNodeMembersValidator(id: ts.Expression, tnode: ts.TypeLiteralNode | ts.InterfaceDeclaration): ts.Expression {
	// must not be undefined nor null, we are going to check its members
	let checkUndefined: ts.Expression = ts.createLogicalAnd(
		ts.createStrictInequality(
			ts.createTypeOf(id),
			ts.createStringLiteral("undefined")
		),
		ts.createStrictInequality(
			id,
			ts.createNull()
		)
	)

	// List of expressions that validate each member
	const memberValidatorCalls: ts.Expression[] = tnode.members.map(
		makeMemberValidator(id)
	)

	// First check undefined
	memberValidatorCalls.unshift(checkUndefined)

	// All expressions must be true for the interface to be valid
	return memberValidatorCalls.reduce(ts.createLogicalAnd)
}
const createTypeLiteralValidator: (id: ts.Expression, tnode: ts.TypeLiteralNode) => ts.Expression = createNodeMembersValidator

/**
 * Given the expression to access an object,
 * returns a function that, given a object member signature,
 * returns an expression that validates that member
 */
function makeMemberValidator(paramName: ts.Expression): (member: ts.PropertySignature) => ts.Expression {
	return (member) => {
		let validatorCall
		// If index signature is present, its type is the union of all the members' types
		// This means that validating all the properties with the index signature type won't fail
		if (ts.isIndexSignatureDeclaration(member)) {
			// Get all object values
			const objectGlobal = ts.createIdentifier("Object")
			const valuesMember = ts.createPropertyAccess(objectGlobal, "values")
			const valuesCall = ts.createCall(
				valuesMember,
				[],
				[paramName]
			)
			// Validate all values with the index signature type
			validatorCall = createMultipleValidator(valuesCall, member.type)
		} else {
			// Even if we have an index signature, validating each member makes stricter validation

			// Expression to access <member>
			let memberAccess = ts.createPropertyAccess(paramName, member.name.getText())
			// Expression that validates the member's type
			validatorCall = makeTypeValidator(memberAccess, member.type)

			// undefined is a valid value in optional members
			if(member.questionToken)
			{
				validatorCall = ts.createLogicalOr(
					ts.createStrictEquality(
						ts.createTypeOf(memberAccess),
						// Can't find a way to compare with undefined keyword
						ts.createStringLiteral("undefined")
					),
					validatorCall
				)
			}
		}


		return validatorCall
	}
}

function makeTypeValidator(id: ts.Expression, tnode: ts.Node): ts.Expression {
	// In case of unhandled type
	const validatorAny = ts.createIdentifier("isValidany")
	let validatorCall: ts.Expression = ts.createCall(validatorAny, [], [id])

	if (ts.isArrayTypeNode(tnode)) {
		// Array type first child is base type
		validatorCall = createArrayValidator(id, tnode.getChildAt(0))

	} else if(ts.isTypeLiteralNode(tnode)) {
		validatorCall = createTypeLiteralValidator(id, tnode)
	} else if (ts.isTypeReferenceNode(tnode)) {
		const type = checker.getTypeAtLocation(tnode.getChildAt(0))
		const symbol = type.getSymbol() || type.aliasSymbol

		// TODO: there's a bug where under unknown circumstances, the symbol doesn't exist
		if(!symbol) {
			const validatorName = ts.createIdentifier("isValid"+tnode.getChildAt(0).getText())
			// isValid<identifierName>(<id>)
			validatorCall = ts.createCall(
				validatorName,
				[],
				[id]
			)
		}
		else if (symbolIsInterface(symbol) || symbolIsAlias(symbol)) {
			if (symbol.getName() === "Array") {
				// Generic types have base type as sibling
				// (sibling 1 is '<' token, second sibling is a SytaxList)
				validatorCall = createArrayValidator(id, tnode.getChildAt(2).getChildAt(0))
			} else {
				// if it's an interface or alias, we just call the validator
				const validatorName = ts.createIdentifier("isValid"+symbol.getName())
				// isValid<typeName>(<id>)
				validatorCall = ts.createCall(
					validatorName,
					[],
					[id]
				)
			}
		} else if (symbolIsEnum(symbol)) {
			// It it's an enum, we call a generic enum checker with the enum type
			const typeName = checker.symbolToEntityName(symbol, ts.SymbolFlags.Enum)
			const enumTypeId = ts.createIdentifier(symbol.getName())
			const enumValidator = ts.createIdentifier("isValidEnum")

			// isValidEnumArray<typeof <enumName>>(<enumName>)
			validatorCall = ts.createCall(
				enumValidator,
				[ts.createTypeQueryNode(typeName)],
				[enumTypeId, id]
			)
		}
	} else if (ts.isUnionTypeNode(tnode)) {
		const typeValidatorCalls: ts.Expression[] = []

		tnode.types.forEach((child) => {
			typeValidatorCalls.push(makeTypeValidator(id, child))
		})

		validatorCall = typeValidatorCalls.reduce(ts.createLogicalOr)
	} else if(ts.isToken(tnode)) {
		const interfaceValidator = ts.createIdentifier("isValid"+ts.tokenToString(tnode.kind))
		// isValid<token>(<id>)
		validatorCall = ts.createCall(
			interfaceValidator,
			[],
			[id]
		)
	}

	return validatorCall

}


/**
 * Given an interface I, creates a validator declaration that checks
 * if a given object implements I in execution time
 */
function makeInterfaceValidator(inode: ts.InterfaceDeclaration): ts.FunctionDeclaration {
	const name = inode.name.getText()
	const paramName = ts.createIdentifier("data");
	const parameter = ts.createParameter(
		/*decorators*/ undefined,
		/*modifiers*/ undefined,
		/*dotDotDotToken*/ undefined,
		paramName,
		/*questionToken*/ undefined,
		/*type*/ ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
	);

	// All members must be valid for the interface to be valid
	const statements = [ts.createReturn(
		createNodeMembersValidator(paramName, inode)
	)]

	// Return typescript "is" magic
	// This makes the typescript compiler know the type of the data
	// in the scope where the call is true
	const interfaceSymbol = checker.getSymbolAtLocation(inode.name)
	const interfaceType = checker.typeToTypeNode(
		checker.getDeclaredTypeOfSymbol(interfaceSymbol)
	)
	const returnType = ts.createTypePredicateNode(paramName, interfaceType)

	return ts.createFunctionDeclaration(
		/*decorators*/
		undefined,
		/*modifiers*/
		[ts.createToken(ts.SyntaxKind.ExportKeyword)],
		/*asteriskToken*/
		undefined,
		/*identifier*/
		"isValid"+name,
		/*typeParameters*/
		undefined,
		/*parameters*/
		[parameter],
		/*returnType*/
		//ts.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword),
		returnType,
		ts.createBlock(statements, /*multiline*/ true)
	);
}

/**
 * Checks whether the statement is an interface declaration
 * tagged with the boundary tag
 */
function isBoundary(statement: ts.Statement): boolean {
	return ts.getJSDocTags(statement).some(s =>
			s.getText() === BOUNDARY_JSDOC_TAG
		)
}

let checker: ts.TypeChecker
/**
 * Creates validators for the boundary interfaces found in 'file'
 */
export function makeBoundaryValidators(files: string[], outputPath: string) {
	// Build a program using the set of root file names in fileNames
	const program = ts.createProgram(files, {});
	checker = program.getTypeChecker()
	const importNodes: ts.Node[] = []
	const nodes: ts.Node[] = []
	for (let file of program.getSourceFiles()) {
		// Filter typescript files
		// If this file is not some of the input files, continue
		if(!files.some(x => file.fileName.includes(x)))
			continue

		let imports = []
		for (let statement of file.statements) {

			if(!isBoundary(statement))
				continue

			if (ts.isEnumDeclaration(statement)) {
				imports.push(statement.name)
			}
			else if (ts.isInterfaceDeclaration(statement)) {
				imports.push(statement.name)
				nodes.push(
					makeInterfaceValidator(statement)
				)
			}
			else if(ts.isTypeAliasDeclaration(statement)) {
				imports.push(statement.name)
				nodes.push(
					makeTypeAliasValidator(statement)
				)
			}
		}

		if (imports.length) {
			const pathParts = file.fileName.split("/")
			// Module name is filename without extension
			const moduleName =
				// Get last path part
				pathParts.slice(-1)[0]
				// Leave out substr after last point (extension)
				.split(".").slice(0, -1)
				// Get the name with points again (if any)
				.join(".")

			// Path to file without filename
			const pathToFolder = pathParts.slice(0, -1).join("/")
			// Get relative path from output to file folder,
			// as we are going to create a .ts file that imports it
			const relativePath = path.relative(outputPath, pathToFolder)
			// Zero length string means same folder
			const suffix = relativePath.length !== 0 ? '/' : ''
			importNodes.push(
				ts.createImportDeclaration(
					undefined,
					undefined,
					ts.createImportClause(
						undefined,
						ts.createNamedImports(
							imports.map(i => ts.createImportSpecifier(
								undefined,
								i
							))
						)
					),
					ts.createStringLiteral(
						'./' + relativePath + suffix + moduleName
					)
				)
			)
		}
	}
	return importNodes.concat(nodes)
}

export function createFile(nodes: ts.Node[], output: string) {
	const resultFile = ts.createSourceFile(
		"someFileName.ts",
		"",
		ts.ScriptTarget.Latest,
		/*setParentNodes*/ false,
		ts.ScriptKind.TS
	);
	const printer = ts.createPrinter({
		newLine: ts.NewLineKind.LineFeed
	});
	const result = printer.printList(
		ts.ListFormat.MultiLine,
		ts.createNodeArray(nodes, false),
		resultFile
	);
	//TODO: refactor
	const pre = printer.printFile(parseFile(__dirname+"/basic_validators.ts"))
	fs.writeFileSync(output+"validators.ts", pre+result)
	console.log("outputting in: " + output+"validators.ts")
}

/* PRINT */
export function nodeString(node: ts.Node): string {
	return `<${ts.SyntaxKind[node.kind]}>`
}

export function printAST(node: ts.Node) {
	console.log("_" + nodeString(node) + " - " + node.getText() + "__")
	let level = 0

	function printSubtree(node: ts.Node) {
		level += 1
		console.log("|-".repeat(level) + "-" + nodeString(node) + " - " + node.getText())
		//console.log(node)
		ts.forEachChild(node, printSubtree)
		level -= 1
	}

	ts.forEachChild(node, printSubtree)
}