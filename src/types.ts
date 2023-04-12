export type ScriptFunctionFileIntent = {
  filename: string;
  content: string;
};

export type ScriptFunctionFileIntents = ScriptFunctionFileIntent[];

export type ScriptFunctionReturnType =
  | ScriptFunctionFileIntents
  | string
  | undefined
  | null;

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
