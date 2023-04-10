import * as vscode from "vscode";

const createLogger =
  (outputChannel: vscode.OutputChannel, level: string) =>
  (message?: string, ...args: any[]) => {
    outputChannel.appendLine([level, message, ...args].join(" "));
  };

export const initializeConsole = () => {
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
