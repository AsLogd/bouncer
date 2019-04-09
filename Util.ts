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

/**
 * Given an interface I, creates a validator declaration that checks
 * if a given object implements I in execution time
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

	const memberValidatorCalls: ts.Expression[] = inode.members.map(m => {
		const prop = m as ts.PropertySignature
		const memberAccess = ts.createPropertyAccess(paramName, m.name.getText())
		const type = checker.getTypeAtLocation(prop.type)
		let validatorName, validatorCall
		if (type.symbol
			&& type.symbol.valueDeclaration
			&& ts.isEnumDeclaration(type.symbol.valueDeclaration))
		{
			validatorName = ts.createIdentifier("isValidEnum")
			const enumId = ts.createIdentifier(type.symbol.name)
			validatorCall = ts.createCall(
				validatorName,
				[ts.createTypeQueryNode(enumId)],
				[enumId, memberAccess]
			)
		}
		else
		{
			validatorName = ts.createIdentifier("isValid"+prop.type.getText())
			validatorCall = ts.createCall(validatorName, undefined, [memberAccess])
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
		}
		if (imports.length) {
			const aux = file.fileName.split("/")
			const moduleName = aux.slice(-1)[0].split(".")[0]
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