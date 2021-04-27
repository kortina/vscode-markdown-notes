import * as vscode from "vscode";
import { padNumber } from "./utils";

export default class ZettelkastenUtilities {
  static generateId() {
    const date = new Date();

    const id = [
      padNumber(date.getFullYear(), 4),
      padNumber(date.getMonth() + 1, 2),
      padNumber(date.getDate(), 2),
      padNumber(date.getHours(), 2),
      padNumber(date.getMinutes(), 2),
    ].join("");

    return id;
  }

  static insertId() {
    const editor = vscode.window.activeTextEditor;
    if (editor != null) {
      const newId = ZettelkastenUtilities.generateId();
      editor.insertSnippet(new vscode.SnippetString(newId));
    }
  }
}
