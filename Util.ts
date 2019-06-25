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

	const paramName = ts.createIdentifier("data");
	const parameter = ts.createParameter(
		/*decorators*/ undefined,
		/*modifiers*/ undefined,
		/*dotDotDotToken*/ undefined,
		paramName,
		/*questionToken*/ undefined,
		/*type*/ ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
	);

	const typeValidatorCalls: ts.Expression[] = []

	tanode.type.forEachChild((child) => {
		const type = checker.getTypeAtLocation(child)
		const nodeType = checker.typeToTypeNode(type)
		const name = type.aliasSymbol
			? type.aliasSymbol.getName()
			: type.getSymbol().getName()
		const validatorName = ts.createIdentifier("isValid"+name)
		const validatorCall = ts.createCall(validatorName, undefined, [paramName])
		typeValidatorCalls.push(validatorCall)
	})

	const statements = [ts.createReturn(
		typeValidatorCalls.reduce(ts.createLogicalOr)
	)]

	const typeAliasSymbol = checker.getSymbolAtLocation(tanode.name)
	const typeAliasType = checker.typeToTypeNode(
		checker.getDeclaredTypeOfSymbol(typeAliasSymbol)
	)
	const returnType = ts.createTypePredicateNode(paramName, typeAliasType)

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

function makeTypeValidator(id: ts.Expression, tnode: ts.Node): ts.Expression {
	// In case of unhandled type
	const validatorAny = ts.createIdentifier("isValidany")
	let validatorCall: ts.Expression = ts.createCall(validatorAny, [], [id])

	// If type is an array, validator must:
	if (ts.isArrayTypeNode(tnode))
	{
		// -Check array type
		const arrayGlobal = ts.createIdentifier("Array")
		const isArrayId = ts.createPropertyAccess(arrayGlobal, "isArray")
		// -Check that every element is of the base type
		// 		<id>.every( x => *childValidator(x)* )
		// 		<id>.every is defined because we know it's an array
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
			// Array type has to have at least one child
			makeTypeValidator(paramName, tnode.getChildAt(0))
		)

		validatorCall = ts.createLogicalAnd(
			ts.createCall(
				isArrayId,
				[],
				[id]
			),
			ts.createCall(
				everyValidator,
				[],
				[everyValidatorBody]
			)
		)
	} else if (ts.isTypeReferenceNode(tnode)) {
		const type = checker.getTypeAtLocation(tnode.getChildAt(0))
		const symbol = type.getSymbol() || type.aliasSymbol
		if (symbolIsInterface(symbol) || symbolIsAlias(symbol)) {
			// if it's an interface or alias, we just call the validator
			const validatorName = ts.createIdentifier("isValid"+symbol.getName())
			// isValid<typeName>(<id>)
			validatorCall = ts.createCall(
				validatorName,
				[],
				[id]
			)
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
/*
function makeMemberValidator(paramName: ts.Identifier): (m: ts.PropertySignature) => ts.Expression {
	return (m) => {
		const prop = m as ts.PropertySignature
		const memberAccess = ts.createPropertyAccess(paramName, m.name.getText())
		const type = checker.getTypeAtLocation(prop.type)
		const nodeType = checker.typeToTypeNode(type)
//		const validatorCall = makeTypeValidator(memberAccess, type)
		const validatorCall: any = null
		const children = []
		ts.forEachChild(m, (c) => {
			console.log(nodeString(c))
			console.log(c)
		})


		// Is the member an array?

		if (ts.isArrayTypeNode(nodeType) && ts.isTypeReferenceNode(nodeType.elementType)) {
			// Type of single element in the array
			const elementType = (nodeType as any).elementType.typeName
			const typeName = ts.createIdentifier(elementType.symbol.getName())
			const arrayGlobal = ts.createIdentifier("Array")
			const isArrayId = ts.createPropertyAccess(arrayGlobal, "isArray")
			const everyName = ts.createIdentifier("every");
			const everyValidator = ts.createPropertyAccess(memberAccess, everyName)
			// Is the element type an enum?
			if (elementType.symbol && elementType.symbol.valueDeclaration && ts.isEnumDeclaration(elementType.symbol.valueDeclaration)) {
				validatorName = ts.createIdentifier("isValidEnumArray")
				// data.<member>.every is defined because we know it's an array
				// isValidEnumArray<typeof <enumId>>(<enumId>)
				const validatorIncomplete = ts.createCall(
					validatorName,
					[ts.createTypeQueryNode(typeName)],
					[typeName]
				)
				// data.<member> !== "undefined" && data.<member>.every(isValidEnumArray<typeof <enumId>>(<enumId>))
				validatorCall = ts.createLogicalAnd(
					ts.createCall(isArrayId, [], [memberAccess]),
					ts.createCall(
						everyValidator,
						[],
						[validatorIncomplete]
					)
				)
			}
			// Interface
			else {
				validatorName = ts.createIdentifier("isValid"+typeName.text)
				validatorCall = ts.createLogicalAnd(
					ts.createCall(isArrayId, [], [memberAccess]),
					ts.createCall(
						everyValidator,
						[],
						[validatorName]
					)
				)
			}
		}
		// Non array
		else {
			//TODO: something wrong with single value enums
			if (type.symbol && type.symbol.valueDeclaration && ts.isEnumDeclaration(type.symbol.valueDeclaration)) {
				// Enum identifier (type name)
				const enumId = ts.createIdentifier(type.symbol.name)
				validatorName = ts.createIdentifier("isValidEnum")
				validatorCall = ts.createCall(
					validatorName,
					[ts.createTypeQueryNode(enumId)],
					[enumId, memberAccess]
				)
			}
			else {
				validatorName = ts.createIdentifier("isValid"+prop.type.getText())
				validatorCall = ts.createCall(validatorName, undefined, [memberAccess])
			}
		}

		if(prop.questionToken)
		{
			// Can't find a way to compare with undefined keyword
			return ts.createLogicalOr(
				ts.createStrictEquality(
					ts.createTypeOf(memberAccess),
					ts.createStringLiteral("undefined")
				),
				validatorCall
			)
		}

		return validatorCall
	}
}
*/

function makeMemberValidator(paramName: ts.Identifier): (member: ts.PropertySignature) => ts.Expression {
	return (member) => {
		// Expression to access <member>
		let memberAccess = ts.createPropertyAccess(paramName, member.name.getText())
		// Expression that validates the member's type
		let validatorCall = makeTypeValidator(memberAccess, member.type)

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

		return validatorCall
	}
}

/**
 * Given an interface I, creates a validator declaration that checks
 * if a given object implements I in execution time
 * TODO: refactor
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

	// The interface can't be undefined nor null, we are going to check its members
	let checkUndefined: ts.Expression = ts.createLogicalAnd(
		ts.createStrictInequality(
			ts.createTypeOf(paramName),
			ts.createStringLiteral("undefined")
		),
		ts.createStrictInequality(
			paramName,
			ts.createNull()
		)
	)

	// List of expressions that validate each member
	const memberValidatorCalls: ts.Expression[] = inode.members.map(
		makeMemberValidator(paramName)
	)

	// First check undefined
	memberValidatorCalls.unshift(checkUndefined)

	// All expressions must be true for the interface to be valid
	const statements = [ts.createReturn(
		memberValidatorCalls.reduce(ts.createLogicalAnd)
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
		if(files.every((x) => file.fileName.indexOf(x) === -1))
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
			const aux = file.fileName.split("/")
			// get filename without extension
			const moduleName = aux.slice(-1)[0].split(".").slice(0, -1).join(".")
			const op = aux.slice(0, -1).join("/")
			const p = path.relative(outputPath, op)
			const pre = p ? './' : '.'
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
						pre + p + '/' + moduleName
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
	fs.writeFileSync(output+"/validators.ts", pre+result)
	console.log("outputting in: " + output+"/validators.ts")
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