import * as vscode from 'vscode';
import { Ref, RefType, getRefAt } from './Ref';
import { NoteWorkspace } from './NoteWorkspace';
import { basename, dirname, join, resolve } from 'path';
import { existsSync, writeFileSync } from 'fs';
import { titleCaseFilename } from './utils';

// Given a document and position, check whether the current word matches one of
// this context: [[wiki-link]]
//
// If so, we look for a file in the current workspace named by the wiki link
// If the file `wiki-link.md` exists, return the first line of that file as the
// Definition for the word.
//
// Optionally, when no existing note is found for the wiki-link
// vscodeMarkdownNotes.createNoteOnGoToDefinitionWhenMissing = true
// AND vscodeMarkdownNotes.workspaceFilenameConvention = 'uniqueFilenames'
// THEN create the missing file at the workspace root.
export class MarkdownDefinitionProvider implements vscode.DefinitionProvider {
  public async provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ) {
    const ref = getRefAt(document, position);
    if (ref.type != RefType.WikiLink) {
      return [];
    }

    let files: Array<vscode.Uri> = [];
    // ref.word might be either:
    // a basename for a unique file in the workspace
    // or, a relative path to a file
    // Since, ref.word is just a string of text from a document,
    // there is no guarantee useUniqueFilenames will tell us
    // it is not a relative path.
    // However, only check for basenames in the entire project if:
    if (NoteWorkspace.useUniqueFilenames()) {
      // there should be exactly 1 file with name = ref.word
      files = (await NoteWorkspace.noteFiles()).filter((f) => {
        return NoteWorkspace.noteNamesFuzzyMatch(f.fsPath, ref.word);
      });
    }
    // If we did not find any files in the workspace,
    // see if a file exists at the relative path:
    if (files.length == 0) {
      const relativePath = ref.word;
      let fromDir = dirname(document.uri.fsPath.toString());
      const absPath = resolve(fromDir, relativePath);
      if (existsSync(absPath)) {
        const f = vscode.Uri.file(absPath);
        files.push(f);
      }
    }

    // else, create the file
    if (files.length == 0) {
      const path = MarkdownDefinitionProvider.createMissingNote(ref);
      if (path !== undefined) {
        files.push(vscode.Uri.file(path));
      }
    }

    const p = new vscode.Position(0, 0);
    return files.map((f) => new vscode.Location(f, p));
  }

  // FIXME: move all of the stuff that deals with create the filename to NoteWorkspace
  static createMissingNote = (ref: Ref): string | undefined => {
    // don't create new files if ref is a Tag
    if (ref.type != RefType.WikiLink) {
      return;
    }
    if (!NoteWorkspace.createNoteOnGoToDefinitionWhenMissing()) {
      return;
    }
    const filename = vscode.window.activeTextEditor?.document.fileName;
    if (filename !== undefined) {
      if (!NoteWorkspace.useUniqueFilenames()) {
        vscode.window.showWarningMessage(
          `createNoteOnGoToDefinitionWhenMissing only works when vscodeMarkdownNotes.workspaceFilenameConvention = 'uniqueFilenames'`
        );
        return;
      }
      let mdFilename = NoteWorkspace.noteFileNameFromTitle(ref.word);
      // by default, create new note in same dir as the current document
      // TODO: could convert this to an option (to, eg, create in workspace root)
      const path = join(dirname(filename), mdFilename);
      const title = titleCaseFilename(ref.word);
      const content = NoteWorkspace.newNoteContent(title);
      // do one final check to make sure we are definitely NOT overwriting an existing file:
      if (existsSync(path)) {
        vscode.window.showWarningMessage(
          `Error creating note, file at path already exists: ${path}`
        );
        return;
      }
      writeFileSync(path, content);
      return path;
    }
  };
}
