import * as vscode from 'vscode';
import { RefType, getRefAt } from './Ref';
import { NoteWorkspace } from './NoteWorkspace';
import { NoteParser, Note } from './NoteParser';

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
    let items = [];
    switch (ref.type) {
      case RefType.Null:
        return [];
        break;
      case RefType.Tag:
        items = (await NoteParser.distinctTags()).map((t) => {
          let kind = vscode.CompletionItemKind.File;
          let label = `${t}`; // cast to a string
          let item = new vscode.CompletionItem(label, kind);
          if (ref && ref.range) {
            item.range = ref.range;
          }
          return item;
        });
        return items;
        break;
      case RefType.WikiLink:
        let files = await NoteWorkspace.noteFiles();
        items = files.map((f) => {
          let kind = vscode.CompletionItemKind.File;
          let label = NoteWorkspace.wikiLinkCompletionForConvention(f, document);
          let item = new vscode.CompletionItem(label, kind);
          if (ref && ref.range) {
            item.range = ref.range;
          }
          return item;
        });
        return items;
        break;
      default:
        return [];
        break;
    }
  }
}
