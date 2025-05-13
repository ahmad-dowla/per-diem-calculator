export const inPrimitiveType = <T>(values: readonly T[], x: any): x is T => {
  return values.includes(x);
};
