import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  console.log('vscode-markdown-notes.activate');
  let _provideCompletionItems = {
    provideCompletionItems(
      document: vscode.TextDocument,
      position: vscode.Position,
      token: vscode.CancellationToken,
      context: vscode.CompletionContext
    ) {
      console.log('provider');
      const c = new vscode.CompletionItem('Hello World!');
      return [c];
    },
  };
  const md = { scheme: 'file', language: 'markdown' };

  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider('plaintext', _provideCompletionItems)
  );

  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider('markdown', _provideCompletionItems)
  );

  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(md, _provideCompletionItems)
  );
}
