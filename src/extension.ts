import * as vscode from 'vscode';
import { basename, dirname, join, normalize, relative, resolve } from 'path';
import { existsSync } from 'fs';
import {
  CompletionItemProvider,
  TextDocument,
  Position,
  CancellationToken,
  CompletionContext,
  workspace,
  Range,
  CompletionItem,
  commands,
  CompletionItemKind,
  TextEdit,
  DocumentSymbol,
  Uri,
} from 'vscode';

function uniqueFilenamesConfiguration(): boolean {
  let cfg = vscode.workspace.getConfiguration('vscodeMarkdownNotes');
  let convention = cfg.get('workspaceFilenameConvention');
  console.log('convention', convention);
  return convention == 'uniqueFilenames';
}

function filenameForConvention(uri: Uri, fromDocument: TextDocument): string {
  if (uniqueFilenamesConfiguration()) {
    return basename(uri.path);
  } else {
    let toPath = uri.path;
    let fromDir = dirname(fromDocument.uri.path.toString());
    let rel = normalize(relative(fromDir, toPath));
    return rel;
  }
}

class MarkdownFileCompletionItemProvider implements CompletionItemProvider {
  public async provideCompletionItems(
    document: TextDocument,
    position: Position,
    _token: CancellationToken,
    context: CompletionContext
  ) {
    console.log('provideCompletionItems');
    // capture current line, starting at character zero, going to the 300th character past the current position. TODO: use -1 for end of line instead
    let line = new Range(new Position(position.line, 0), position.translate(0, 300));
    let t = document.getText(line);
    console.log('line:', t);
    let files = (await workspace.findFiles('**/*')).filter(
      // TODO: paramaterize extensions
      f => f.scheme == 'file' && f.path.match(/\.(md|markdown)/i)
    );
    let items = files.map(f => {
      let kind = CompletionItemKind.File;
      let label = filenameForConvention(f, document);
      return new CompletionItem(label, kind);
    });
    return items;
  }
}

// TODO: read this!
// https://stackoverflow.com/questions/54285472/vscode-how-to-automatically-jump-to-proper-definition
class MarkdownDefinitionProvider implements vscode.DefinitionProvider {
  public async provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ) {
    console.log('provideDefinition');

    const p = new vscode.Position(0, 0);

    // TODO: paramaterize extensions
    const markdownFileRegex = /[\w\.\-\_\/\\]+\.(md|markdown)/i;
    const range = document.getWordRangeAtPosition(position, markdownFileRegex);
    const selectedWord = document.getText(range);
    console.log('selectedWord', selectedWord);
    let files: Array<Uri> = [];
    // selectedWord might be either:
    // a basename for a unique file in the workspace
    // or, a relative path to a file
    // Since, selectedWord is just a string of text from a document,
    // there is no guarantee uniqueFilenamesConfiguration will tell us
    // it is not a relative path.
    // However, only check for basenames in the entire project if:
    if (uniqueFilenamesConfiguration()) {
      const filename = selectedWord;
      // there should be exactly 1 file with name = selecteWord
      files = (await workspace.findFiles('**/*')).filter(f => {
        return basename(f.path) == filename;
      });
    }
    // If we did not find any files in the workspace,
    // see if a file exists at the relative path:
    if (files.length == 0) {
      const relativePath = selectedWord;
      let fromDir = dirname(document.uri.path.toString());
      const absPath = resolve(fromDir, relativePath);
      if (existsSync(absPath)) {
        const f = Uri.file(absPath);
        files.push(f);
      }
    }

    return files.map(f => new vscode.Location(f, p));
  }
}

export function activate(context: vscode.ExtensionContext) {
  console.log('vscode-markdown-notes.activate');
  const md = { scheme: 'file', language: 'markdown' };
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(md, new MarkdownFileCompletionItemProvider())
  );
  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(md, new MarkdownDefinitionProvider())
  );
}
