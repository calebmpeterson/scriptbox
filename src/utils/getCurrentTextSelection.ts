import * as vscode from "vscode";

export const getCurrentTextSelection = (
  editor: vscode.TextEditor | undefined
) => {
  if (!editor) {
    return;
  }

  const selection = editor.selection;
  if (selection.isEmpty) {
    return editor.document.getText();
  }

  return editor.document.getText(selection);
};
