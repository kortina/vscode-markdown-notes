import * as vscode from 'vscode';
import { basename } from 'path';
const fsp = require('fs').promises;
import { ContextWord, ContextWordType } from './ContextWord';

export class ReferenceSearch {
  // TODO/ FIXME: I wonder if instead of this just-in-time search through all the files,
  // we should instead build the search index for all Tags and WikiLinks once on-boot
  // and then just look in the index for the locations.
  // In that case, we would need to implement some sort of change watcher,
  // to know if our index needs to be updated.
  // This is pretty brute force as it is.
  //
  // static TAG_WORD_SET = new Set();
  // static STARTED_INIT = false;
  // static COMPLETED_INIT = false;

  static rangesForWordInDocumentData = (
    queryWord: string | null,
    data: string
  ): Array<vscode.Range> => {
    let ranges: Array<vscode.Range> = [];
    if (!queryWord) {
      return [];
    }
    let lines = data.split(/\r?\n/);
    lines.map((line, lineNum) => {
      let charNum = 0;
      // https://stackoverflow.com/questions/17726904/javascript-splitting-a-string-yet-preserving-the-spaces
      let words = line.split(/(\S+\s+)/);
      words.map((word) => {
        // console.log(`word: ${word} charNum: ${charNum}`);
        let spacesBefore = word.length - word.trimLeft().length;
        let trimmed = word.trim();
        if (trimmed == queryWord) {
          let r = new vscode.Range(
            new vscode.Position(lineNum, charNum + spacesBefore),
            // I thought we had to sub 1 to get the zero-based index of the last char of this word:
            // new vscode.Position(lineNum, charNum + spacesBefore + trimmed.length - 1)
            // but the highlighting is off if we do that ¯\_(ツ)_/¯
            new vscode.Position(lineNum, charNum + spacesBefore + trimmed.length)
          );
          ranges.push(r);
        }
        charNum += word.length;
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
      let ranges = this.rangesForWordInDocumentData(query, `${data}`);
      ranges.map((r) => {
        let loc = new vscode.Location(vscode.Uri.file(path), r);
        locations.push(loc);
      });
    });

    // console.log(locations);
    return locations;
  }
}
