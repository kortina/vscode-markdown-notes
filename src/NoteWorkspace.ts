import * as vscode from 'vscode';
import { basename, dirname, isAbsolute, join, normalize, relative } from 'path';
import { existsSync } from 'fs';
import { TextEncoder } from 'util';
import findNonIgnoredFiles from './findNonIgnoredFiles';
const GithubSlugger = require('github-slugger');
const SLUGGER = new GithubSlugger();

export const foo = () => {
  return 1;
};

enum NoteCompletionConvention {
  rawFilename = 'rawFilename',
  noExtension = 'noExtension',
  toSpaces = 'toSpaces',
  uniqueId = 'uniqueId',
}
enum WorkspaceFilenameConvention {
  uniqueFilenames = 'uniqueFilenames',
  relativePaths = 'relativePaths',
}
enum SlugifyCharacter {
  dash = '-',
  underscore = '_',
  fullwidthDash = '－',
  fullwidthUnderscore = '＿',
  none = 'NONE',
}

export enum SlugifyMethod {
  github = 'github-slugger',
  classic = 'classic',
}

export enum PipedWikiLinksSyntax {
  fileDesc = 'file|desc',
  descFile = 'desc|file',
}

enum PreviewLabelStyling {
  brackets = '[[label]]',
  bracket = '[label]',
  none = 'label',
}

type Config = {
  createNoteOnGoToDefinitionWhenMissing: boolean;
  defaultFileExtension: string;
  noteCompletionConvention: NoteCompletionConvention;
  uniqueIdTemplate: string;
  slugifyCharacter: SlugifyCharacter;
  slugifyMethod: SlugifyMethod;
  workspaceFilenameConvention: WorkspaceFilenameConvention;
  newNoteTemplate: string;
  newNoteFromSelectionReplacementTemplate: string;
  lowercaseNewNoteFilenames: boolean;
  compileSuggestionDetails: boolean;
  triggerSuggestOnReplacement: boolean;
  allowPipedWikiLinks: boolean;
  pipedWikiLinksSyntax: PipedWikiLinksSyntax;
  pipedWikiLinksSeparator: string;
  newNoteDirectory: string;
  previewLabelStyling: PreviewLabelStyling;
  previewShowFileExtension: boolean;
};
// This class contains:
// 1. an interface to some of the basic user configurable settings or this extension
// 2. command for creating a New Note
// 3. some other bootstrapping
export class NoteWorkspace {
  // Defining these as strings now, and then compiling them with accessor methods.
  // This will allow us to potentially expose these as settings.
  // Note for the future: \p{L} is used instead of \w , in order to match to all possible letters
  // rather than just those from the latin alphabet.
  static _rxTag = '(?<= |,|^)#[\\p{L}\\-_/]+'; // match # followed by a letter character
  static _rxBeginTag = '(?<= |,|^)#'; // match # preceded by a space, comma, or newline, regardless of whether it is followed by a letter character
  static _rxWikiLink = '\\[\\[[^sep\\]]+(sep[^sep\\]]+)?\\]\\]'; // [[wiki-link-regex(|with potential pipe)?]] Note: "sep" will be replaced with pipedWikiLinksSeparator on compile
  static _rxTitle = '(?<=^( {0,3}#[^\\S\\r\\n]+)).+';
  static _rxMarkdownWordPattern = '([_\\p{L}\\d#\\.\\/\\\\]+)'; // had to add [".", "/", "\"] to get relative path completion working and ["#"] to get tag completion working
  static _rxMarkdownHyperlink = '\\[[^\\[\\]]*\\]\\((?!https?)[^\\(\\)\\[\\] ]+\\)'; // [description](hyperlink-to-file.md), ensuring the link doesn't start with http(s)
  static _rxFileExtensions = '\\.(md|markdown|mdx|fountain|txt)$';
  static SLUGIFY_NONE = 'NONE';
  static NEW_NOTE_SAME_AS_ACTIVE_NOTE = 'SAME_AS_ACTIVE_NOTE';
  static NEW_NOTE_WORKSPACE_ROOT = 'WORKSPACE_ROOT';
  static DEFAULT_CONFIG: Config = {
    createNoteOnGoToDefinitionWhenMissing: true,
    compileSuggestionDetails: false,
    defaultFileExtension: 'md',
    noteCompletionConvention: NoteCompletionConvention.rawFilename,
    uniqueIdTemplate: '',
    slugifyCharacter: SlugifyCharacter.dash,
    slugifyMethod: SlugifyMethod.classic,
    workspaceFilenameConvention: WorkspaceFilenameConvention.uniqueFilenames,
    newNoteTemplate: '# ${noteName}\n\n',
    newNoteFromSelectionReplacementTemplate: '[[${wikiLink}]]',
    lowercaseNewNoteFilenames: true,
    triggerSuggestOnReplacement: true,
    allowPipedWikiLinks: false,
    pipedWikiLinksSyntax: PipedWikiLinksSyntax.fileDesc,
    pipedWikiLinksSeparator: '\\|',
    newNoteDirectory: NoteWorkspace.NEW_NOTE_SAME_AS_ACTIVE_NOTE,
    previewLabelStyling: PreviewLabelStyling.brackets,
    previewShowFileExtension: false,
  };
  static DOCUMENT_SELECTOR = [
    { scheme: 'file', language: 'markdown' },
    { scheme: 'file', language: 'mdx' },
  ];

