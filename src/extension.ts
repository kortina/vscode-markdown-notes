import * as vscode from 'vscode';
import { basename, dirname, normalize, relative } from 'path';
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
} from 'vscode';

class MarkdownFileCompletionItemProvider implements CompletionItemProvider {
  public async provideCompletionItems(
    document: TextDocument,
    position: Position,
    _token: CancellationToken,
    context: CompletionContext
  ) {
    console.log('provideCompletionItems');
    // const c = new vscode.CompletionItem('Hello World!');
    // let currentRange = new Range(position.translate(-1, -1), position.translate(0, 1));
    // capture current line, starting at character zero, going to the 300th character past the current position
    let line = new Range(new Position(position.line, 0), position.translate(0, 300));
    let t = document.getText(line);
    console.log('line:', t);
    let files = (await workspace.findFiles('**/*')).filter(
      f => f.scheme == 'file' && f.path.match(/\.(md|markdown)/i)
    );
    // let paths = files.map(f => workspace.asRelativePath(f.path, false));
    let items = files.map(f => {
      let toPath = f.path;
      // let toDir = dirname(f.path);
      // const fileName = basename(absoluteFilePath);
      let fromDir = dirname(document.uri.path.toString());
      let rel = normalize(relative(fromDir, toPath));
      let kind = CompletionItemKind.File;
      let label = rel;
      return new CompletionItem(label, kind);
    });
    // let workspacePath = (vscode.workspace.workspaceFolders || [])[0];
    // console.log('position', position);
    // console.log('context', context);
    return items;
  }
}

export function activate(context: vscode.ExtensionContext) {
  console.log('vscode-markdown-notes.activate');
  const c = new MarkdownFileCompletionItemProvider();
  const md = { scheme: 'file', language: 'markdown' };
  context.subscriptions.push(vscode.languages.registerCompletionItemProvider(md, c));
}
