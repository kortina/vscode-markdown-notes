import { readFile } from 'fs';
import { TAG_REGEX_WITH_ANCHORS } from './MarkdownNotebook';
import { workspace } from 'vscode';

export class WorkspaceTagList {
  static TAG_WORD_SET = new Set();
  static STARTED_INIT = false;
  static COMPLETED_INIT = false;

  static async initSet() {
    if (this.STARTED_INIT) {
      return;
    }
    this.STARTED_INIT = true;
    let files = (await workspace.findFiles('**/*'))
      .filter(
        // TODO: parameterize extensions. Add $ to end?
        (f) => f.scheme == 'file' && f.path.match(/\.(md|markdown)/i)
      )
      .map((f) => {
        // read file, get all words beginning with #, add to Set
        readFile(f.fsPath, (err, data) => {
          let allWords = (data || '').toString().split(/\s/);
          let tags = allWords.filter((w) => w.match(TAG_REGEX_WITH_ANCHORS));
          tags.map((t) => this.TAG_WORD_SET.add(t));
        });
      });
    this.COMPLETED_INIT = true;
  }
}
