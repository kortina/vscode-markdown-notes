#!/usr/bin/env node
//
// Given a file path and a line number, return the bdd-style name of the spec (as in concatenating
// the first arg to all nested `describe`, `context`, and `it` calls) at the given line number.
//
// If you're e.g. between `it` statements, it'll return the name part up to this point.
//

'use strict';
type FixMe = any;

let babylon = require('babylon');
let fs = require('fs');

let bddFunctionNames = ['describe', 'context', 'it', 'test'];

function constructJasmineSpecDescriptionAtLine(
  ast_body: FixMe,
  lineNumber: FixMe,
  descriptionParts: FixMe
): FixMe {
  // At the level of this ast body, there can only be one statement that contains the given line.

  // For debugging:
  //console.error(`in recursive with current Description: '${descriptionParts}'`);

  // Look at all bdd expressions
  let bddExpressionStatements = ast_body.filter((val: FixMe) => {
    return (
      val.type == 'ExpressionStatement' &&
      val.expression.callee &&
      bddFunctionNames.indexOf(val.expression.callee.name) >= 0
    );
  });

  // Find the one if any that contains this line number
  let es = bddExpressionStatements.find((val: FixMe) => {
    return val.loc.start.line <= lineNumber && val.loc.end.line >= lineNumber;
  });

  if (es === undefined) {
    return descriptionParts;
  }
  let newDescriptionParts = descriptionParts.concat([es.expression.arguments[0].value]);
  let innerBody = es.expression.arguments[1].body.body;
  return constructJasmineSpecDescriptionAtLine(innerBody, lineNumber, newDescriptionParts);
}

function main(file: FixMe, lineNumber: FixMe) {
  let ast = babylon.parse(fs.readFileSync(file, 'utf8'), {
    sourceType: 'module',
    plugins: ['jsx', 'flow', 'objectRestSpread'],
  });
  let descriptionParts = constructJasmineSpecDescriptionAtLine(ast.program.body, lineNumber, []);
  let description = descriptionParts.join(' ');
  return description;
}

function parseAndValidateArgs(args: FixMe) {
  let usage_line = 'Usage: ./test-at-line.js <file-path>:<line number>';

  let fileAndLineArg = args[2];
  if (fileAndLineArg === undefined) {
    console.error(usage_line);
    process.exit(2);
  }

  let parts = fileAndLineArg.split(':');
  if (parts.length != 2) {
    console.error(usage_line);
    process.exit(2);
  }
  let filePath = parts[0];
  let lineNumber = parseInt(parts[1]);
  return [filePath, lineNumber];
}

if (require.main === module) {
  let args = parseAndValidateArgs(process.argv);
  let description = main(args[0], args[1]);
  console.log(description);
}