  // Cache object to store results from noteFiles() in order to provide a synchronous method to the preview renderer.
  static noteFileCache: vscode.Uri[] = [];

  static cfg(): Config {
    let c = vscode.workspace.getConfiguration('vscodeMarkdownNotes');
    return {
      createNoteOnGoToDefinitionWhenMissing: c.get(
        'createNoteOnGoToDefinitionWhenMissing'
      ) as boolean,
      defaultFileExtension: c.get('defaultFileExtension') as string,
      noteCompletionConvention: c.get('noteCompletionConvention') as NoteCompletionConvention,
      uniqueIdTemplate: c.get('uniqueIdTemplate') as string,
      slugifyCharacter: c.get('slugifyCharacter') as SlugifyCharacter,
      slugifyMethod: c.get('slugifyMethod') as SlugifyMethod,
      workspaceFilenameConvention: c.get(
        'workspaceFilenameConvention'
      ) as WorkspaceFilenameConvention,
      newNoteTemplate: c.get('newNoteTemplate') as string,
      newNoteFromSelectionReplacementTemplate: c.get(
        'newNoteFromSelectionReplacementTemplate'
      ) as string,
      lowercaseNewNoteFilenames: c.get('lowercaseNewNoteFilenames') as boolean,
      compileSuggestionDetails: c.get('compileSuggestionDetails') as boolean,
      triggerSuggestOnReplacement: c.get('triggerSuggestOnReplacement') as boolean,
      allowPipedWikiLinks: c.get('allowPipedWikiLinks') as boolean,
      pipedWikiLinksSyntax: c.get('pipedWikiLinksSyntax') as PipedWikiLinksSyntax,
      pipedWikiLinksSeparator: c.get('pipedWikiLinksSeparator') as string,
      newNoteDirectory: c.get('newNoteDirectory') as string,
      previewLabelStyling: c.get('previewLabelStyling') as PreviewLabelStyling,
      previewShowFileExtension: c.get('previewShowFileExtension') as boolean,
    };
  }

  static uniqueIdTemplate(): string {
    return this.cfg().uniqueIdTemplate;
  }

  static slugifyChar(): string {
    return this.cfg().slugifyCharacter;
  }

  static slugifyMethod(): string {
    return this.cfg().slugifyMethod;
  }

  static defaultFileExtension(): string {
    return this.cfg().defaultFileExtension;
  }

  static newNoteTemplate(): string {
    return this.cfg().newNoteTemplate;
  }

  static newNoteFromSelectionReplacementTemplate(): string {
    return this.cfg().newNoteFromSelectionReplacementTemplate;
  }

  static lowercaseNewNoteFilenames(): boolean {
    return this.cfg().lowercaseNewNoteFilenames;
  }

  static triggerSuggestOnReplacement() {
    return this.cfg().triggerSuggestOnReplacement;
  }

