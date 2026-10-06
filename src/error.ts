/**
 * Error codes are kept as a const enum so production builds can inline them.
 * Verify that production bundles contain neither an `ErrorCode` object nor
 * the member names when changing the build toolchain.
 * Keep numeric codes stable; retired codes must not be reassigned.
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
  // 12 was InvalidPatchPath and is reserved for historical errors.
  ReservedPatchAttribute = 13,
  CannotApplyPatch = 14,
  ReplacePatchOnSet = 15,
  UnsupportedPatchOperation = 16,
  ApplyOptionsToDraft = 17,
  OriginalOnNonDraft = 18,
  RawReturnWithoutValue = 19,
  RawReturnWithExtraArguments = 20,
  UnsupportedStringPathKey = 21,
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
  [ErrorCode.ReservedPatchAttribute]: [];
  [ErrorCode.CannotApplyPatch]: [path: (string | number)[]];
  [ErrorCode.ReplacePatchOnSet]: [];
  [ErrorCode.UnsupportedPatchOperation]: [op: string];
  [ErrorCode.ApplyOptionsToDraft]: [];
  [ErrorCode.OriginalOnNonDraft]: [target: any];
  [ErrorCode.RawReturnWithoutValue]: [];
  [ErrorCode.RawReturnWithExtraArguments]: [];
  [ErrorCode.UnsupportedStringPathKey]: [key: any];
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
      // Retired InvalidPatchPath (12).
      undefined,
      // ErrorCode.ReservedPatchAttribute
      () =>
        `Patching reserved attributes like __proto__ and constructor is not allowed.`,
      // ErrorCode.CannotApplyPatch
      (path) => `Cannot apply patch at '${path.join('/')}'.`,
      // ErrorCode.ReplacePatchOnSet
      () => `Cannot apply replace patch to set.`,
      // ErrorCode.UnsupportedPatchOperation
      (op) => `Unsupported patch operation: ${op}.`,
      // ErrorCode.ApplyOptionsToDraft
      () => `Cannot apply patches with options to a draft.`,
      // ErrorCode.OriginalOnNonDraft
      (target) => `original() is only used for a draft, parameter: ${target}`,
      // ErrorCode.RawReturnWithoutValue
      () => 'rawReturn() must be called with a value.',
      // ErrorCode.RawReturnWithExtraArguments
      () => 'rawReturn() must be called with one argument.',
      // ErrorCode.UnsupportedStringPathKey
      (key) =>
        `Patches with string paths only support string Map keys and no symbol keys, got a key of type '${typeof key}'. Set 'pathAsArray' to true to keep keys of other types.`,
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
