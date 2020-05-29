import * as vscode from 'vscode';
import { basename } from 'path';
const fsp = require('fs').promises;
import { ContextWord, ContextWordType } from './ContextWord';
import { NoteWorkspace } from './NoteWorkspace';

export class ReferenceSearch {
  // TODO/ FIXME: I wonder if instead of this just-in-time search through all the files,
  // we should instead build the search index for all Tags and WikiLinks once on-boot
  // and then just look in the index for the locations.
  // In that case, we would need to implement some sort of change watcher,
  // to know if our index needs to be updated.
  // This is pretty brute force as it is.

  static rangesForWordInDocumentData = (
    contextWord: ContextWord | null,
    data: string
  ): Array<vscode.Range> => {
    let ranges: Array<vscode.Range> = [];
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
          console.log(
            `${lineNum} Regex Range: (${match.index}, ${(match.index || 0) + match[0].length}) ${
              match[0]
            } `
          );
          let s = match.index || 0;
          let e = s + match[0].length;
          let r = new vscode.Range(
            new vscode.Position(lineNum, s),
            new vscode.Position(lineNum, e)
          );
          ranges.push(r);
        }
      });
    });
    return ranges;
  };

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
