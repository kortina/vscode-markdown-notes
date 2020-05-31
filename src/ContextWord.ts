import * as vscode from 'vscode';
// import { RemarkParser } from './RemarkParser';
import { NoteWorkspace } from './NoteWorkspace';

export enum ContextWordType {
  Null, // 0
  WikiLink, // 1
  Tag, // 2
}

export interface ContextWord {
  type: ContextWordType;
  word: string;
  hasExtension: boolean | null;
  range: vscode.Range | undefined;
}

export const debugContextWord = (contextWord: ContextWord) => {
  const { type, word, hasExtension, range } = contextWord;
  console.debug({
    type: ContextWordType[contextWord.type],
    word: contextWord.word,
    hasExtension: contextWord.hasExtension,
    range: contextWord.range,
  });
};

export const NULL_CONTEXT_WORD = {
  type: ContextWordType.Null,
  word: '',
  hasExtension: null,
  range: undefined,
};

export function getContextWord(
  document: vscode.TextDocument,
  position: vscode.Position
): ContextWord {
  let contextWord: string;
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
    contextWord = document.getText(range);
    if (contextWord) {
      return {
        type: ContextWordType.Tag,
        word: contextWord.replace(/^\#+/, ''),
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
    contextWord = document.getText(r);
    if (contextWord) {
      return {
        type: ContextWordType.WikiLink,
        word: contextWord, // .replace(/^\[+/, ''),
        // TODO: parameterize extensions. Add $ to end?
        hasExtension: !!contextWord.match(/\.(md|markdown)/i),
        range: r, // range,
      };
    }
  }

  return NULL_CONTEXT_WORD;
}
