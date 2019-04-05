import { readFileSync } from "fs";
import * as ts from "typescript"

import * as Util from "./Util"

const fileNames = process.argv.slice(2);
// Create code file containing the basic validators
// and the dynamically generated validators from
// the input files

Util.createFile(
	Util.makeBoundaryValidators(fileNames)
)

//Util.mapFiles(fileNames, Util.printAST)

//Util.printAST(Util.parseFile("basic_validators.ts"))