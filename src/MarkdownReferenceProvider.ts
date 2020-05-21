import * as vscode from 'vscode';
import { ReferenceSearch } from './ReferenceSearch';
import { getContextWord } from './ContextWord';

export class MarkdownReferenceProvider implements vscode.ReferenceProvider {
  public provideReferences(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.ReferenceContext,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Location[]> {
    // console.debug('MarkdownReferenceProvider.provideReferences');
    const contextWord = getContextWord(document, position);
    // debugContextWord(contextWord);
    return ReferenceSearch.search(contextWord);
  }
}
