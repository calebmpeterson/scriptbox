import * as vscode from "vscode";
import * as vm from "vm";
import * as _ from "lodash";

export const evaluateScratch = _.debounce(
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
