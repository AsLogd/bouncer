#! /usr/bin/env node
import { readFileSync } from "fs";
import * as ts from "typescript"

import * as Util from "./Util"

const outputIndex = process.argv.indexOf("-o")
let output = "."
let fileNames
if (outputIndex > -1) {
	fileNames = process.argv.slice(2, outputIndex)
	output = process.argv.slice(outputIndex)[1]
} else {
	fileNames = process.argv.slice(2)
}

// Create code file containing the basic validators
// and the dynamically generated validators from
// the input files
Util.createFile(
	Util.makeBoundaryValidators(fileNames, output),
	output
)

//Util.mapFiles(fileNames, Util.printAST)

//Util.printAST(Util.parseFile("basic_validators.ts"))