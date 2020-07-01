import * as vscode from 'vscode';
import { BacklinksTreeDataProvider } from './BacklinksTreeDataProvider';
import { MarkdownDefinitionProvider } from './MarkdownDefinitionProvider';
import { MarkdownReferenceProvider } from './MarkdownReferenceProvider';
import { MarkdownFileCompletionItemProvider } from './MarkdownFileCompletionItemProvider';
import { WorkspaceTagList } from './WorkspaceTagList';
import { NoteWorkspace } from './NoteWorkspace';
import { ReferenceSearch } from './ReferenceSearch';
// import { debug } from 'util';
// import { create } from 'domain';

export function activate(context: vscode.ExtensionContext) {
  // console.debug('vscode-markdown-notes.activate');
  const md = { scheme: 'file', language: 'markdown' };
  NoteWorkspace.overrideMarkdownWordPattern(); // still nec to get ../ to trigger suggestions in `relativePaths` mode

  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(md, new MarkdownFileCompletionItemProvider())
  );
  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(md, new MarkdownDefinitionProvider())
  );

  context.subscriptions.push(
    vscode.languages.registerReferenceProvider(md, new MarkdownReferenceProvider())
  );

  vscode.workspace.onDidChangeTextDocument((e: vscode.TextDocumentChangeEvent) => {
    console.log('onDidChangeTextDocument', e);
    ReferenceSearch.updateCacheFor(e.document.uri.fsPath);
  });

  let newNoteDisposable = vscode.commands.registerCommand(
    'vscodeMarkdownNotes.newNote',
    NoteWorkspace.newNote
  );
  context.subscriptions.push(newNoteDisposable);

  // parse the tags from every file in the workspace
  WorkspaceTagList.initSet();

  const backlinksTreeDataProvider = new BacklinksTreeDataProvider(
    vscode.workspace.rootPath || null
  );
  vscode.window.onDidChangeActiveTextEditor(() => backlinksTreeDataProvider.reload());
  const treeView = vscode.window.createTreeView('vscodeMarkdownNotesBacklinks', {
    treeDataProvider: backlinksTreeDataProvider,
  });
}
