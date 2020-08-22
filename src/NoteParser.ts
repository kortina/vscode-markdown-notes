import * as vscode from 'vscode';
import { basename } from 'path';
import { readFile } from 'fs';
const fsp = require('fs').promises;
import { Ref, RefType } from './Ref';
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
  refType: RefType;
  constructor(rawText: string, range: RawRange, refType: RefType) {
    this.rawText = rawText;
    this.range = range;
    this.refType = refType;
  }
  static fromMatch = (lineNum: number, match: RegExpMatchArray, cwType: RefType): RefCandidate => {
    // console.debug(`RefCandidate.fromMatch`, match[0]);
    let s = match.index || 0;
    let e = s + match[0].length;
    let r: RawRange = {
      start: { line: lineNum, character: s },
      end: { line: lineNum, character: e },
    };
    return new RefCandidate(match[0], r, cwType);
  };

  matchesContextWord(ref: Ref): boolean {
    if (ref.type != this.refType) {
      return false;
    }
    if (ref.type == RefType.Tag) {
      return this.rawText == `#${ref.word}`;
    } else if (ref.type == RefType.WikiLink) {
      return NoteWorkspace.noteNamesFuzzyMatchText(this.rawText, ref.word);
    }
    return false;
  }
}

// Caches the results of reading and parsing a TextDocument
// into an in-memory index,
// so we don't have to re-parse the file
// every time we want to get the locations of
// the Tags and WikiLinks in it
export class Note {
  fsPath: string;
  data: string | undefined;
  refCandidates: Array<RefCandidate> = [];
  title: {
    text: string;
    line: number;
    contextLine: number; // line number after all empty lines
  } | undefined;
  private _parsed: boolean = false;
  constructor(fsPath: string) {
    this.fsPath = fsPath;
  }

  // mostly used as a constructor for tests
  // when we don't want to actually parse something
  // from the filesystem.
  // Won't fail because the init does not do anything with fsPath
  static fromData(data: string): Note {
    let note = new Note('NO_PATH');
    note.data = data;
    note.parseData(false);
    return note;
  }

  // read fsPath into this.data and return a
  // Promise that resolves to `this` Note instance.
  // Usage:
  // note.readFile().then(note => console.log(note.data));
  readFile(useCache = false): Promise<Note> {
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

    let searchTitle = true;
    let isSkip = false;
    let lines = this.data.split(/\r?\n/);
    lines.map((line, lineNum) => {
      if (isSkip) { // ! skip all empty lines after title `# title`
        if (line.trim() == '') {
          that.title!.contextLine = lineNum;
        } else {
          isSkip = false;
        }
      }
      if (searchTitle) {
        Array.from(line.matchAll(NoteWorkspace.rxTitle())).map((match) => {
          that.title = {
            text: '# ' + match[0].trim(),
            line: lineNum,
            contextLine: lineNum
          };
          searchTitle = false; // * only search for the first # h1
          isSkip = true;
        });
      }
      Array.from(line.matchAll(NoteWorkspace.rxTagNoAnchors())).map((match) => {

        that.refCandidates.push(RefCandidate.fromMatch(lineNum, match, RefType.Tag));
      });
      Array.from(line.matchAll(NoteWorkspace.rxWikiLink()) || []).map((match) => {
        // console.log('match tag', that.fsPath, lineNum, match);

        that.refCandidates.push(RefCandidate.fromMatch(lineNum, match, RefType.WikiLink));
      });
    });
    // console.debug(`parsed ${this.fsPath}. refCandidates:`, this.refCandidates);
    this._parsed = true;
  }

  // NB: assumes this.parseData MUST have been called BEFORE running
  _rawRangesForWord(ref: Ref | null): Array<RawRange> {
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
    if (!ref) {
      return [];
    }
    if (![RefType.Tag, RefType.WikiLink].includes(ref.type)) {
      return [];
    }
    return this.refCandidates.filter((c) => c.matchesContextWord(ref)).map((c) => c.range);
  }

