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
    // console.debug(`RefCandidate.fromMatch`, match[0]);
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
export class RefCache {
  // FIXME: rename to ParsedFile
  fsPath: string;
  data: string | undefined;
  refCandidates: Array<RefCandidate> = [];
  private _parsed: boolean = false;
  constructor(fsPath: string) {
    this.fsPath = fsPath;
  }

  // mostly used as a constructor for tests
  // when we don't want to actually parse something
  // from the filesystem.
  // Won't fail because the init does not do anything with fsPath
  static fromData(data: string): RefCache {
    let rc = new RefCache('NO_PATH');
    rc.data = data;
    rc.parseData(false);
    return rc;
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
    // don't debug on blank data, only null|undefined
    if (this.data === '') {
      return;
    }
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
      Array.from(line.matchAll(NoteWorkspace.rxTagNoAnchors())).map((match) => {
        // console.log('match tag', that.fsPath, lineNum, match);
        that.refCandidates.push(RefCandidate.fromMatch(lineNum, match, ContextWordType.Tag));
      });
      Array.from(line.matchAll(NoteWorkspace.rxWikiLink()) || []).map((match) => {
        that.refCandidates.push(RefCandidate.fromMatch(lineNum, match, ContextWordType.WikiLink));
      });
    });
    // console.debug(`parsed ${this.fsPath}. refCandidates:`, this.refCandidates);
    this._parsed = true;
  }

  // NB: assumes this.parseData MUST have been called BEFORE running
  _rawRangesForWord(contextWord: ContextWord | null): Array<RawRange> {
    let ranges: Array<RawRange> = [];
    // don't debug on blank data, only null|undefined
    if (this.data === '') {
      return [];
    }
    if (!this.data || !this.refCandidates) {
      console.debug(
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

  tagSet(): Set<string> {
    let _tagSet: Set<string> = new Set();

    this.refCandidates
      .filter((rc) => rc.contextWordType == ContextWordType.Tag)
      .map((rc) => {
        _tagSet.add(rc.rawText);
      });
    return _tagSet;
  }
}

interface Dictionary<T> {
  [key: string]: T;
}

export class NoteParser {
  // mapping of file fsPaths to RefCache objects
  static _refCaches: Dictionary<RefCache> = {};

  static async distinctTags(): Promise<Array<string>> {
    let useCache = true;
    let _tags: Array<string> = [];
    await NoteParser.refCachesForWorkspace(useCache).then((rcs) => {
      rcs.map((rc) => {
        _tags = _tags.concat(Array.from(rc.tagSet()));
      });
    });
    return Array.from(new Set(_tags));
  }

  static async searchBacklinksFor(fileBasename: string): Promise<vscode.Location[]> {
    let cw: ContextWord = {
      type: ContextWordType.WikiLink,
      hasExtension: true,
      word: fileBasename,
      range: undefined,
    };
    return this.search(cw);
  }

  static refCacheFor(fsPath: string): RefCache {
    let rc = NoteParser._refCaches[fsPath];
    if (!rc) {
      rc = new RefCache(fsPath);
    }
    this._refCaches[fsPath] = rc;
    return rc;
  }

  static async refCachesForWorkspace(useCache = false): Promise<Array<RefCache>> {
    let files = await NoteWorkspace.noteFiles();
    let refCaches = files.map((f) => NoteParser.refCacheFor(f.fsPath));
    return (await Promise.all(refCaches.map((rc) => rc.readFile(useCache)))).map((rc) => {
      rc.parseData(useCache);
      return rc;
    });
  }

  // call this when we know a file has changed contents to update the cache
  static updateCacheFor(fsPath: string) {
    let that = this;
    let rc = NoteParser.refCacheFor(fsPath);
    rc.readFile(false).then((_rc) => {
      rc.parseData(false);
      // remember to set in the master index:
      that._refCaches[fsPath] = rc;
    });
  }

  // call this when we know a file has been deleted
  static clearCacheFor(fsPath: string) {
    delete NoteParser._refCaches[fsPath];
  }

  static async hydrateCache(): Promise<Array<RefCache>> {
    let useCache = false;
    let refCaches = await NoteParser.refCachesForWorkspace(useCache);
    return refCaches;
  }

  static async search(contextWord: ContextWord): Promise<vscode.Location[]> {
    let useCache = true;

    let locations: vscode.Location[] = [];
    let query: string;
    if (contextWord.type == ContextWordType.Tag) {
      query = `#${contextWord.word}`;
    } else if ((contextWord.type = ContextWordType.WikiLink)) {
      query = `[[${basename(contextWord.word)}]]`;
    } else {
      return [];
    }
    let refCaches = await NoteParser.refCachesForWorkspace(useCache);
    refCaches.map((rc, i) => {
      let ranges = rc.vscodeRangesForWord(contextWord);
      ranges.map((r) => {
        let loc = new vscode.Location(vscode.Uri.file(rc.fsPath), r);
        locations.push(loc);
      });
    });

    return locations;
  }
}
