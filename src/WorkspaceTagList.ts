import { readFile } from 'fs';
import { NoteWorkspace } from './NoteWorkspace';
import { workspace } from 'vscode';
// import { RemarkParser } from './RemarkParser';

// This class walks through all the files in the current workspace
// and adds every #tag it finds to a new Set() of #tags
// to be used by the MarkdownCompletionProvider for #tags
//
// In the future, I think this can be combined with ReferenceSearch.
// But I think this class might be *slightly* more faster
// since it does not do any of the work to track the Position (line, column)
// of each tag in the document
export class WorkspaceTagList {
  static TAG_WORD_SET = new Set();
  static STARTED_INIT = false;
  static COMPLETED_INIT = false;

  static parseDoc(path: string, doc: string) {
    // console.debug(`WorkspaceTagList.parseDoc: ${path}`);
    // let rp = new RemarkParser(doc);
    // rp.tags();
  }

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
          let doc = (data || '').toString();
          // this.parseDoc(f.fsPath, doc);
          let allWords = doc.split(/\s/);
          let tags = allWords.filter((w) => w.match(NoteWorkspace.rxTagWithAnchors()));
          tags.map((t) => this.TAG_WORD_SET.add(t));
        });
      });
    this.COMPLETED_INIT = true;
  }
}