  static allowPipedWikiLinks(): boolean {
    return this.cfg().allowPipedWikiLinks;
  }

  static pipedWikiLinksSyntax(): string {
    return this.cfg().pipedWikiLinksSyntax;
  }

  static pipedWikiLinksSeparator(): string {
    return this.cfg().pipedWikiLinksSeparator;
  }

  static newNoteDirectory(): string {
    return this.cfg().newNoteDirectory;
  }

  static previewLabelStyling(): string {
    return this.cfg().previewLabelStyling;
  }

  static previewShowFileExtension(): boolean {
    return this.cfg().previewShowFileExtension;
  }

  static rxTag(): RegExp {
    // NB: MUST have g flag to match multiple words per line
    return new RegExp(this._rxTag, 'gui');
  }
  static rxBeginTag(): RegExp {
    return new RegExp(this._rxBeginTag, 'gui');
  }

  static rxWikiLink(): RegExp {
    // NB: MUST have g flag to match multiple words per line
    this._rxWikiLink = this._rxWikiLink.replace(/sep/g, NoteWorkspace.pipedWikiLinksSeparator());
    return new RegExp(this._rxWikiLink, 'gi');
  }
  static rxTitle(): RegExp {
    return new RegExp(this._rxTitle, 'gi');
  }
  static rxMarkdownWordPattern(): RegExp {
    return new RegExp(this._rxMarkdownWordPattern, 'u');
  }
  static rxFileExtensions(): RegExp {
    // return noteName.replace(/\.(md|markdown|mdx|fountain)$/i, '');
    return new RegExp(this._rxFileExtensions, 'i');
  }

  static rxMarkdownHyperlink(): RegExp {
    return new RegExp(this._rxMarkdownHyperlink, 'gi');
  }

  static wikiLinkCompletionForConvention(
    uri: vscode.Uri,
    fromDocument: vscode.TextDocument
  ): string {
    if (this.useUniqueFilenames()) {
      let filename = basename(uri.fsPath);
      let c = this.cfg().noteCompletionConvention;
      return this._wikiLinkCompletionForConvention(c, filename);
    } else {
      let toPath = uri.fsPath;
      let fromDir = dirname(fromDocument.uri.fsPath.toString());
      let rel = normalize(relative(fromDir, toPath));
      return rel;
    }
  }

  static _wikiLinkCompletionForConvention(convention: string, filename: string): string {
    if (convention == 'toSpaces') {
      return this.stripExtension(filename).replace(/[-_]+/g, ' ');
    } else if (convention == 'noExtension') {
      return this.stripExtension(filename);
    } else if (convention == 'uniqueId') {
      return this.normalizeNoteNameToUniqueId(filename);
    } else {
      return filename;
    }
  }

  static useUniqueFilenames(): boolean {
    // return false;
    return this.cfg().workspaceFilenameConvention == 'uniqueFilenames';
  }

  static createNoteOnGoToDefinitionWhenMissing(): boolean {
    return !!this.cfg().createNoteOnGoToDefinitionWhenMissing;
  }

  static compileSuggestionDetails(): boolean {
    return this.cfg().compileSuggestionDetails;
  }

  static stripExtension(noteName: string): string {
    return noteName.replace(NoteWorkspace.rxFileExtensions(), '');
  }

  static normalizeNoteNameToUniqueId(noteName: string): string {
    let match_result = noteName.match(this.uniqueIdTemplate());
    if (match_result) {
      return match_result[0];
    } else {
      return "";
    }
  }

  static normalizeNoteNameForFuzzyMatch(noteName: string): string {
    // remove the brackets:
    let n = noteName.replace(/[\[\]]/g, '');
    // remove the filepath:
    // NB: this may not work with relative paths?
    n = basename(n);
    // remove the extension:
    n = this.stripExtension(n);
    // slugify (to normalize spaces)
    n = this.slugifyTitle(n);
    return n;
  }

