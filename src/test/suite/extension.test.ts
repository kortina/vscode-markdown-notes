import * as assert from 'assert';
var chai = require('chai');
var expect = chai.expect; // Using Expect style

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
// import * as myExtension from '../../extension';
import { ReferenceSearch } from '../../extension';

suite('Extension Test Suite', () => {
  // vscode.window.showInformationMessage('Start all tests.');

  test('Sample test', () => {
    assert.equal([1, 2, 3].indexOf(5), -1);
    assert.equal([1, 2, 3].indexOf(0), -1);
  });
});

let document = `line0 word1
line1 word1 word2 
  [[test.md]]  #tag #another_tag  <- link at line2, chars 2-12
^ tags at line2 chars 15-19 and 21-32
[[test.md]] <- link at line4, chars 0-11
[[demo.md]] <- link at line5, chars 0-11
#tag word`; // line 5, chars 0-3
suite('ReferenceSearch', () => {
  // vscode.window.showInformationMessage('Start ReferenceSearch.');

  test('rangesForWordInDocumentData', () => {
    expect(ReferenceSearch.rangesForWordInDocumentData('[[test.md]]', document)).to.eql([
      new vscode.Range(new vscode.Position(2, 2), new vscode.Position(2, 12)),
      new vscode.Range(new vscode.Position(4, 0), new vscode.Position(4, 10)),
    ]);
    expect(ReferenceSearch.rangesForWordInDocumentData('#tag', document)).to.eql([
      new vscode.Range(new vscode.Position(2, 15), new vscode.Position(2, 18)),
      new vscode.Range(new vscode.Position(6, 0), new vscode.Position(6, 3)),
    ]);
  });
});
