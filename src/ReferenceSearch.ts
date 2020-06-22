import * as vscode from 'vscode';
import { basename } from 'path';
import { readFile } from 'fs';
const fsp = require('fs').promises;
import { ContextWord, ContextWordType } from './ContextWord';
import { NoteWorkspace } from './NoteWorkspace';

const RETURN_TYPE_VSCODE = 'vscode';
type RawPosition = {
  line: number;
  character: number;
};
type RawRange = {
  start: RawPosition;
  end: RawPosition;
};
class RefCandidate {
  rawText: string; // candidate match for a tag or wiki-link
  range: RawRange;
  contextWordType: ContextWordType;
  constructor(rawText: string, range: RawRange, contextWordType: ContextWordType) {
    this.rawText = rawText;
    this.range = range;
    this.contextWordType = contextWordType;
  }
  static fromMatch = (
    lineNum: number,
    match: RegExpMatchArray,
    cwType: ContextWordType
  ): RefCandidate => {
    console.debug(`RefCandidate.fromMatch`, match[0]);
    let s = match.index || 0;
    let e = s + match[0].length;
    let r: RawRange = {
      start: { line: lineNum, character: s },
      end: { line: lineNum, character: e },
    };
    return new RefCandidate(match[0], r, cwType);
  };

  matchesContextWord(contextWord: ContextWord): boolean {
    if (contextWord.type != this.contextWordType) {
      return false;
    }
    if (contextWord.type == ContextWordType.Tag) {
      return this.rawText == `#${contextWord.word}`;
    } else if (contextWord.type == ContextWordType.WikiLink) {
      return NoteWorkspace.noteNamesFuzzyMatch(this.rawText, contextWord.word);
    }
    return false;
  }
}

// Caches the results of reading and parsing a TextDocument
// into an in-memory index,
// so we don't have to re-parse the file
// every time we want to get the locations of
// the Tags and WikiLinks in it
class RefCache {
  // FIXME: rename to ParsedFile
  fsPath: string;
  data: string | undefined;
  refCandidates: Array<RefCandidate> = [];
  private _parsed: boolean = false;
  constructor(fsPath: string) {
    this.fsPath = fsPath;
  }

  // read fsPath into this.data and return a
  // Promise that resolves to `this` RefCache instance.
  // Usage:
  // refCache.readFile().then(rc => console.log(rc.data));
  readFile(useCache = false): Promise<RefCache> {
    // console.debug(`readFile: ${this.fsPath}`);
    let that = this;
    // if we are using the cache and cached data exists,
    // just resolve immediately without re-reading files
    if (useCache && this.data) {
      return new Promise((resolve) => {
        resolve(that);
      });
    }
    // make sure we reset parsed to false because we are re-reading the file
    // and we don't want to end up using the old parsed refCandidates
    // in the event that parseData(true) is called in the interim
    this._parsed = false;
    return new Promise((resolve, reject) => {
      readFile(that.fsPath, (err, buffer) => {
        if (err) {
          reject(err);
        } else {
          // NB! Make sure to cast this to a string
          // otherwise, it will cause weird silent failures
          that.data = `${buffer}`;
          resolve(that);
        }
      });
    });
  }

  parseData(useCache = false) {
    let that = this;
    if (!this.data) {
      console.debug(`RefCandidate.parseData: no data for ${this.fsPath}`);
      return;
    }
    if (useCache && this._parsed) {
      return;
    }
    // reset the refCandidates Array
    this.refCandidates = [];

    let lines = this.data.split(/\r?\n/);
    lines.map((line, lineNum) => {
      Array.from(line.matchAll(NoteWorkspace.rxTagNoAnchors()) || []).map((match) => {
        that.refCandidates.push(RefCandidate.fromMatch(lineNum, match, ContextWordType.Tag));
      });
      Array.from(line.matchAll(NoteWorkspace.rxWikiLink()) || []).map((match) => {
        that.refCandidates.push(RefCandidate.fromMatch(lineNum, match, ContextWordType.WikiLink));
      });
    });
    this._parsed = true;
  }

  _rawRangesForWord(contextWord: ContextWord | null): Array<RawRange> {
    let ranges: Array<RawRange> = [];
    if (!this.data || !this.refCandidates) {
      console.warn(
        'rangesForWordInDocumentData called with when !this.data || !this.refCandidates'
      );
      return [];
    }
    if (!contextWord) {
      return [];
    }
    if (![ContextWordType.Tag, ContextWordType.WikiLink].includes(contextWord.type)) {
      return [];
    }
    return this.refCandidates.filter((c) => c.matchesContextWord(contextWord)).map((c) => c.range);
  }

  vscodeRangesForWord(contextWord: ContextWord | null): Array<vscode.Range> {
    return this._rawRangesForWord(contextWord).map((r) => {
      return new vscode.Range(
        new vscode.Position(r.start.line, r.start.character),
        new vscode.Position(r.end.line, r.end.character)
      );
    });
  }
}

