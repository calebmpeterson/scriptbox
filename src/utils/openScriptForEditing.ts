import * as vscode from "vscode";

export const openScriptForEditing = (scriptPath: string) => {
  vscode.workspace.openTextDocument(scriptPath).then(
    (document) =>
      vscode.window.showTextDocument(
        document,
        vscode.window.activeTextEditor
          ? vscode.window.activeTextEditor.viewColumn
          : 1
      ),
    (err) => {
      console.error(err);
    }
  );
};
