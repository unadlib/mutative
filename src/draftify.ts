import type { Finalities, Options, Patches, Result } from './interface';
import { createDraft, finalizeDraft } from './draft';
import { isDraftable } from './utils';

/**
 * `draftify(baseState, options)` to create the state draft
 *
 * ## Example
 *
 * ```ts
 * import { draftify } from '../index';
 *
 * const baseState = { foo: { bar: 'str' }, arr: [] };
 * const [draft, finalize] = draftify(baseState);
 * draft.foo.bar = 'str2';
 * const state = finalize();
 *
 * expect(state).toEqual({ foo: { bar: 'str2' }, arr: [] });
 * expect(state).not.toBe(baseState);
 * expect(state.foo).not.toBe(baseState.foo);
 * expect(state.arr).toBe(baseState.arr);
 */
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
