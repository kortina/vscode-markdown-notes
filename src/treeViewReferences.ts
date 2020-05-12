import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class NoteRefsTreeDataProvider implements vscode.TreeDataProvider<NoteRefTreeItem> {
  constructor(private workspaceRoot: string | null) {}

  getTreeItem(element: NoteRefTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: NoteRefTreeItem): Thenable<NoteRefTreeItem[]> {
    if (!this.workspaceRoot) {
      vscode.window.showInformationMessage('No refs in empty workspace');
      return Promise.resolve([]);
    }

    if (!element) {
      return Promise.resolve([
        new NoteRefTreeItem(`root`, vscode.TreeItemCollapsibleState.Expanded),
      ]);
    } else if (element.label == `root`) {
      return Promise.resolve([
        new NoteRefTreeItem(`child-1`, vscode.TreeItemCollapsibleState.None),
        new NoteRefTreeItem(`child-2`, vscode.TreeItemCollapsibleState.None),
        new NoteRefTreeItem(`child-3`, vscode.TreeItemCollapsibleState.None),
      ]);
    } else {
      return Promise.resolve([]);
    }
  }
}

class NoteRefTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
  }

  get tooltip(): string {
    return `${this.label}`;
  }

  get description(): string {
    return this.label;
  }

  iconPath = {
    light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
    dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg'),
  };
}
