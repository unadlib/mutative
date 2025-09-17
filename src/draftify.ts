import {
  Finalities,
  Options,
  Patches,
  PatchesOptions,
  Result,
} from './interface';
import { createDraft, finalizeDraft } from './draft';
import { isDraftable } from './utils';
import { dataTypes } from './constant';

export function draftify<
  T extends object,
  O extends PatchesOptions = false,
  F extends boolean = false,
>(
  baseState: T,
  options: Options<O, F>
): [T, (returnedValue: [T] | []) => Result<T, O, F>] {
  const finalities: Finalities = {
    draft: [],
    revoke: [],
    handledSet: new WeakSet<any>(),
    draftsCache: new WeakSet<object>(),
  };
  let patches: Patches | undefined;
  let inversePatches: Patches | undefined;
  if (options.enablePatches) {
    patches = [];
    inversePatches = [];
  }
  const isMutable =
    options.mark?.(baseState, dataTypes) === dataTypes.mutable ||
    !isDraftable(baseState, options);
  const draft = isMutable
    ? baseState
    : createDraft({
        original: baseState,
        parentDraft: null,
        finalities,
        options,
      });
  return [
    draft,
    (returnedValue: [T] | [] = []) => {
      const [finalizedState, finalizedPatches, finalizedInversePatches] =
        finalizeDraft(
          draft,
          returnedValue,
          patches,
          inversePatches,
          options.enableAutoFreeze
        );
      return (
        options.enablePatches
          ? [finalizedState, finalizedPatches, finalizedInversePatches]
          : finalizedState
      ) as Result<T, O, F>;
    },
  ];
}
