import * as vscode from "vscode";

const createLogger =
  (outputChannel: vscode.OutputChannel, level: string) =>
  (message?: string, ...args: any[]) => {
    outputChannel.appendLine([level, message, ...args].join(" "));
  };

export const initializeConsole = () => {
  const outputChannel = vscode.window.createOutputChannel("ScriptBox");

  return outputChannel;
};
