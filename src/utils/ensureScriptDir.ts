import { mkdirSync } from "fs";

export const ensureScriptDir = (scriptDir: string) => {
  try {
    mkdirSync(scriptDir);
  } catch (err) {
    // Do nothing? The scriptDir must already exist
  }
};
