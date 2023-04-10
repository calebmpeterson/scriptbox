import * as vscode from "vscode";

export const updateCurrentTextSelection = (
  text: string,
  editor: vscode.TextEditor | undefined
) => {
  if (!editor) {
    return;
  }

  const selection = editor.selection;

  if (selection.isEmpty) {
    editor.edit((builder) => {
      const currentText = editor.document.getText();
      const definiteLastCharacter = currentText.length;
      const range = new vscode.Range(
        0,
        0,
        editor.document.lineCount,
        definiteLastCharacter
      );
      builder.replace(range, text);
    });
  } else {
    editor.edit((builder) => {
      builder.replace(selection, text);
    });
  }
};
