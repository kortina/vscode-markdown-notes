import * as vscode from 'vscode';
import { basename, dirname, join, normalize, relative } from 'path';
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
  provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Definition> {
    console.log('provideDefinition');

    const markdownFileRegex = /[\w\.\-\_\/\\]+\.(md|markdown)/i;
    const range = document.getWordRangeAtPosition(position, markdownFileRegex);
    const selectedWord = document.getText(range);
    console.log('selectedWord', selectedWord);

    // TODO: find the file named selected-word.md
    const workspace = vscode.workspace.getWorkspaceFolder(document.uri);
    const root = workspace ? workspace.uri : document.uri;
    const f = root.with({
      path: join(root.path, 'test.md'),
    });
    const p = new vscode.Position(0, 0);
    const l = new vscode.Location(f, p);
    return [l];
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
