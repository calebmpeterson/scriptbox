import { QuickPickScriptItem } from "../types";

export const createQuickPickItemsForScripts = (
  scripts: string[]
): QuickPickScriptItem[] =>
  scripts.map((script) => ({
    script,
    label: script,
    description: `Execute '${script}' on the selected text`,
  }));
