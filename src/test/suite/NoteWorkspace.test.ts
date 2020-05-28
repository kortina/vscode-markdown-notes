import * as assert from 'assert';
var chai = require('chai');
var expect = chai.expect; // Using Expect style

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
// import * as myExtension from '../../extension';
import { NoteWorkspace } from '../../NoteWorkspace';

suite('uriMaatchesNoteName', () => {
  test('uriMatchesNoteName', () => {
    expect(
      NoteWorkspace.uriMatchesNoteName(
        vscode.Uri.parse('dir/sub/the-heat-is-on.md'),
        'the-heat-is-on.md'
        // 'The Heat Is On'
      )
    ).to.equal(true);
  });
});
