import { SCRATCH_FILENAME } from "../constants";
import { getScriptDir } from "./getScriptDir";

export const getScratchFilename = () => `${getScriptDir()}${SCRATCH_FILENAME}`;
