"use strict";

import * as vscode from "vscode";
import { homedir } from "os";
import { readdir, writeFileSync, mkdirSync, existsSync } from "fs";
import { sep, extname } from "path";
import * as vm from "vm";
import * as _ from "lodash";

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

// Load ~/.scriptbox/.env file
require("dotenv").config({ path: getScriptDir() + ".env" });

const isScript = (filename: string) =>
  filename.endsWith(".js") && !filename.endsWith(SCRATCH_FILENAME);

const enumerateScripts = (dir: string) =>
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

const loadScript = (path: string) => {
  try {
    delete require.cache[require.resolve(path)];
    return require(path);
  } catch (err) {
    throw new Error(`Error loading '${path}': ${err.message}`);
  }
};

const isPromise = (value: any): value is Promise<unknown> =>
  typeof value === "object" &&
  "then" in value &&
  typeof value.then === "function";

const shouldUpdateCurrentTextSelection = (
  transformed: unknown | boolean | undefined | null
) => transformed !== undefined && transformed !== null && transformed !== false;

const executeScript = (module: Function) => {
  const context = vscode;
  const args = [getCurrentTextSelection()];
  const transformed = module.apply(context, args);

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
            updateCurrentTextSelection(result);
          }
        } catch (e) {
          vscode.window.showErrorMessage(e.message);
        }
      }
    );
  } else {
    if (shouldUpdateCurrentTextSelection(transformed)) {
      updateCurrentTextSelection(transformed);
    }
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

const updateCurrentTextSelection = (text: string) => {
  const editor = vscode.window.activeTextEditor;

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

const createLogger =
  (outputChannel: vscode.OutputChannel, level: string) =>
  (message?: string, ...args: any[]) => {
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

const createQuickPickItemsForScripts = (
  scripts: string[]
): QuickPickScriptItem[] =>
  scripts.map((script) => ({
    script,
    label: script,
    description: `Execute '${script}' on the selected text`,
  }));

const openScriptForEditing = (scriptPath: string) => {
  vscode.workspace.openTextDocument(scriptPath).then(
    (document) =>
      vscode.window.showTextDocument(
        document,
        vscode.window.activeTextEditor
          ? vscode.window.activeTextEditor.viewColumn
          : 1
      ),
    (err) => {
      console.error(err);
    }
  );
};

const ensureScriptDir = (scriptDir: string) => {
  try {
    mkdirSync(scriptDir);
  } catch (err) {
    // Do nothing? The scriptDir must already exist
  }
};

const getScratchFilename = () => `${getScriptDir()}${SCRATCH_FILENAME}`;

const evaluateScratch = _.debounce(
  (outputChannel: vscode.OutputChannel, code: string) => {
    try {
      const ctx = vm.createContext({
        // This is where default imports for the scratch REPL go ...
        _,
      });
      outputChannel.clear();
      const result = vm.runInContext(code, ctx);
      outputChannel.show(true);
      console.log(JSON.stringify(result, null, "  "));
    } catch (err) {
      outputChannel.appendLine(`Failed to execute script ${err.message}`);
    }
  },
  300
);

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
