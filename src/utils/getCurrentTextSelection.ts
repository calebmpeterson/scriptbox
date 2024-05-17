import * as vscode from "vscode";
import { ExecutionTarget, ExecutionTargets } from "../types";

export const getCurrentTextSelection = (
  editor: vscode.TextEditor | undefined
): ExecutionTargets | undefined => {
  if (!editor) {
    return;
  }

  if (editor.selections.length > 1) {
    return editor.selections.map((selection) => ({
      content: editor.document.getText(selection),
      selection,
    }));
  }

  if (editor.selection.isEmpty) {
    return [
      { content: editor.document.getText(), selection: editor.selection },
    ];
  }

  return [
    {
      content: editor.document.getText(editor.selection),
      selection: editor.selection,
    },
  ];
};
