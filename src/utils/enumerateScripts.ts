import { readdir } from "fs";
import { getScriptDir } from "./getScriptDir";
import { isScript } from "./isScript";

export const enumerateScripts = (dir: string) =>
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
