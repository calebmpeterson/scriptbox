import * as vscode from "vscode";
import { isArray } from "lodash";
import * as path from "path";
import * as fs from "fs";
import { ScriptFunctionFileIntents } from "../types";
import { isScriptFunctionFileIntent } from "./isScriptFunctionFileIntent";

// TODO: rename to processScriptFunctionResults
export const updateCurrentTextSelection = (
  update: string | ScriptFunctionFileIntents,
  editor: vscode.TextEditor | undefined
) => {
  if (!editor) {
    return;
  }

  const selection = editor.selection;

  if (isArray(update)) {
    update.forEach((item) => {
      if (isScriptFunctionFileIntent(item)) {
        const basePath = editor.document.uri.fsPath;
        const targetPath = path.normalize(
          path.join(path.dirname(basePath), item.filename)
        );

        fs.writeFileSync(targetPath, item.content, "utf8");
      }
    });
  } else {
    // Replace the entire document's content
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
        builder.replace(range, update);
      });
    }
    // Replace only the selection
    else {
      editor.edit((builder) => {
        builder.replace(selection, update);
      });
    }
  }
};
