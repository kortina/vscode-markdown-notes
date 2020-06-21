import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ReferenceSearch } from './ReferenceSearch';

type FileWithLocations = {
  file: string;
  locations: vscode.Location[];
};
export class BacklinksTreeDataProvider implements vscode.TreeDataProvider<BacklinkItem> {
  constructor(private workspaceRoot: string | null) {}
  _onDidChangeTreeData: vscode.EventEmitter<BacklinkItem> = new vscode.EventEmitter<BacklinkItem>();
  onDidChangeTreeData: vscode.Event<BacklinkItem> = this._onDidChangeTreeData.event;
  reload(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: BacklinkItem): vscode.TreeItem {
    return element;
  }

  // Take a flat list of locations, such as:
  // - file1.md, l1
  // - file2.md, l2
  // - file1.md, l3
  // And return as list of files with location lists:
  // - file1.md
  //   - l1
  //   - l3
  // - file2.md
  //   - l2
  // NB: does work well with relativePaths mode, assumes uniqueFilenames
  static locationListToTree(locations: vscode.Location[]): FileWithLocations[] {
    let m: Record<string, FileWithLocations> = {};
    locations.map((l) => {
      let f = path.basename(l.uri.fsPath);
      if (!m[f]) {
        let fwl: FileWithLocations = {
          file: f,
          locations: [],
        };
        m[f] = fwl;
      }
      m[f].locations.push(l);
    });
    let arr = Object.values(m);
    // sort the files by name:
    let asc = (a: string | number, b: string | number) => {
      if (a < b) {
        return -1;
      }
      if (a > b) {
        return 1;
      }
      return 0;
    };
    arr.sort((a, b) => asc(a.file, b.file));
    // sort the locations in each file by start position:
    return arr.map((fwl) => {
      fwl.locations.sort((locA, locB) => {
        let a = locA.range.start;
        let b = locB.range.start;
        if (a.line < b.line) {
          return -1;
        }
        if (a.line > b.line) {
          return 1;
        }
        // same line, compare chars
        if (a.character < b.character) {
          return -1;
        }
        if (a.character > b.character) {
          return 1;
        }
        return 0;
      });
      return fwl;
    });
  }

  getChildren(element?: BacklinkItem): Thenable<BacklinkItem[]> {
    let f = vscode.window.activeTextEditor?.document.uri.fsPath;
    if (!this.workspaceRoot || !f) {
      vscode.window.showInformationMessage('No refs in empty workspace');
      return Promise.resolve([]);
    }
    let activeFilename = path.basename(f);

    // TOP LEVEL:
    // Parse the workspace into list of FilesWithLocations
    // Return 1 collapsible element per file
    if (!element) {
      return ReferenceSearch.searchBacklinksFor(activeFilename).then((locations) => {
        let filesWithLocations = BacklinksTreeDataProvider.locationListToTree(locations);
        return filesWithLocations.map((fwl) => BacklinkItem.fromFileWithLocations(fwl));
      });
      // Given the collapsible elements,
      // return the children, 1 for each location within the file
    } else if (element && element.locations) {
      return Promise.resolve(element.locations.map((l) => BacklinkItem.fromLocation(l)));
    } else {
      return Promise.resolve([]);
    }
  }
}

class BacklinkItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public locations?: vscode.Location[],
    private location?: vscode.Location
  ) {
    super(label, collapsibleState);
  }

  // return the 1 collapsible Item for each file
  // store the locations within that file to the .locations attribute
  static fromFileWithLocations(fwl: FileWithLocations): BacklinkItem {
    let label = fwl.file;
    let cs = vscode.TreeItemCollapsibleState.Expanded;
    return new BacklinkItem(label, cs, fwl.locations, undefined);
  }

  // items for the locations within files
  static fromLocation(location: vscode.Location): BacklinkItem {
    // location / range is 0-indexed, but editor lines are 1-indexed
    let lineNum = location.range.start.line + 1;
    let label = `${lineNum}:`; // path.basename(location.uri.fsPath);
    let cs = vscode.TreeItemCollapsibleState.None;
    return new BacklinkItem(label, cs, undefined, location);
  }

  get command(): vscode.Command | undefined {
    if (this.location) {
      return {
        command: 'vscode.open',
        arguments: [
          this.location.uri,
          {
            preview: true,
            selection: this.location.range,
          },
        ],
        title: 'Open File',
      };
    }
  }

  get tooltip(): string {
    return this.description;
  }

  get description(): string {
    let d = ``;
    if (this.location) {
      let lines = (fs.readFileSync(this.location?.uri.fsPath) || '').toString().split(/\r?\n/);
      let line = lines[this.location?.range.start.line];
      // Look back 12 chars before the start of the reference.
      // There is almost certainly a more elegant way to do this.
      let s = this.location?.range.start.character - 12;
      if (s < 20) {
        s = 0;
      }
      return line.substr(s);
    } else if (this.locations) {
      d = `${this.locations?.length} References`;
    }
    return d;
  }

  get iconPath(): vscode.ThemeIcon | undefined {
    // to leave more room for the ref text,
    // don't use an icon for each line
    return this.location ? undefined : new vscode.ThemeIcon('references');
  }
}
