export const isPromise = (value: any): value is Promise<unknown> =>
  typeof value === "object" &&
  "then" in value &&
  typeof value.then === "function";
