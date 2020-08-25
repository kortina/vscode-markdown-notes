/* 
A `Ref` is a match for:

- a [[wiki-link]]
- a #tag

in the content of a Note document in your workspace.

*/
import * as vscode from 'vscode';
import { NoteWorkspace } from './NoteWorkspace';

export enum RefType {
  Null, // 0
  WikiLink, // 1
  Tag, // 2
}

export interface Ref {
  type: RefType;
  word: string;
  hasExtension: boolean | null;
  range: vscode.Range | undefined;
}

export const debugRef = (ref: Ref) => {
  const { type, word, hasExtension, range } = ref;
  console.debug({
    type: RefType[ref.type],
    word: ref.word,
    hasExtension: ref.hasExtension,
    range: ref.range,
  });
};

export const NULL_REF = {
  type: RefType.Null,
  word: '',
  hasExtension: null,
  range: undefined,
};

export function getRefAt(document: vscode.TextDocument, position: vscode.Position): Ref {
  let ref: string;
  let regex: RegExp;
  let range: vscode.Range | undefined;

  // let rp = new RemarkParser(document.getText());
  // rp.walkWikiLinksAndTags();
  // let currentNode = rp.getNodeAtPosition(position);

  // #tag regexp
  regex = NoteWorkspace.rxTagNoAnchors();
  range = document.getWordRangeAtPosition(position, regex);
  if (range) {
    // here we do nothing to modify the range because the replacements
    // will include the # character, so we want to keep the leading #
    ref = document.getText(range);
    if (ref) {
      return {
        type: RefType.Tag,
        word: ref.replace(/^\#+/, ''),
        hasExtension: null,
        range: range,
      };
    }
  }

  regex = NoteWorkspace.rxWikiLink();
  range = document.getWordRangeAtPosition(position, regex);
  if (range) {
    // Our rxWikiLink contains [[ and ]] chars
    // but the replacement words do NOT.
    // So, account for the (exactly) 2 [[  chars at beginning of the match
    // since our replacement words do not contain [[ chars
    let s = new vscode.Position(range.start.line, range.start.character + 2);
    // And, account for the (exactly) 2 ]]  chars at beginning of the match
    // since our replacement words do not contain ]] chars
    let e = new vscode.Position(range.end.line, range.end.character - 2);
    // keep the end
    let r = new vscode.Range(s, e);
    ref = document.getText(r);
    if (ref) {
      // Check for piped wiki-links
      ref = NoteWorkspace.cleanPipedWikiLink(ref);

      return {
        type: RefType.WikiLink,
        word: ref, // .replace(/^\[+/, ''),
        // TODO: parameterize extensions. Add $ to end?
        hasExtension: !!ref.match(/\.(md|markdown)/i),
        range: r, // range,
      };
    }
  }

  return NULL_REF;
}

export const refHasExtension = (word: string): boolean => {
  return !!word.match(/\.(md|markdown)/i);
};

export const refFromWikiLinkText = (wikiLinkText: string): Ref => {
  return {
    type: RefType.WikiLink,
    word: wikiLinkText,
    hasExtension: refHasExtension(wikiLinkText),
    range: undefined,
  };
};
