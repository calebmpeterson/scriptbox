export type ScriptFunctionReturnType = string | undefined | null;

export type ScriptFunctionResult =
  | ScriptFunctionReturnType
  | Promise<ScriptFunctionReturnType>;

export type ScriptFunction = (
  selectionOrActiveEditorContent: string
) => ScriptFunctionResult;

export type QuickPickScriptItem = {
  script: string;
  label: string;
  description: string;
};
