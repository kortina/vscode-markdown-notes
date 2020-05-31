import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ReferenceSearch } from './ReferenceSearch';

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

  getChildren(element?: BacklinkItem): Thenable<BacklinkItem[]> {
    if (!this.workspaceRoot) {
      vscode.window.showInformationMessage('No refs in empty workspace');
      return Promise.resolve([]);
    }

    if (!element) {
      return Promise.resolve([new BacklinkItem(`root`, vscode.TreeItemCollapsibleState.Expanded)]);
    } else if (element.label == `root` && vscode.window.activeTextEditor) {
      let fn = path.basename(vscode.window.activeTextEditor.document.uri.fsPath);
      let refs = ReferenceSearch.searchBacklinksFor(fn);

      return Promise.resolve([
        new BacklinkItem(`child-1`, vscode.TreeItemCollapsibleState.None),
        new BacklinkItem(`child-2`, vscode.TreeItemCollapsibleState.None),
        new BacklinkItem(`child-3`, vscode.TreeItemCollapsibleState.None),
      ]);
    } else {
      return Promise.resolve([]);
    }
  }
}

class BacklinkItem extends vscode.TreeItem {
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
