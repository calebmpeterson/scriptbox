import { isObject } from "lodash";
import { ScriptFunctionFileIntent, ScriptFunctionReturnType } from "../types";

export const isScriptFunctionFileIntent = (
  result: unknown
): result is ScriptFunctionFileIntent => isObject(result);
