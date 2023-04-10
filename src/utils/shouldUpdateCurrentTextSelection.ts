export const shouldUpdateCurrentTextSelection = (
  transformed: unknown | boolean | undefined | null
) => transformed !== undefined && transformed !== null && transformed !== false;
