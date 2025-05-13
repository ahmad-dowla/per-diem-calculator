// Memoize function that works with generics https://github.com/alexreardon/memoize-one/issues/74
export function memoize<F extends <T extends any>(...args: [T, ...any[]]) => ReturnType<F>>(
  fn: F,
): F;
export function memoize<F extends (...args: any[]) => ReturnType<F>>(fn: F): F;
export function memoize<F extends <T extends any>(...args: [T, ...any[]]) => ReturnType<F>>(
  fn: F,
): F {
  let lastArgs: unknown[] = [];
  let lastResult: ReturnType<F>;
  let calledOnce = false;

  /**
   * Compare arguments for shallow identity equality.
   */
  const argsEqual = (a: unknown[], b: unknown[]): boolean => {
    if (a.length !== b.length) {
      return false;
    }

    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        return false;
      }
    }
    return true;
  };

  /**
   * Wrap function in memoized function.
   */
  const memoized = <U extends any>(...newArgs: [U, ...any[]]): ReturnType<F> => {
    if (!calledOnce || !argsEqual(lastArgs, newArgs)) {
      const newResult = fn(...newArgs);
      lastResult = newResult;
      lastArgs = newArgs;
      calledOnce = true;
    }
    return lastResult;
  };

  return memoized as F;
}
