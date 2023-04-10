import { SCRATCH_FILENAME } from "../constants";

export const isScript = (filename: string) =>
  filename.endsWith(".js") && !filename.endsWith(SCRATCH_FILENAME);
