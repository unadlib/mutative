const errors: ((...args: any[]) => string)[] = __DEV__
  ? [
      () =>
        `Invalid base state: create() only supports plain objects, arrays, Set, Map or using mark() to mark the state as immutable.`,
      () => `Map/Set draft does not support any property assignment.`,
      () => `Only supports setting array indices and the 'length' property.`,
      () => `Cannot call 'setPrototypeOf()' on drafts`,
      () => `Cannot call 'defineProperty()' on drafts`,
      () =>
        `Either the value is returned as a new non-draft value, or only the draft is modified without returning any value.`,
      () => `Cannot return a modified child draft.`,
      (target) => `current() is only used for Draft, parameter: ${target}`,
      () =>
        `Strict mode: Mutable data cannot be accessed directly, please use 'unsafe(callback)' wrap.`,
      (markResult) => `Unsupported mark result: ${markResult}`,
      () =>
        `Please check mark() to ensure that it is a stable marker draftable function.`,
      () => `Cannot modify frozen object`,
      (path) => `Cannot resolve patch at '${path.join('/')}'.`,
    ]
  : [];

export function die(error: number, ...args: any[]): never {
  if (__DEV__) {
    throw new Error(errors[error](...args));
  }
  throw new Error(
    `Minified Mutative error #${error}; visit https://mutative.js.org/docs/extra-topics/errors`
  );
}
