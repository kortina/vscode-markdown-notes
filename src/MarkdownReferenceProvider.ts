import * as vscode from 'vscode';
import { NoteParser } from './NoteParser';
import { getRefAt } from './Ref';

export class MarkdownReferenceProvider implements vscode.ReferenceProvider {
  public provideReferences(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.ReferenceContext,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Location[]> {
    // console.debug('MarkdownReferenceProvider.provideReferences');
    const ref = getRefAt(document, position);
    // debugRef(ref);
    return NoteParser.search(ref);
  }
}
