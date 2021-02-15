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
  Hyperlink, // 3
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

/*
NB: only returns for non-empty refs, eg,
  [[l]] or #t
but not
  [[ [[]] or #
*/
export function getRefAt(document: vscode.TextDocument, position: vscode.Position): Ref {
  let ref: string;
  let regex: RegExp;
  let range: vscode.Range | undefined;

  // let rp = new RemarkParser(document.getText());
  // rp.walkWikiLinksAndTags();
  // let currentNode = rp.getNodeAtPosition(position);

  // #tag regexp
  regex = NoteWorkspace.rxTag();
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
        hasExtension: refHasExtension(ref),
        range: r, // range,
      };
    }
  }


  regex = NoteWorkspace.rxMarkdownHyperlink();
  range = document.getWordRangeAtPosition(position, regex);
  if (range) {
      ref = document.getText(range);
      // remove the [description] from the hyperlink
      ref = ref.replace(/\[[^\[\]]*\]/, '');

      // remove the () surrounding the link
      ref = ref.replace(/\(|\)/g,'');

      // e.g. [desc](link.md) gets turned into link.md

      return {
          type: RefType.Hyperlink,
          word: ref,
          hasExtension: refHasExtension(ref),
          range: range,
      };
  }

  return NULL_REF;
}

/* 
Similar to getRefAt, but handles the 'empty' Ref cases,
  [[ and #
    ^     ^
when they are not followed by any letter chars.
Returns a Ref with the correct type and 0 length range.
*/
export function getEmptyRefAt(document: vscode.TextDocument, position: vscode.Position): Ref {
  // we still need to handle the case where we have the cursor
  // directly after [[ chars with NO letters after the [[
  let c = Math.max(0, position.character - 2); // 2 chars left, unless we are at the 0 or 1 char
  let s = new vscode.Position(position.line, c);
  let searchRange = new vscode.Range(s, position);
  let precedingChars = document.getText(searchRange);

  if (precedingChars == '[[') {
    return {
      type: RefType.WikiLink,
      word: '', // just use empty string
      hasExtension: false,
      // we DO NOT want the replacement position to include the brackets:
      range: new vscode.Range(position, position),
    };
  }
  let regex = NoteWorkspace.rxBeginTag();
  if (precedingChars.match(regex)) {
    return {
      type: RefType.Tag,
      word: '', // just use empty string
      hasExtension: false,
      // we DO want the replacement position to include the #:
      range: new vscode.Range(position.translate(0, -1), position),
    };
  }

  return NULL_REF;
}

export function getRefOrEmptyRefAt(document: vscode.TextDocument, position: vscode.Position): Ref {
  let ref = getRefAt(document, position);
  if (ref.type == RefType.Null) {
    ref = getEmptyRefAt(document, position);
  }
  return ref;
}

export const refHasExtension = (word: string): boolean => {
  return !!word.match(NoteWorkspace.rxFileExtensions());
};

export const refFromWikiLinkText = (wikiLinkText: string): Ref => {
  return {
    type: RefType.WikiLink,
    word: wikiLinkText,
    hasExtension: refHasExtension(wikiLinkText),
    range: undefined,
  };
};
