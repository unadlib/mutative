export function assertAlways(
  condition: unknown,
  message?: string | (() => string)
): asserts condition {
  if (!condition) {
    if (message !== undefined) {
      if (typeof message === 'function') {
        throw new Error(message());
      } else {
        throw new Error(message);
      }
    } else {
      throw new Error(`assertion error`);
    }
  }
}
