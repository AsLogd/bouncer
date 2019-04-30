import * as fs from "fs";
import * as path from "path"
import * as ts from "typescript"

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

function makeTypeAliasValidator(tanode: ts.TypeAliasDeclaration, checker: ts.TypeChecker): ts.FunctionDeclaration {
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
	/*
	console.log("=========Type Alias:==========")
	console.log(name)
	console.log(tanode)
	*/

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

/**
 * Given an interface I, creates a validator declaration that checks
 * if a given object implements I in execution time
 * TODO: refactor
 */
function makeInterfaceValidator(inode: ts.InterfaceDeclaration, checker: ts.TypeChecker): ts.FunctionDeclaration {
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

	let checkUndefined: ts.Expression = ts.createStrictInequality(
		ts.createTypeOf(paramName),
		ts.createStringLiteral("undefined")
	)
	/*
	console.log("=========Interface:==========")
	console.log(name)
	*/
	const memberValidatorCalls: ts.Expression[] = inode.members.map(m => {
		const prop = m as ts.PropertySignature
		const memberAccess = ts.createPropertyAccess(paramName, m.name.getText())
		const type = checker.getTypeAtLocation(prop.type)
		const nodeType = checker.typeToTypeNode(type)
		/*
		console.log("=========member:==========")
		console.log(ts.SyntaxKind[prop.kind])
		console.log(prop)
		if(type.symbol){
			console.log("===symbol")
			console.log(type.symbol)
			console.log("===isArray")
			console.log(ts.isArrayTypeNode(nodeType))
			console.log("===baseType")
			if(ts.isArrayTypeNode(nodeType)) {
				//console.log(nodeType.elementType)
				if(ts.isTypeReferenceNode(nodeType.elementType)) {
					if(ts.isEntityName(nodeType.elementType.typeName)) {
						console.log((nodeType.elementType.typeName as any).symbol.getName())
					}
				}

			}

		}
		*/
		let validatorName, validatorCall
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
	})

	memberValidatorCalls.unshift(checkUndefined)

	const statements = [ts.createReturn(
		memberValidatorCalls.reduce(ts.createLogicalAnd)
	)]

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
function isBoundary(statement: ts.Statement): statement is ts.InterfaceDeclaration {
	return ts.getJSDocTags(statement).some(s =>
			s.getText() === BOUNDARY_JSDOC_TAG
		)
}

/**
 * Creates validators for the boundary interfaces found in 'file'
 */
export function makeBoundaryValidators(files: string[], outputPath: string) {
	// Build a program using the set of root file names in fileNames
	let program = ts.createProgram(files, {});

	// Get the checker, we will use it to find more about interfaces
	let checker = program.getTypeChecker();
	const importNodes: ts.Node[] = []
	const nodes: ts.Node[] = []
	for (let file of program.getSourceFiles()) {
		let imports = []
		for (let statement of file.statements) {
			if (ts.isEnumDeclaration(statement)
				&& isBoundary(statement)) {
				imports.push(statement.name)
			}
			if (ts.isInterfaceDeclaration(statement)
				&& isBoundary(statement)) {
				imports.push(statement.name)
				nodes.push(
					makeInterfaceValidator(statement, checker)
				)
			}
			if(ts.isTypeAliasDeclaration(statement)
				&& isBoundary(statement)) {
				imports.push(statement.name)
				nodes.push(
					makeTypeAliasValidator(statement, checker)
				)
			}
		}
		if (imports.length) {
			const aux = file.fileName.split("/")
			// get filename without extension
			const moduleName = aux.slice(-1)[0].split(".").slice(0, -1)
			const op = aux.slice(0, -1).join("/")
			const p = path.relative(outputPath, op) || '.'
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
						p + "/" + moduleName
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
	return`<${ts.SyntaxKind[node.kind]}>`
}

export function printAST(node: ts.Node) {
	console.log("_")
	let level = 0

	function printSubtree(node: ts.Node) {
		level += 1
		console.log("|-".repeat(level) + "-" + nodeString(node))
		console.log(node)
		ts.forEachChild(node, printSubtree)
		level -= 1
	}

	ts.forEachChild(node, printSubtree)
}