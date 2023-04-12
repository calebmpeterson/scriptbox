import * as vscode from "vscode";
import * as _ from "lodash";
import { ScriptFunction, ScriptFunctionResult } from "../types";
import { getCurrentTextSelection } from "./getCurrentTextSelection";
import { isPromise } from "./isPromise";
import { shouldUpdateCurrentTextSelection } from "./shouldUpdateCurrentTextSelection";
import { updateCurrentTextSelection } from "./updateCurrentTextSelection";

export const executeScript = (module: ScriptFunction, pickedScript: string) => {
  const context = vscode;
  const targetEditor = vscode.window.activeTextEditor;
  const args = [getCurrentTextSelection(targetEditor)];
  const transformed: ScriptFunctionResult = module.apply(context, args);

  if (isPromise(transformed)) {
    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Running script ${pickedScript}`,
        cancellable: false,
      },
      async () => {
        try {
          const result = await transformed;

          if (shouldUpdateCurrentTextSelection(result)) {
            updateCurrentTextSelection(result, targetEditor);
          }
        } catch (e) {
          vscode.window.showErrorMessage(e.message);
        }
      }
    );
  } else {
    if (shouldUpdateCurrentTextSelection(transformed)) {
      updateCurrentTextSelection(transformed, targetEditor);
    }
  }
};
