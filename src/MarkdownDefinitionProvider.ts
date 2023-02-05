import * as vscode from 'vscode';
import { Ref, RefType, getRefAt } from './Ref';
import { NoteWorkspace } from './NoteWorkspace';
import { basename, dirname, join, resolve } from 'path';
import { existsSync, writeFileSync } from 'fs';
import { titleCaseFromFilename } from './utils';
import { BibTeXCitations } from './BibTeXCitations';

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
    if (ref.type == RefType.BibTeX) {
      return await BibTeXCitations.location(ref.word);
    }
    if (ref.type != RefType.WikiLink && ref.type != RefType.Hyperlink) {
      return [];
    }

    let files: Array<vscode.Uri> = [];
    files = await MarkdownDefinitionProvider.filesForWikiLinkRef(ref, document);

    // else, create the file
    if (files.length == 0) {
      const path = await MarkdownDefinitionProvider.createMissingNote(ref);
      if (path !== undefined) {
        files.push(vscode.Uri.file(path));
      }
    }

    const p = new vscode.Position(0, 0);
    return files.map((f) => new vscode.Location(f, p));
  }

  static async filesForWikiLinkRef(
    ref: Ref,
    relativeToDocument: vscode.TextDocument | undefined | null
  ): Promise<Array<vscode.Uri>> {
    let files: Array<vscode.Uri> = await NoteWorkspace.noteFiles();
    return this._filesForWikiLinkRefAndNoteFiles(ref, relativeToDocument, files);
  }

  static filesForWikiLinkRefFromCache(
    ref: Ref,
    relativeToDocument: vscode.TextDocument | undefined | null
  ) {
    let files = NoteWorkspace.noteFilesFromCache(); // TODO: cache results from NoteWorkspace.noteFiles()
    return this._filesForWikiLinkRefAndNoteFiles(ref, relativeToDocument, files);
  }

  // Brunt of the logic for either
  // filesForWikiLinkRef
  // or, filesForWikiLinkRefFromCache
  static _filesForWikiLinkRefAndNoteFiles(
    ref: Ref,
    relativeToDocument: vscode.TextDocument | undefined | null,
    noteFiles: Array<vscode.Uri>
  ): Array<vscode.Uri> {
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
      files = noteFiles.filter((f) => {
        return NoteWorkspace.noteNamesFuzzyMatch(f.fsPath, ref.word);
      });
    }
    // If we did not find any files in the workspace,
    // see if a file exists at the relative path:
    if (files.length == 0 && relativeToDocument && relativeToDocument.uri) {
      const relativePath = ref.word;
      let fromDir = dirname(relativeToDocument.uri.fsPath.toString());
      const absPath = resolve(fromDir, relativePath);
      if (existsSync(absPath)) {
        const f = vscode.Uri.file(absPath);
        files.push(f);
      }
    }
    return files;
  }

  static  createMissingNote = async (ref: Ref): Promise<string | undefined> => {
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
      const title = NoteWorkspace.stripExtension(ref.word);
      const { filepath, fileAlreadyExists } = await NoteWorkspace.createNewNoteFile(title);
      return filepath;
    }
  };
}
