import * as vscode from 'vscode';
import { basename, dirname, join, normalize, relative, resolve } from 'path';
import { existsSync, readFile, writeFileSync } from 'fs';

export const TAG_REGEX___NO_ANCHORS = /\#[\w\-\_]+/i; // used to match tags that appear within lines
export const TAG_REGEX_WITH_ANCHORS = /^\#[\w\-\_]+$/i; // used to match entire words
export const WIKI_LINK_REGEX = /\[\[[\w\.\-\_\/\\]+/i; // [[wiki-link-regex
export const MARKDOWN_WORD_PATTERN_OVERRIDE = /([\#\.\/\\\w_]+)/; // had to add [".", "/", "\"] to get relative path completion working and ["#"] to get tag completion working

export const useUniqueFilenames = (): boolean => {
  let cfg = vscode.workspace.getConfiguration('vscodeMarkdownNotes');
  return cfg.get('workspaceFilenameConvention') == 'uniqueFilenames';
};

export const createNoteOnGoToDefinitionWhenMissing = (): boolean => {
  let cfg = vscode.workspace.getConfiguration('vscodeMarkdownNotes');
  return !!cfg.get('createNoteOnGoToDefinitionWhenMissing');
};

export function filenameForConvention(uri: vscode.Uri, fromDocument: vscode.TextDocument): string {
  if (useUniqueFilenames()) {
    return basename(uri.path);
  } else {
    let toPath = uri.path;
    let fromDir = dirname(fromDocument.uri.path.toString());
    let rel = normalize(relative(fromDir, toPath));
    return rel;
  }
}

export const newNote = (context: vscode.ExtensionContext) => {
  // console.debug('newNote');
  const inputBoxPromise = vscode.window.showInputBox({
    prompt:
      "Enter a 'Title Case Name' to create `title-case-name.md` with '# Title Case Name' at the top.",
    value: '',
  });

  let workspaceUri = '';
  if (vscode.workspace.workspaceFolders) {
    workspaceUri = vscode.workspace.workspaceFolders[0].uri.path.toString();
  }

  inputBoxPromise.then(
    (noteName) => {
      if (noteName == null || !noteName || noteName.replace(/\s+/g, '') == '') {
        // console.debug('Abort: noteName was empty.');
        return false;
      }

      const filename =
        noteName
          .replace(/\W+/gi, '-') // non-words to hyphens
          .toLowerCase() // lower
          .replace(/-*$/, '') + '.md'; // removing trailing '-' chars, add extension
      const filepath = join(workspaceUri, filename);

      const fileAlreadyExists = existsSync(filepath);
      // create the file if it does not exists
      if (!fileAlreadyExists) {
        const contents = `# ${noteName}\n\n`;
        writeFileSync(filepath, contents);
      }

      // open the file:
      vscode.window
        .showTextDocument(vscode.Uri.file(filepath), {
          preserveFocus: false,
          preview: false,
        })
        .then(() => {
          // if we created a new file, hop to line #3
          if (!fileAlreadyExists) {
            let editor = vscode.window.activeTextEditor;
            if (editor) {
              const lineNumber = 3;
              let range = editor.document.lineAt(lineNumber - 1).range;
              editor.selection = new vscode.Selection(range.start, range.end);
              editor.revealRange(range);
            }
          }
        });
    },
    (err) => {
      vscode.window.showErrorMessage('Error creating new note.');
      // console.error(err);
    }
  );
};

export const overrideMarkdownWordPattern = () => {
  // console.debug('overrideMarkdownWordPattern');
  vscode.languages.setLanguageConfiguration('markdown', {
    wordPattern: MARKDOWN_WORD_PATTERN_OVERRIDE,
  });
};
