import * as vscode from 'vscode';
import { RefType, getRefAt } from './Ref';
import { NoteWorkspace } from './NoteWorkspace';
import { NoteParser } from './NoteParser';

class MarkdownFileCompletionItem extends vscode.CompletionItem {
  fsPath?: string;

  constructor(label: string, kind?: vscode.CompletionItemKind, fsPath?: string) {
    super(label, kind);
    this.fsPath = fsPath;
  }
}
// Given a document and position, check whether the current word matches one of
// these 2 contexts:
// 1. [[wiki-links]]
// 2. #tags
//
// If so, provide appropriate completion items from the current workspace
export class MarkdownFileCompletionItemProvider implements vscode.CompletionItemProvider {
  public async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ) {
    const ref = getRefAt(document, position);
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
      item.detail = note.title;
      item.documentation = note.documentation();
    }
    return item;
  }
}
