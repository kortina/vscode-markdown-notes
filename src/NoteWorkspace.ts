import * as vscode from 'vscode';
import { basename, dirname, isAbsolute, join, normalize, relative } from 'path';
import { existsSync, writeFileSync } from 'fs';

export const foo = () => {
  return 1;
};

enum NoteCompletionConvention {
  rawFilename = 'rawFilename',
  noExtension = 'noExtension',
  toSpaces = 'toSpaces',
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

enum PipedWikiLinksSyntax {
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
  slugifyCharacter: SlugifyCharacter;
  workspaceFilenameConvention: WorkspaceFilenameConvention;
  newNoteTemplate: string;
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
  static _rxTagNoAnchors = '\\#[\\w\\-\\_]+'; // used to match tags that appear within lines
  static _rxTagWithAnchors = '^\\#[\\w\\-\\_]+$'; // used to match entire words
  static _rxWikiLink = '\\[\\[[^sep\\]]+(sep[^sep\\]]+)?\\]\\]'; // [[wiki-link-regex(|with potential pipe)?]] Note: "sep" will be replaced with pipedWikiLinksSeparator on compile
  static _rxTitle = '(?<=^( {0,3}#[^\\S\\r\\n]+)).+';
  static _rxMarkdownWordPattern = '([\\_\\w\\#\\.\\/\\\\]+)'; // had to add [".", "/", "\"] to get relative path completion working and ["#"] to get tag completion working
  static _rxFileExtensions = '\\.(md|markdown|mdx|fountain)$';
  static _defaultFileExtension = 'md';
  static _defaultNoteTemplate = '# ${noteName}\n\n';
  static _defaultTriggerSuggestOnReplacement = true;
  static SLUGIFY_NONE = 'NONE';
  static NEW_NOTE_SAME_AS_ACTIVE_NOTE = 'SAME_AS_ACTIVE_NOTE';
  static NEW_NOTE_WORKSPACE_ROOT = 'WORKSPACE_ROOT';
  static _defaultSlugifyChar = '-';
  static _slugifyChar = '-';
  static DEFAULT_CONFIG: Config = {
    createNoteOnGoToDefinitionWhenMissing: true,
    compileSuggestionDetails: false,
    defaultFileExtension: NoteWorkspace._defaultFileExtension,
    noteCompletionConvention: NoteCompletionConvention.rawFilename,
    slugifyCharacter: SlugifyCharacter.dash,
    workspaceFilenameConvention: WorkspaceFilenameConvention.uniqueFilenames,
    newNoteTemplate: NoteWorkspace._defaultNoteTemplate,
    triggerSuggestOnReplacement: NoteWorkspace._defaultTriggerSuggestOnReplacement,
    allowPipedWikiLinks: false,
    pipedWikiLinksSyntax: PipedWikiLinksSyntax.descFile,
    pipedWikiLinksSeparator: '\\|',
    newNoteDirectory: NoteWorkspace.NEW_NOTE_SAME_AS_ACTIVE_NOTE,
    previewLabelStyling: PreviewLabelStyling.brackets,
    previewShowFileExtension: false,
  };
  static DOCUMENT_SELECTOR = [
    // { scheme: 'file', language: 'markdown' },
    // { scheme: 'file', language: 'mdx' },
    { language: 'markdown' },
    { language: 'mdx' },
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
      slugifyCharacter: c.get('slugifyCharacter') as SlugifyCharacter,
      workspaceFilenameConvention: c.get(
        'workspaceFilenameConvention'
      ) as WorkspaceFilenameConvention,
      newNoteTemplate: c.get('newNoteTemplate') as string,
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

  static slugifyChar(): string {
    return this.cfg().slugifyCharacter;
  }

  static defaultFileExtension(): string {
    return this.cfg().defaultFileExtension;
  }

  static newNoteTemplate(): string {
    return this.cfg().newNoteTemplate;
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

  static rxTagNoAnchors(): RegExp {
    // NB: MUST have g flag to match multiple words per line
    // return /\#[\w\-\_]+/i; // used to match tags that appear within lines
    return new RegExp(this._rxTagNoAnchors, 'gi');
  }
  static rxTagWithAnchors(): RegExp {
    // NB: MUST have g flag to match multiple words per line
    // return /^\#[\w\-\_]+$/i; // used to match entire words
    return new RegExp(this._rxTagWithAnchors, 'gi');
  }
  static rxWikiLink(): RegExp {
    // NB: MUST have g flag to match multiple words per line
    // return /\[\[[\w\.\-\_\/\\]+/i; // [[wiki-link-regex
    this._rxWikiLink = this._rxWikiLink.replace(/sep/g, NoteWorkspace.pipedWikiLinksSeparator());
    return new RegExp(this._rxWikiLink, 'gi');
  }
  static rxTitle(): RegExp {
    return new RegExp(this._rxTitle, 'gi');
  }
  static rxMarkdownWordPattern(): RegExp {
    // return /([\#\.\/\\\w_]+)/; // had to add [".", "/", "\"] to get relative path completion working and ["#"] to get tag completion working
    return new RegExp(this._rxMarkdownWordPattern);
  }
  static rxFileExtensions(): RegExp {
    // return noteName.replace(/\.(md|markdown|mdx|fountain)$/i, '');
    return new RegExp(this._rxFileExtensions, 'i');
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

  // Compare 2 wiki-links for a fuzzy match.
  // All of the following will return true
  static noteNamesFuzzyMatch(left: string, right: string): boolean {
    return (
      this.normalizeNoteNameForFuzzyMatch(left).toLowerCase() ==
      this.normalizeNoteNameForFuzzyMatchText(right).toLowerCase()
    );
  }

  static noteNamesFuzzyMatchText(left: string, right: string): boolean {
    return (
      this.normalizeNoteNameForFuzzyMatchText(left).toLowerCase() ==
      this.normalizeNoteNameForFuzzyMatchText(right).toLowerCase()
    );
  }

  static cleanTitle(title: string): string {
    return title
      .toLowerCase() // lower
      .replace(/[-_－＿ ]*$/g, ''); // removing trailing slug chars
  }
  static slugifyTitle(title: string): string {
    let t =
      this.slugifyChar() == 'NONE'
        ? title
        : title.replace(/[!"\#$%&'()*+,\-./:;<=>?@\[\\\]^_‘{|}~\s]+/gi, this.slugifyChar()); // punctuation and whitespace to hyphens (or underscores)
    return this.cleanTitle(t);
  }

  static noteFileNameFromTitle(title: string): string {
    let t = this.slugifyTitle(title);
    return t.match(this.rxFileExtensions()) ? t : `${t}.${this.defaultFileExtension()}`;
  }

  static newNote(context: vscode.ExtensionContext) {
    // console.debug('newNote');
    const inputBoxPromise = vscode.window.showInputBox({
      prompt:
        "Enter a 'Title Case Name' to create `title-case-name.md` with '# Title Case Name' at the top.",
      value: '',
    });

    inputBoxPromise.then(
      (noteName) => {
        if (noteName == null || !noteName || noteName.replace(/\s+/g, '') == '') {
          // console.debug('Abort: noteName was empty.');
          return false;
        }
        const { filepath, fileAlreadyExists } = NoteWorkspace.createNewNoteFile(noteName);

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
      }
    );
  }

  static createNewNoteFile(noteTitle: string) {
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
          `Error. newNoteDirectory was NEW_NOT_SAME_AS_ACTIVE_NOTE but no active note directory found. Using WORKSPACE_ROOT.`
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
    if (fileAlreadyExists) {
      vscode.window.showWarningMessage(
        `Error creating note, file at path already exists: ${filepath}`
      );
    } else {
      // create the file if it does not exist
      const contents = NoteWorkspace.newNoteContent(noteTitle);
      writeFileSync(filepath, contents);
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
    let files = (await vscode.workspace.findFiles('**/*')).filter(
      (f) => f.scheme == 'file' && f.path.match(that.rxFileExtensions())
    );
    this.noteFileCache = files;
    return files;
  }

  static noteFilesFromCache(): Array<vscode.Uri> {
    return this.noteFileCache;
  }
}
