export const SCRIPT_TEMPLATE = `
// This function can be async; a busy indicator will show in VS Code
module.exports = (selection) => {
  // selection is a string containing:
  // 1. the current text selection
  // 2. the entire contents of the active editor when nothing is selected
  return selection;
};
`.trim();
