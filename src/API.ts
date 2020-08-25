import * as vscode from 'vscode';
import { MarkdownDefinitionProvider } from './MarkdownDefinitionProvider';
import { Note, NoteParser } from './NoteParser';
import { NoteWorkspace } from './NoteWorkspace';
import { refFromWikiLinkText } from './Ref';

// This class serves as the public interface to commands that this extension exposes.
export class API {
  // Use vscode.window.showInputBox
  // to prompt user for a new note name
  // and create it upon entry.
  static newNote(context: vscode.ExtensionContext) {
    return NoteWorkspace.newNote(context);
  }

  // Given some wiki-link text (from between double-brackets) such as "my-note" or "my-note.md"
  // return a Note[] (typically of length 1)
  // where the note filename is a match for the wiki-link text.
  // and
  // type Note = {
  //   fsPath: string; // filesystem path to the Note
  //   data: string; // text contents of the Note
  // };
  //
  // example:
  // let notes = await vscode.commands.executeCommand('vscodeMarkdownNotes.notesForWikiLink', 'demo');
  static async notesForWikiLink(
    wikiLinkText: string,
    relativeToDocument: vscode.TextDocument | undefined | null
  ): Promise<Note[]> {
    const ref = refFromWikiLinkText(wikiLinkText);
    let files: Array<vscode.Uri> = await MarkdownDefinitionProvider.filesForWikiLinkRef(
      ref,
      relativeToDocument
    );
    let notes: Note[] = (files || [])
      .filter((f) => f.fsPath)
      .map((f) => NoteParser.noteFromFsPath(f.fsPath))
      // see: https://stackoverflow.com/questions/43010737/way-to-tell-typescript-compiler-array-prototype-filter-removes-certain-types-fro
      .filter((n): n is Note => {
        return n != undefined;
      });
    return Promise.resolve(notes);
  }
}
