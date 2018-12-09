"use strict";

import * as vscode from "vscode";
import { homedir } from "os";
import { readdir } from "fs";
import { sep } from "path";

const getScriptDir = () => homedir() + `${sep}.scriptbox${sep}`;

const enumerateScripts = dir =>
  new Promise<string[]>((resolve, reject) =>
    readdir(dir, (err, files) => {
      if (err && err.code == "ENOENT") {
        reject(new Error(`${getScriptDir()} does not exist`));
      } else if (err) {
        reject(err);
      } else if (files && files.length === 0) {
        reject(new Error(`${getScriptDir()} contains no scripts`));
      } else {
        resolve(files);
      }
    })
  );

const loadScript = path => {
  try {
    delete require.cache[require.resolve(path)];
    return require(path);
  } catch (err) {
    throw new Error(`Error loading '${path}': ${err.message}`);
  }
};

const getCurrentTextSelection = () => {
  const editor = vscode.window.activeTextEditor;

  if (!editor) {
    return;
  }

  const selection = editor.selection;
  return editor.document.getText(selection);
};

const updateCurrentTextSelection = text => {
  const editor = vscode.window.activeTextEditor;

  if (!editor) {
    return;
  }

  const selection = editor.selection;

  editor.edit(builder => {
    builder.replace(selection, text);
  });
};

export function activate(context: vscode.ExtensionContext) {
  console.log("ScriptBox is active");

  context.subscriptions.push(
    vscode.commands.registerCommand("extension.sayHello", () => {
      // The code you place here will be executed every time your command is executed

      // Display a message box to the user
      vscode.window.showInformationMessage("Hello, World");
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("extension.runScript", async () => {
      try {
        const scripts = await enumerateScripts(getScriptDir());

        const scriptItems = scripts.map(script => ({
          script,
          label: script,
          description: `Execute '${script}' on the selected text`
        }));

        const pickedScript = await vscode.window.showQuickPick(scriptItems);

        if (pickedScript) {
          const pickedScriptPath = getScriptDir() + pickedScript.script;
          const module = loadScript(pickedScriptPath);
          const transformed = module(getCurrentTextSelection());
          updateCurrentTextSelection(transformed);
        }
      } catch (err) {
        vscode.window.showErrorMessage(err.message);
      }
    })
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}