import * as vscode from 'vscode';
import { MarkdownDefinitionProvider } from './MarkdownDefinitionProvider';
import { MarkdownReferenceProvider } from './MarkdownReferenceProvider';
import { MarkdownFileCompletionItemProvider } from './MarkdownFileCompletionItemProvider';
import { WorkspaceTagList } from './WorkspaceTagList';
import { newNote, overrideMarkdownWordPattern } from './MarkdownNotebook';
// import { debug } from 'util';
// import { create } from 'domain';
// import { RemarkParser } from './RemarkParser';

export function activate(context: vscode.ExtensionContext) {
  // console.debug('vscode-markdown-notes.activate');
  const md = { scheme: 'file', language: 'markdown' };
  overrideMarkdownWordPattern(); // still nec to get ../ to trigger suggestions in `relativePaths` mode

  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(md, new MarkdownFileCompletionItemProvider())
  );
  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(md, new MarkdownDefinitionProvider())
  );

  context.subscriptions.push(
    vscode.languages.registerReferenceProvider(md, new MarkdownReferenceProvider())
  );

  let newNoteDisposable = vscode.commands.registerCommand('vscodeMarkdownNotes.newNote', newNote);
  context.subscriptions.push(newNoteDisposable);

  // parse the tags from every file in the workspace
  // console.log(`WorkspaceTagList.STARTED_INIT.1: ${WorkspaceTagList.STARTED_INIT}`);
  WorkspaceTagList.initSet();
  // console.log(`WorkspaceTagList.STARTED_INIT.2: ${WorkspaceTagList.STARTED_INIT}`);

  // const treeView = vscode.window.createTreeView('vscodeMarkdownNotesReferences', {
  //   treeDataProvider: new NoteRefsTreeDataProvider(vscode.workspace.rootPath || null),
  // });
}
