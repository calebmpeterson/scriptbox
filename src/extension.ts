"use strict";

import * as vscode from "vscode";
import { homedir } from "os";
import { readdir } from "fs";
import { sep } from "path";

const getScriptDir = () => homedir() + `${sep}.scriptbox${sep}`;

const isScript = filename => filename.endsWith(".js");

const enumerateScripts = dir =>
  new Promise<string[]>((resolve, reject) =>
    readdir(dir, (err, files) => {
      if (err && err.code == "ENOENT") {
        reject(new Error(`${getScriptDir()} does not exist`));
      } else if (err) {
        reject(err);
      } else if (files && files.filter(isScript).length === 0) {
        reject(new Error(`${getScriptDir()} contains no scripts`));
      } else {
        resolve(files.filter(isScript));
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

const shouldUpdateCurrentTextSelection = transformed =>
  transformed !== undefined && transformed !== null && transformed !== false;

const executeScript = module => {
  const context = vscode;
  const args = [getCurrentTextSelection()];
  const transformed = module.apply(context, args);
  if (shouldUpdateCurrentTextSelection(transformed)) {
    updateCurrentTextSelection(transformed);
  }
};

const getCurrentTextSelection = () => {
  const editor = vscode.window.activeTextEditor;

  if (!editor) {
    return;
  }

  const selection = editor.selection;
  if (selection.isEmpty) {
    return editor.document.getText();
  }
  return editor.document.getText(selection);
};

const updateCurrentTextSelection = text => {
  const editor = vscode.window.activeTextEditor;

  if (!editor) {
    return;
  }

  const selection = editor.selection;

  if (selection.isEmpty) {
    editor.edit(builder => {
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
    editor.edit(builder => {
      builder.replace(selection, text);
    });
  }
};

const createLogger = (outputChannel, level) => (message?, ...args) => {
  outputChannel.appendLine([level, message, ...args].join(" "));
};

const initializeConsole = () => {
  const outputChannel = vscode.window.createOutputChannel("ScriptBox");

  console.log = createLogger(outputChannel, "LOG  ");
  console.info = createLogger(outputChannel, "INFO ");
  console.warn = createLogger(outputChannel, "WARN ");
  console.error = createLogger(outputChannel, "ERROR");

  console.log(
    "All console.* statements from ScriptBox scripts will appear here"
  );
};

export function activate(context: vscode.ExtensionContext) {
  initializeConsole();

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
          executeScript(module);
        }
      } catch (err) {
        vscode.window.showErrorMessage(err.message);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("extension.runSelection", async () => {
      try {
        const selection = getCurrentTextSelection();
        const result = eval(selection);
        console.log(`Result`, result);
      } catch (err) {
        vscode.window.showErrorMessage(`Evaluation error: ${err.message}`);
        console.error(err);
      }
    })
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