  static cleanPipedWikiLink(noteName: string): string {
    // Check whether or not we should remove the description

    if (NoteWorkspace.allowPipedWikiLinks()) {
      let separator: string = NoteWorkspace.pipedWikiLinksSeparator();
      let captureGroup = '[^\\[' + separator + ']+';
      let regex: RegExp;

      if (NoteWorkspace.pipedWikiLinksSyntax() == 'file|desc') {
        // Should capture the "|desc" at the end of a wiki-link
        regex = new RegExp(separator + captureGroup + '$');
      } else {
        // Should capture the "desc|" at the beginning of a wiki-link
        regex = new RegExp('^' + captureGroup + separator);
      }

      noteName = noteName.replace(regex, ''); // Remove description from the end
      return noteName;

      // If piped wiki-links aren't used, don't alter the note name.
    } else {
      return noteName;
    }
  }

  static normalizeNoteNameForFuzzyMatchText(noteName: string): string {
    // remove the brackets:
    let n = noteName.replace(/[\[\]]/g, '');

    // remove the potential description:
    n = this.cleanPipedWikiLink(n);
    // remove the extension:
    n = this.stripExtension(n);
    // slugify (to normalize spaces)
    n = this.slugifyTitle(n);
    return n;
  }

  // compare a hyperlink to a filename for a fuzzy match.
  // `left` is the ref word, `right` is the file name
  static noteNamesFuzzyMatchHyperlinks(left: string, right: string): boolean {
    // strip markdown link syntax; remove the [description]
    left = left.replace(/\[[^\[\]]*\]/g, '');
    // and the () surrounding the link
    left = left.replace(/\(|\)/g, '');

    return (
      this.normalizeNoteNameForFuzzyMatch(left).toLowerCase() ==
      this.normalizeNoteNameForFuzzyMatchText(right).toLowerCase()
    );
  }
  // Compare 2 wiki-links for a fuzzy match.
  // In general, we expect
  // `left` to be fsPath
  // `right` to be the ref word [[wiki-link]]
  static noteNamesFuzzyMatch(left: string, right: string): boolean {
    return (
      this.normalizeNoteNameForFuzzyMatch(left).toLowerCase() ==
      this.normalizeNoteNameForFuzzyMatchText(right).toLowerCase()
      ||
      (this.normalizeNoteNameToUniqueId(left) != '') &&
      (this.normalizeNoteNameToUniqueId(left) ==
       this.normalizeNoteNameToUniqueId(right))
    );
  }

  static noteNamesFuzzyMatchText(left: string, right: string): boolean {
    return (
      this.normalizeNoteNameForFuzzyMatchText(left).toLowerCase() ==
      this.normalizeNoteNameForFuzzyMatchText(right).toLowerCase()
      ||
      (this.normalizeNoteNameToUniqueId(left) != '') &&
      (this.normalizeNoteNameToUniqueId(left) ==
       this.normalizeNoteNameToUniqueId(right))
    );
  }

  static cleanTitle(title: string): string {
    const caseAdjustedTitle = this.lowercaseNewNoteFilenames() ? title.toLowerCase() : title;

    // removing trailing slug chars
    return caseAdjustedTitle.replace(/[-_－＿ ]*$/g, '');
  }

