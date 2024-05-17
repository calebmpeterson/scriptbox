import * as vscode from "vscode";
import * as _ from "lodash";
import { ScriptFunction, ScriptFunctionResult } from "../types";
import { getCurrentTextSelection } from "./getCurrentTextSelection";
import { isPromise } from "./isPromise";
import { shouldUpdateCurrentTextSelection } from "./shouldUpdateCurrentTextSelection";
import { updateSelection } from "./updateCurrentTextSelection";

export const executeScript = (module: ScriptFunction, scriptName: string) => {
  const targetEditor = vscode.window.activeTextEditor;

  vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `Running script ${scriptName}`,
      cancellable: false,
    },
    async () => {
      const context = vscode;
      const targets = getCurrentTextSelection(targetEditor);
      for (const target of targets) {
        const args = [target.content];
        const transformed: ScriptFunctionResult = module.apply(context, args);

        try {
          const result = isPromise(transformed)
            ? await transformed
            : transformed;

          if (shouldUpdateCurrentTextSelection(result)) {
            await updateSelection(result, targetEditor, target.selection);
          }
        } catch (e) {
          vscode.window.showErrorMessage(e.message);
        }
      }
    }
  );
};
