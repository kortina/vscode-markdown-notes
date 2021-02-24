import * as vscode from "vscode";
import { readFile, existsSync } from "fs";

type Config = {
  bibTeXFilePath: string;
};

export class BibTeXCitations {
  static _rxBibTeXInNote = /(?<= |,|^|\[|\[-)@[\p{L}\d\-_]+(?!\(.\S\))/giu;
  static _rxBibTeXInLibrary = /^@\S+{(\S+),/gm;

  static cfg(): Config {
    let c = vscode.workspace.getConfiguration("vscodeMarkdownNotes");
    return {
      bibTeXFilePath: c.get("bibtexFilePath") as string,
    };
  }

  static isBibtexFileConfigured(): Boolean {
    return existsSync(this.bibTexFilePath());
  }

  static rxBibTeX(): RegExp {
    return this._rxBibTeXInNote;
  }

  static async citations(): Promise<Array<string>> {
    return this.bibTeXFile().then((x) => this.parseCitations(x));
  }

  static async location(citation: string): Promise<vscode.Location> {
    return this.bibTeXFile().then((x) => {
      const pos = this.position(x, citation);
      if (pos == null) {
        return Promise.reject("Cannot get location");
      } else {
        const uri = vscode.Uri.file(this.bibTexFilePath());
        return new vscode.Location(uri, pos);
      }
    });
  }

  private static bibTexFilePath(): string {
    const path = this.cfg().bibTeXFilePath;

    // Absolute path (Unix and Windows)
    if (path.startsWith("/") || path.indexOf(":\\") == 1) {
      return path;
    }

    // Workspace relative path
    const folders = vscode.workspace?.workspaceFolders;
    if (folders && folders.length > 0) {
      return folders[0].uri.fsPath.toString() + "/" + path;
    }
    return path;
  }

  private static bibTeXFile(): Promise<string> {
    const path = this.bibTexFilePath();
    if (path == null || path == "") {
      return Promise.reject("BibTeX file location not set");
    }

    return new Promise((resolve, reject) => {
      readFile(path, (error, buffer) => {
        if (error) {
          reject(error);
        } else {
          resolve(buffer.toString());
        }
      });
    });
  }

  private static parseCitations(data: string): Array<string> {
    let matches = data.matchAll(this._rxBibTeXInLibrary);
    return Array.from(matches).map((x) => x[1]);
  }

  private static position(
    data: string,
    citation: string
  ): vscode.Position | null {
    let pos = data.match(citation)?.index;
    if (pos == null) {
      return null;
    }
    const numLines = data.substring(0, pos).split("\n").length;
    return new vscode.Position(numLines - 1, 0);
  }
}