  static slugifyClassic(title: string): string {
    let t =
      this.slugifyChar() == 'NONE'
        ? title
        : title.replace(/[!"\#$%&'()*+,\-./:;<=>?@\[\\\]^_‘{|}~\s]+/gi, this.slugifyChar()); // punctuation and whitespace to hyphens (or underscores)
    return this.cleanTitle(t);
  }

  static slugifyGithub(title: string): string {
    SLUGGER.reset(); // otherwise it will increment repeats with -1 -2 -3 etc.
    return SLUGGER.slug(title);
  }

  static slugifyTitle(title: string): string {
    if (this.slugifyMethod() == SlugifyMethod.classic) {
      return this.slugifyClassic(title);
    } else {
      return this.slugifyGithub(title);
    }
  }

  static noteFileNameFromTitle(title: string): string {
    let t = this.slugifyTitle(title);
    return t.match(this.rxFileExtensions()) ? t : `${t}.${this.defaultFileExtension()}`;
  }

  static showNewNoteInputBox() {
    return vscode.window.showInputBox({
      prompt:
        "Enter a 'Title Case Name' to create `title-case-name.md` with '# Title Case Name' at the top.",
      value: '',
    });
  }

  static newNote(context: vscode.ExtensionContext) {
    // console.debug('newNote');
    const inputBoxPromise = NoteWorkspace.showNewNoteInputBox();

    inputBoxPromise.then(
      async (noteName) => {
        if (noteName == null || !noteName || noteName.replace(/\s+/g, '') == '') {
          // console.debug('Abort: noteName was empty.');
          return false;
        }
        const { filepath, fileAlreadyExists } = await NoteWorkspace.createNewNoteFile(noteName);

        // open the file:
        vscode.window
          .showTextDocument(vscode.Uri.file(filepath), {
            preserveFocus: false,
            preview: false,
          })
          .then(() => {
            // if we created a new file, place the selection at the end of the last line of the template
            if (!fileAlreadyExists) {
              let editor = vscode.window.activeTextEditor;
              if (editor) {
                const lineNumber = editor.document.lineCount;
                const range = editor.document.lineAt(lineNumber - 1).range;
                editor.selection = new vscode.Selection(range.end, range.end);
                editor.revealRange(range);
              }
            }
          });
      },
      (err) => {
        vscode.window.showErrorMessage('Error creating new note.');
      }
    );
  }

  static newNoteFromSelection(context: vscode.ExtensionContext) {
    const originEditor = vscode.window.activeTextEditor;

    if (!originEditor) {
      // console.debug('Abort: no active editor');
      return;
    }
    const { selection } = originEditor;
    const noteContents = originEditor.document.getText(selection);
    const originSelectionRange = new vscode.Range(selection.start, selection.end);

    if (noteContents === '') {
      vscode.window.showErrorMessage('Error creating note from selection: selection is empty.');
      return;
    }

    // console.debug('newNote');
    const inputBoxPromise = NoteWorkspace.showNewNoteInputBox();

    inputBoxPromise.then(
      async (noteName) => {
        if (noteName == null || !noteName || noteName.replace(/\s+/g, '') == '') {
          // console.debug('Abort: noteName was empty.');
          return false;
        }
        const { filepath, fileAlreadyExists } = await NoteWorkspace.createNewNoteFile(noteName);
        const destinationUri = vscode.Uri.file(filepath);

        // open the file:
        vscode.window
          .showTextDocument(destinationUri, {
            preserveFocus: false,
            preview: false,
          })
          .then(() => {
            if (!fileAlreadyExists) {
              const destinationEditor = vscode.window.activeTextEditor;
              if (destinationEditor) {
                // Place the selection at the end of the last line of the template
                const lineNumber = destinationEditor.document.lineCount;
                const range = destinationEditor.document.lineAt(lineNumber - 1).range;
                destinationEditor.selection = new vscode.Selection(range.end, range.end);
                destinationEditor.revealRange(range);

                // Insert the selected content in to the new file
                destinationEditor.edit((edit) => {
                  if (destinationEditor) {
                    if (range.start.character === range.end.character) {
                      edit.insert(destinationEditor.selection.end, noteContents);
                    } else {
                      // If the last line is not empty, insert the note contents on a new line
                      edit.insert(destinationEditor.selection.end, '\n\n' + noteContents);
                    }
                  }
                });

                // Replace the selected content in the origin file with a wiki-link to the new file
                const edit = new vscode.WorkspaceEdit();
                const wikiLink = NoteWorkspace.wikiLinkCompletionForConvention(
                  destinationUri,
                  originEditor.document
                );

                edit.replace(
                  originEditor.document.uri,
                  originSelectionRange,
                  NoteWorkspace.selectionReplacementContent(wikiLink, noteName)
                );

                vscode.workspace.applyEdit(edit);
              }
            }
          });
      },
      (err) => {
        vscode.window.showErrorMessage('Error creating new note.');
      }
    );
  }

  static async createNewNoteFile(noteTitle: string) {
    let workspacePath = '';
    if (vscode.workspace.workspaceFolders) {
      workspacePath = vscode.workspace.workspaceFolders[0].uri.fsPath.toString();
    }
    const activeFile = vscode.window.activeTextEditor?.document;
    let activePath = activeFile ? dirname(activeFile.uri.fsPath) : null;

    let noteDirectory = this.newNoteDirectory();
    // first handle the case where we try to use same dir as active note:
    if (noteDirectory == this.NEW_NOTE_SAME_AS_ACTIVE_NOTE) {
      if (activePath) {
        noteDirectory = activePath;
      } else {
        vscode.window.showWarningMessage(
          `Error. newNoteDirectory was NEW_NOTE_SAME_AS_ACTIVE_NOTE but no active note directory found. Using WORKSPACE_ROOT.`
        );
        noteDirectory = this.NEW_NOTE_WORKSPACE_ROOT;
      }
    }
    // next, handle a case where this is set to a custom path
    if (noteDirectory != this.NEW_NOTE_WORKSPACE_ROOT) {
      // If the noteDirectory was set from the current activePath,
      // it will already be absolute.
      // Also, might as well handle case where user has
      // an absolute path in their settings.
      if (!isAbsolute(noteDirectory)) {
        noteDirectory = join(workspacePath, noteDirectory);
      }
      const dirExists = existsSync(noteDirectory);
      if (!dirExists) {
        vscode.window.showWarningMessage(
          `Error. newNoteDirectory \`${noteDirectory}\` does not exist. Using WORKSPACE_ROOT.`
        );
        noteDirectory = this.NEW_NOTE_WORKSPACE_ROOT;
      }
    }
    // need to recheck this in case we handled correctly above.
    // on errors, we will have set to this value:
    if (noteDirectory == this.NEW_NOTE_WORKSPACE_ROOT) {
      noteDirectory = workspacePath;
    }

    const filename = NoteWorkspace.noteFileNameFromTitle(noteTitle);
    const filepath = join(noteDirectory, filename);

    const fileAlreadyExists = existsSync(filepath);
    if (!fileAlreadyExists) {
      // create the file if it does not exist
      const contents = NoteWorkspace.newNoteContent(noteTitle);
      const edit = new vscode.WorkspaceEdit();
      const fileUri = vscode.Uri.file(filepath);
      edit.createFile(fileUri);
      await vscode.workspace.applyEdit(edit);
      await vscode.workspace.fs.writeFile(fileUri, new TextEncoder().encode(contents));
    }

    return {
      filepath: filepath,
      fileAlreadyExists: fileAlreadyExists,
    };
  }

  static newNoteContent(noteName: string) {
    const template = NoteWorkspace.newNoteTemplate();
    const d = (new Date().toISOString().match(/(\d{4}-\d{2}-\d{2})/) || '')[0]; // "2020-08-25"
    const t = new Date().toISOString(); // "2020-08-25T03:21:49.735Z"
    const contents = template
      .replace(/\\n/g, '\n')
      .replace(/\$\{noteName\}/g, noteName)
      .replace(/\$\{timestamp\}/g, t)
      .replace(/\$\{date\}/g, d);
    return contents;
  }

  static selectionReplacementContent(wikiLink: string, noteName: string) {
    const template = NoteWorkspace.newNoteFromSelectionReplacementTemplate();
    const contents = template
      .replace(/\$\{wikiLink\}/g, wikiLink)
      .replace(/\$\{noteName\}/g, noteName);

    return contents;
  }

  static overrideMarkdownWordPattern() {
    // console.debug('overrideMarkdownWordPattern');
    this.DOCUMENT_SELECTOR.map((ds) => {
      vscode.languages.setLanguageConfiguration(ds.language, {
        wordPattern: this.rxMarkdownWordPattern(),
      });
    });
  }

  static async noteFiles(): Promise<Array<vscode.Uri>> {
    let that = this;

    // let files = await vscode.workspace.findFiles('**/*');
    let files = await findNonIgnoredFiles('**/*');
    files = files.filter((f) => f.scheme == 'file' && f.path.match(that.rxFileExtensions()));
    this.noteFileCache = files;
    return files;
  }

  static noteFilesFromCache(): Array<vscode.Uri> {
    return this.noteFileCache;
  }
}
