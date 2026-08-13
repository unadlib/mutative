/**
 * This exported const enum relies on the program-level TypeScript compilation
 * provided by `@rollup/plugin-typescript` to inline members across modules.
 * Isolated TypeScript transforms, such as Babel or SWC, may emit runtime enum
 * code instead. If the compiler changes, verify that production bundles contain
 * neither an `ErrorCode` object nor these member names.
 */
export const enum ErrorCode {
  InvalidBaseState = 0,
  CannotAssignToMapOrSet = 1,
  InvalidArrayIndex = 2,
  CannotSetPrototypeOfDraft = 3,
  CannotDefinePropertyOnDraft = 4,
  MutateAndReturn = 5,
  CannotReturnModifiedChildDraft = 6,
  CurrentOnNonDraft = 7,
  StrictModeAccess = 8,
  UnsupportedMarkResult = 9,
  InvalidMark = 10,
  CannotModifyFrozenObject = 11,
  InvalidPatchPath = 12,
}

type ErrorArguments = {
  [ErrorCode.InvalidBaseState]: [];
  [ErrorCode.CannotAssignToMapOrSet]: [];
  [ErrorCode.InvalidArrayIndex]: [];
  [ErrorCode.CannotSetPrototypeOfDraft]: [];
  [ErrorCode.CannotDefinePropertyOnDraft]: [];
  [ErrorCode.MutateAndReturn]: [];
  [ErrorCode.CannotReturnModifiedChildDraft]: [];
  [ErrorCode.CurrentOnNonDraft]: [target: any];
  [ErrorCode.StrictModeAccess]: [];
  [ErrorCode.UnsupportedMarkResult]: [markResult: any];
  [ErrorCode.InvalidMark]: [];
  [ErrorCode.CannotModifyFrozenObject]: [];
  [ErrorCode.InvalidPatchPath]: [path: (string | number)[]];
};

type ErrorBuilders = {
  [Code in ErrorCode]: (...args: ErrorArguments[Code]) => string;
};

const errors: ErrorBuilders = __DEV__
  ? [
      // ErrorCode.InvalidBaseState
      () =>
        `Invalid base state: create() only supports plain objects, arrays, Set, Map or using mark() to mark the state as immutable.`,
      // ErrorCode.CannotAssignToMapOrSet
      () => `Map/Set draft does not support any property assignment.`,
      // ErrorCode.InvalidArrayIndex
      () => `Only supports setting array indices and the 'length' property.`,
      // ErrorCode.CannotSetPrototypeOfDraft
      () => `Cannot call 'setPrototypeOf()' on drafts`,
      // ErrorCode.CannotDefinePropertyOnDraft
      () => `Cannot call 'defineProperty()' on drafts`,
      // ErrorCode.MutateAndReturn
      () =>
        `Either the value is returned as a new non-draft value, or only the draft is modified without returning any value.`,
      // ErrorCode.CannotReturnModifiedChildDraft
      () => `Cannot return a modified child draft.`,
      // ErrorCode.CurrentOnNonDraft
      (target) => `current() is only used for Draft, parameter: ${target}`,
      // ErrorCode.StrictModeAccess
      () =>
        `Strict mode: Mutable data cannot be accessed directly, please use 'unsafe(callback)' wrap.`,
      // ErrorCode.UnsupportedMarkResult
      (markResult) => `Unsupported mark result: ${markResult}`,
      // ErrorCode.InvalidMark
      () =>
        `Please check mark() to ensure that it is a stable marker draftable function.`,
      // ErrorCode.CannotModifyFrozenObject
      () => `Cannot modify frozen object`,
      // ErrorCode.InvalidPatchPath
      (path) => `Cannot resolve patch at '${path.join('/')}'.`,
    ]
  : ([] as unknown as ErrorBuilders);

export function die<Code extends ErrorCode>(
  error: Code,
  ...args: ErrorArguments[Code]
): never {
  if (__DEV__) {
    throw new Error(
      (errors[error] as (...builderArgs: ErrorArguments[Code]) => string)(
        ...args
      )
    );
  }
  throw new Error(
    `Minified Mutative error #${error}; visit https://mutative.js.org/docs/extra-topics/errors`
  );
}
