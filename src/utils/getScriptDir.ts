import { sep } from "path";
import { homedir } from "os";

export const getScriptDir = () => homedir() + `${sep}.scriptbox${sep}`;