  vscodeRangesForWord(ref: Ref | null): Array<vscode.Range> {
    return this._rawRangesForWord(ref).map((r) => {
      return new vscode.Range(
        new vscode.Position(r.start.line, r.start.character),
        new vscode.Position(r.end.line, r.end.character)
      );
    });
  }

  tagSet(): Set<string> {
    let _tagSet: Set<string> = new Set();

    this.refCandidates
      .filter((rc) => rc.refType == RefType.Tag)
      .map((rc) => {
        _tagSet.add(rc.rawText);
      });
    return _tagSet;
  }

  // completionItem.documentation ()
  documentation(): string | vscode.MarkdownString | undefined {
    if (this.data === undefined) {
      return "";
    } else {
      let data = this.data;
      if (this.title) { // get the portion of the note after the title
        data = this.data.split(/\r?\n/).slice(this.title.contextLine + 1).join('\n');
      }
      if (NoteWorkspace.compileSuggestionDetails()) {
        try {
          let result = new vscode.MarkdownString(data);
          return result;
        } catch (error) {
          return "";
        }
      } else {
        return data;
      }
    }
  }
}

interface Dictionary<T> {
  [key: string]: T;
}

export class NoteParser {
  // mapping of file fsPaths to Note objects
  static _notes: Dictionary<Note> = {};

  static async distinctTags(): Promise<Array<string>> {
    let useCache = true;
    let _tags: Array<string> = [];
    await NoteParser.parsedFilesForWorkspace(useCache).then((pfs) => {
      pfs.map((note) => {
        _tags = _tags.concat(Array.from(note.tagSet()));
      });
    });
    return Array.from(new Set(_tags));
  }

  static async searchBacklinksFor(fileBasename: string): Promise<vscode.Location[]> {
    let ref: Ref = {
      type: RefType.WikiLink,
      hasExtension: true,
      word: fileBasename,
      range: undefined,
    };
    return this.search(ref);
  }

  static parsedFileFor(fsPath: string): Note {
    let note = NoteParser._notes[fsPath];
    if (!note) {
      note = new Note(fsPath);
    }
    this._notes[fsPath] = note;
    return note;
  }

  static async parsedFilesForWorkspace(useCache = false): Promise<Array<Note>> {
    let files = await NoteWorkspace.noteFiles();
    let parsedFiles = files.map((f) => NoteParser.parsedFileFor(f.fsPath));
    return (await Promise.all(parsedFiles.map((note) => note.readFile(useCache)))).map((note) => {
      note.parseData(useCache);
      return note;
    });
  }

  // call this when we know a file has changed contents to update the cache
  static updateCacheFor(fsPath: string) {
    let that = this;
    let note = NoteParser.parsedFileFor(fsPath);
    note.readFile(false).then((_pf) => {
      _pf.parseData(false);
      // remember to set in the master index:
      that._notes[fsPath] = _pf;
    });
  }

  // call this when we know a file has been deleted
  static clearCacheFor(fsPath: string) {
    delete NoteParser._notes[fsPath];
  }

  static async hydrateCache(): Promise<Array<Note>> {
    let useCache = false;
    let parsedFiles = await NoteParser.parsedFilesForWorkspace(useCache);
    return parsedFiles;
  }

  static async search(ref: Ref): Promise<vscode.Location[]> {
    let useCache = true;

    let locations: vscode.Location[] = [];
    let query: string;
    if (ref.type == RefType.Tag) {
      query = `#${ref.word}`;
    } else if (ref.type == RefType.WikiLink) {
      query = `[[${basename(ref.word)}]]`;
    } else {
      return [];
    }
    let parsedFiles = await NoteParser.parsedFilesForWorkspace(useCache);
    parsedFiles.map((note, i) => {
      let ranges = note.vscodeRangesForWord(ref);
      ranges.map((r) => {
        let loc = new vscode.Location(vscode.Uri.file(note.fsPath), r);
        locations.push(loc);
      });
    });

    return locations;
  }

  static noteFromFsPath(fsPath: string): Note | undefined {
    return this._notes[fsPath];
  }
}
