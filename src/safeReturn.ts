export const safeReturnValue: unknown[] = [];

/**
 * It is used as a safe return value to ensure that this value replaces the finalized value.
 */
export function safeReturn<T extends object | undefined>(value: T): T {
  if (arguments.length === 0) {
    throw new Error('safeReturn() must be called with a value.');
  }
  if (arguments.length > 1) {
    throw new Error('safeReturn() must be called with one argument.');
  }
  if (
    __DEV__ &&
    value !== undefined &&
    (typeof value !== 'object' || value === null)
  ) {
    console.warn(
      'safeReturn() must be called with an object or undefined, other types do not need to be returned via safeReturn().'
    );
  }
  safeReturnValue[0] = value;
  return value;
}
