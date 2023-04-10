export const loadScript = (path: string) => {
  try {
    delete require.cache[require.resolve(path)];
    return require(path);
  } catch (err) {
    throw new Error(`Error loading '${path}': ${err.message}`);
  }
};