export class ReferenceSearch {
  // TODO / FIXME: I wonder if instead of this just-in-time search through all the files,
  // we should instead build the search index for all Tags and WikiLinks once on-boot
  // and then just look in the index for the locations.
  // In that case, we would need to implement some sort of change watcher,
  // to know if our index needs to be updated.
  // This is pretty brute force as it is.

  static rangesForWordInDocumentData = (
    contextWord: ContextWord | null,
    data: string
  ): Array<vscode.Range> => {
    return ReferenceSearch._rawRangesForWordInDocumentData(contextWord, data).map((r) => {
      return new vscode.Range(
        new vscode.Position(r.start.line, r.start.character),
        new vscode.Position(r.end.line, r.end.character)
      );
    });
  };

  static _rawRangesForWordInDocumentData = (
    contextWord: ContextWord | null,
    data: string
  ): Array<RawRange> => {
    let ranges: Array<RawRange> = [];
    if (!contextWord) {
      return [];
    }

    if (![ContextWordType.Tag, ContextWordType.WikiLink].includes(contextWord.type)) {
      return [];
    }
    let lines = data.split(/\r?\n/);
    lines.map((line, lineNum) => {
      let candidates;
      let matchesQuery: (candidate: RegExpMatchArray, cxWord: ContextWord) => boolean;
      if (contextWord.type == ContextWordType.Tag) {
        candidates = line.matchAll(NoteWorkspace.rxTagNoAnchors());
        matchesQuery = (candidate, cxWord) => {
          return candidate[0] == `#${cxWord.word}`;
        };
      } else if (contextWord.type == ContextWordType.WikiLink) {
        candidates = line.matchAll(NoteWorkspace.rxWikiLink());
        matchesQuery = (candidate, cxWord) => {
          return NoteWorkspace.noteNamesFuzzyMatch(candidate[0], contextWord.word);
        };
      }
      Array.from(candidates || []).map((match) => {
        if (matchesQuery(match, contextWord)) {
          // console.log(
          //   `${lineNum} Regex Range: (${match.index}, ${(match.index || 0) + match[0].length}) ${
          //     match[0]
          //   } `
          // );
          let s = match.index || 0;
          let e = s + match[0].length;
          let r: RawRange = {
            start: { line: lineNum, character: s },
            end: { line: lineNum, character: e },
          };
          ranges.push(r);
        }
      });
    });
    return ranges;
  };

  static async searchBacklinksFor(fileBasename: string): Promise<vscode.Location[]> {
    let cw: ContextWord = {
      type: ContextWordType.WikiLink,
      hasExtension: true,
      word: fileBasename,
      range: undefined,
    };
    return this.search(cw);
  }

  static async search(contextWord: ContextWord): Promise<vscode.Location[]> {
    let locations: vscode.Location[] = [];
    let query: string;
    if (contextWord.type == ContextWordType.Tag) {
      query = `#${contextWord.word}`;
    } else if ((contextWord.type = ContextWordType.WikiLink)) {
      query = `[[${basename(contextWord.word)}]]`;
    } else {
      return [];
    }
    // console.log(`query: ${query}`);
    let files = (await vscode.workspace.findFiles('**/*')).filter(
      // TODO: parameterize extensions. Add $ to end?
      (f) => f.scheme == 'file' && f.path.match(/\.(md|markdown)/i)
    );
    let refCaches = files.map((f) => new RefCache(f.fsPath));
    refCaches = await Promise.all(refCaches.map((rc) => rc.readFile()));
    refCaches.map((rc, i) => {
      // console.debug('--------------------');
      // console.log(rc.fsPath);
      rc.parseData();
      // console.log(rc.refCandidates);
      let ranges = rc.vscodeRangesForWord(contextWord);
      ranges.map((r) => {
        let loc = new vscode.Location(vscode.Uri.file(rc.fsPath), r);
        locations.push(loc);
      });
    });

    // console.log(locations);
    return locations;
  }

  static async searchV1(contextWord: ContextWord): Promise<vscode.Location[]> {
    let locations: vscode.Location[] = [];
    let query: string;
    if (contextWord.type == ContextWordType.Tag) {
      query = `#${contextWord.word}`;
    } else if ((contextWord.type = ContextWordType.WikiLink)) {
      query = `[[${basename(contextWord.word)}]]`;
    } else {
      return [];
    }
    // console.log(`query: ${query}`);
    let files = (await vscode.workspace.findFiles('**/*')).filter(
      // TODO: parameterize extensions. Add $ to end?
      (f) => f.scheme == 'file' && f.path.match(/\.(md|markdown)/i)
    );
    let paths = files.map((f) => f.fsPath);
    let fileBuffers = await Promise.all(paths.map((p) => fsp.readFile(p)));
    fileBuffers.map((data, i) => {
      let path = files[i].path;
      // console.debug('--------------------');
      // console.log(path);
      // console.log(`${data}`.split(/\n/)[0]);
      let ranges = this.rangesForWordInDocumentData(contextWord, `${data}`);
      ranges.map((r) => {
        let loc = new vscode.Location(vscode.Uri.file(path), r);
        locations.push(loc);
      });
    });

    // console.log(locations);
    return locations;
  }
}
