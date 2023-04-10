"use strict";

import * as vscode from "vscode";
import { writeFileSync, existsSync } from "fs";
import { extname } from "path";
import * as _ from "lodash";
import { ScriptFunction, ScriptFunctionResult } from "./types";
import { isPromise } from "./utils/isPromise";
import { getScriptDir } from "./utils/getScriptDir";
import { SCRATCH_FILENAME } from "./constants";
import { updateCurrentTextSelection } from "./utils/updateCurrentTextSelection";
import { shouldUpdateCurrentTextSelection } from "./utils/shouldUpdateCurrentTextSelection";
import { getCurrentTextSelection } from "./utils/getCurrentTextSelection";
import { ensureScriptDir } from "./utils/ensureScriptDir";
import { getScratchFilename } from "./utils/getScratchFilename";
import { createQuickPickItemsForScripts } from "./utils/createQuickPickItemsForScripts";
import { evaluateScratch } from "./utils/evaluateScratch";
import { enumerateScripts } from "./utils/enumerateScripts";
import { openScriptForEditing } from "./utils/openScriptForEditing";
import { initializeConsole } from "./utils/initializeConsole";
import { SCRIPT_TEMPLATE } from "./templates/script";
import { SCRATCH_TEMPLATE } from "./templates/scratch";

// Load ~/.scriptbox/.env file
require("dotenv").config({ path: getScriptDir() + ".env" });

const loadScript = (path: string) => {
  try {
    delete require.cache[require.resolve(path)];
    return require(path);
  } catch (err) {
    throw new Error(`Error loading '${path}': ${err.message}`);
  }
};

const executeScript = (module: ScriptFunction) => {
  const context = vscode;
  const targetEditor = vscode.window.activeTextEditor;
  const args = [getCurrentTextSelection(targetEditor)];
  const transformed: ScriptFunctionResult = module.apply(context, args);

  if (isPromise(transformed)) {
    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Running script`,
        cancellable: false,
      },
      async () => {
        try {
          const result = await transformed;

          if (shouldUpdateCurrentTextSelection(result) && _.isString(result)) {
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

export function activate(context: vscode.ExtensionContext) {
  const outputChannel = initializeConsole();

  ensureScriptDir(getScriptDir());

  context.subscriptions.push(
    vscode.commands.registerCommand("scriptbox.createScript", async () => {
      try {
        vscode.window
          .showInputBox({
            placeHolder: "Script Name.js",
          })
          .then((scriptName) => {
            const newScriptPath =
              getScriptDir() + scriptName + (extname(scriptName) || ".js");

            writeFileSync(newScriptPath, SCRIPT_TEMPLATE, "UTF-8");

            openScriptForEditing(newScriptPath);
          });
      } catch (err) {
        vscode.window.showErrorMessage(err.message);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("scriptbox.editScript", async () => {
      try {
        const scripts = await enumerateScripts(getScriptDir());

        const scriptItems = createQuickPickItemsForScripts(scripts);

        const pickedScript = await vscode.window.showQuickPick(scriptItems);

        if (pickedScript) {
          const pickedScriptPath = getScriptDir() + pickedScript.script;

          openScriptForEditing(pickedScriptPath);
        }
      } catch (err) {
        vscode.window.showErrorMessage(err.message);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "scriptbox.runScript",
      async (pickedScript?: string) => {
        try {
          if (!pickedScript) {
            const scripts = await enumerateScripts(getScriptDir());

            const scriptItems = createQuickPickItemsForScripts(scripts);

            const pickedScriptItem = await vscode.window.showQuickPick(
              scriptItems
            );
            pickedScript = pickedScriptItem?.script;
          }

          if (pickedScript) {
            const pickedScriptPath = getScriptDir() + pickedScript;
            const module = loadScript(pickedScriptPath);
            executeScript(module);
          }
        } catch (err) {
          vscode.window.showErrorMessage(err.message);
        }
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("scriptbox.runSelection", async () => {
      try {
        const selection = getCurrentTextSelection(
          vscode.window.activeTextEditor
        );
        const result = eval(selection);
        console.log(`Result`, result);
      } catch (err) {
        vscode.window.showErrorMessage(`Evaluation error: ${err.message}`);
        console.error(err);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("scriptbox.openScratch", async () => {
      const filename = `${getScriptDir()}${SCRATCH_FILENAME}`;

      if (!existsSync(filename)) {
        writeFileSync(filename, SCRATCH_TEMPLATE, "UTF-8");
      }

      openScriptForEditing(filename);
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(
      (e: vscode.TextDocumentChangeEvent) => {
        const scratchFilename = getScratchFilename();
        const didScratchChange =
          e.document.fileName.toLowerCase() === scratchFilename.toLowerCase();

        if (didScratchChange) {
          const code = e.document.getText();
          evaluateScratch(outputChannel, code);
        }
      }
    )
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
