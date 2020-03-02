"use strict";

import * as vscode from "vscode";
import { homedir } from "os";
import { readdir, writeFileSync, mkdirSync, existsSync } from "fs";
import { sep, extname } from "path";
import * as vm from "vm";
import * as _ from "lodash";
import * as qim from "qim";

const SCRATCH_FILENAME = ".scratch.js";

const SCRATCH_TEMPLATE = `
// JavaScript REPL
// Lodash is already imported

`.trim();

const SCRIPT_TEMPLATE = `
module.exports = function (selection) {
  // selection is a string containing:
  // 1. the current text selection
  // 2. the entire contents of the active editor when nothing is selected
  return selection;
};
`.trim();

const getScriptDir = () => homedir() + `${sep}.scriptbox${sep}`;

const isScript = filename =>
  filename.endsWith(".js") && !filename.endsWith(SCRATCH_FILENAME);

const enumerateScripts = dir =>
  new Promise<string[]>((resolve, reject) =>
    readdir(dir, (err, files) => {
      if (err && err.code === "ENOENT") {
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

  return outputChannel;
};

type QuickPickScriptItem = {
  script: string;
  label: string;
  description: string;
};

const createQuickPickItemsForScripts = (scripts): QuickPickScriptItem[] =>
  scripts.map(script => ({
    script,
    label: script,
    description: `Execute '${script}' on the selected text`
  }));

const openScriptForEditing = scriptPath => {
  vscode.workspace.openTextDocument(scriptPath).then(
    document =>
      vscode.window.showTextDocument(
        document,
        vscode.window.activeTextEditor
          ? vscode.window.activeTextEditor.viewColumn
          : 1
      ),
    err => {
      console.error(err);
    }
  );
};

const ensureScriptDir = scriptDir => {
  try {
    mkdirSync(scriptDir);
  } catch (err) {
    // Do nothing? The scriptDir must already exist
  }
};

const evaluate = _.debounce(
  (outputChannel: vscode.OutputChannel, code: string) => {
    try {
      const ctx = vm.createContext({
        // This is where default imports for the scratch REPL go ...
        _,
        ...qim
      });
      const result = vm.runInContext(code, ctx);
      outputChannel.clear();
      outputChannel.show(true);
      console.log(JSON.stringify(result, null, "  "));
    } catch (err) {
      console.error(err);
    }
  },
  300
);

export function activate(context: vscode.ExtensionContext) {
  const outputChannel = initializeConsole();

  ensureScriptDir(getScriptDir());

  context.subscriptions.push(
    vscode.commands.registerCommand("extension.createScript", async () => {
      try {
        vscode.window
          .showInputBox({
            placeHolder: "Script Name.js"
          })
          .then(scriptName => {
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
    vscode.commands.registerCommand("extension.editScript", async () => {
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
    vscode.commands.registerCommand("extension.runScript", async () => {
      try {
        const scripts = await enumerateScripts(getScriptDir());

        const scriptItems = createQuickPickItemsForScripts(scripts);

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

  context.subscriptions.push(
    vscode.commands.registerCommand("extension.openScratch", async () => {
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
        const scratchFilename = `${getScriptDir()}${SCRATCH_FILENAME}`;
        const didScratchChange =
          e.document.fileName.toLowerCase() === scratchFilename.toLowerCase();

        if (didScratchChange) {
          const code = e.document.getText();
          evaluate(outputChannel, code);
        }
      }
    )
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
