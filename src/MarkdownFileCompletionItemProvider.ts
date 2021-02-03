import * as vscode from 'vscode';
import { RefType, getRefOrEmptyRefAt } from './Ref';
import { NoteWorkspace } from './NoteWorkspace';
import { NoteParser } from './NoteParser';
import { BibTeXCitations } from './BibTeXCitations';

class MarkdownFileCompletionItem extends vscode.CompletionItem {
  fsPath?: string;

  constructor(label: string, kind?: vscode.CompletionItemKind, fsPath?: string) {
    super(label, kind);
    this.fsPath = fsPath;
  }
}
// Given a document and position, check whether the current word matches one of
// these 3 contexts:
// 1. [[wiki-links]]
// 2. #tags
// 3. @bibtext-reference
//
// If so, provide appropriate completion items from the current workspace
export class MarkdownFileCompletionItemProvider implements vscode.CompletionItemProvider {
  public async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ) {
    const ref = getRefOrEmptyRefAt(document, position);
    switch (ref.type) {
      case RefType.Null:
        return [];
      case RefType.Tag:
        return (await NoteParser.distinctTags()).map((t) => {
          let kind = vscode.CompletionItemKind.File;
          let label = `${t}`; // cast to a string
          let item = new vscode.CompletionItem(label, kind);
          if (ref && ref.range) {
            item.range = ref.range;
          }
          return item;
        });
      case RefType.WikiLink:
        return (await NoteWorkspace.noteFiles()).map((f) => {
          let kind = vscode.CompletionItemKind.File;
          let label = NoteWorkspace.wikiLinkCompletionForConvention(f, document);
          let item = new MarkdownFileCompletionItem(label, kind, f.fsPath);
          if (ref && ref.range) {
            item.range = ref.range;
          }
          return item;
        });
      case RefType.BibTeX:
        return (await BibTeXCitations.citations()).map((r) => {
          let kind = vscode.CompletionItemKind.File;
          let label = `${r}`; // cast to a string
          let item = new vscode.CompletionItem(label, kind);
          return item;
        });
      default:
        return [];
    }
  }

  public async resolveCompletionItem(
    item: MarkdownFileCompletionItem,
    token: vscode.CancellationToken
  ): Promise<MarkdownFileCompletionItem> {
    const fsPath = item.fsPath;
    if (fsPath) {
      let note = NoteParser.noteFromFsPath(fsPath);
      if (note) {
        item.detail = note.title?.text;
        item.documentation = note.documentation();
      }
    }
    return item;
  }
}
