import type { Finalities, Options, Patches, Result } from './interface';
import { createDraft, finalizeDraft } from './draft';
import { getProxyDraft, isDraftable } from './utils';
import { finalizePatches } from './patch';

export function draftify<
  T extends object,
  O extends boolean = false,
  F extends boolean = false
>(baseState: T, options?: Options<O, F>): [T, () => Result<T, O, F>] {
  const marker = options?.mark;
  const enablePatches = options?.enablePatches ?? false;
  if (!isDraftable(baseState, { marker })) {
    throw new Error(
      'create() only supports plain object, array, set, and map.'
    );
  }
  const finalities: Finalities = {
    draft: [],
    revoke: [],
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
    enableAutoFreeze: options?.enableAutoFreeze,
    marker,
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
