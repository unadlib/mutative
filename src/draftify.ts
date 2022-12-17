import type { Finalities, Options, Patches, Result } from './interface';
import { createDraft, finalizeDraft } from './draft';
import { isDraftable } from './utils';

export function draftify<
  T extends object,
  O extends boolean = false,
  F extends boolean = false
>(baseState: T, _options?: Options<O, F>): [T, () => Result<T, O, F>] {
  const mark = _options?.mark;
  const enablePatches = _options?.enablePatches ?? false;
  const strict = _options?.strict ?? false;
  const enableAutoFreeze = _options?.enableAutoFreeze ?? false;
  const options = {
    enableAutoFreeze,
    mark,
    strict,
    enablePatches,
  };
  if (!isDraftable(baseState, options)) {
    throw new Error(
      'create() only supports plain object, array, set, and map.'
    );
  }
  const finalities: Finalities = {
    draft: [],
    revoke: [],
    handledSet: new WeakSet<any>(),
  };
  let patches: Patches | undefined;
  let inversePatches: Patches | undefined;
  if (enablePatches) {
    patches = [];
    inversePatches = [];
  }
  const draft = createDraft({
    original: baseState,
    parentDraft: null,
    finalities,
    options,
  });
  return [
    draft,
    () => {
      const [finalizedState, finalizedPatches, finalizedInversePatches] =
        finalizeDraft(draft, patches, inversePatches);
      return (
        enablePatches
          ? [finalizedState, finalizedPatches, finalizedInversePatches]
          : finalizedState
      ) as Result<T, O, F>;
    },
  ];
}
