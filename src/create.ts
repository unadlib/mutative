import { createDraft, finalizeDraft } from './draft';
import type { Patches, ProxyDraft, Result } from './interface';
import { convertToImmutable } from './recordTuple';
import { deepFreeze, isDraftable } from './utils';

/**
 * something
 */
export function create<T extends object, O extends boolean = false>(
  initialState: T,
  mutate: (draftState: T) => void,
  options?: {
    enablePatches?: O;
    enableAutoFreeze?: boolean;
    enableRecordTuple?: boolean;
  }
) {
  if (!isDraftable(initialState)) {
    throw new Error(
      'create() only supports plain object, array, set, map, record, and tuple.'
    );
  }
  const proxiesMap = new WeakMap<object, ProxyDraft>();
  const finalities: (() => void)[] = [];
  let patches: Patches | undefined;
  let inversePatches: Patches | undefined;
  if (options?.enablePatches) {
    patches = [];
    inversePatches = [];
  }
  const enableRecordTuple = !!options?.enableRecordTuple;
  const draftState = createDraft({
    original: initialState,
    proxiesMap,
    parentDraft: null,
    patches,
    inversePatches,
    finalities,
    enableRecordTuple,
  });
  mutate(draftState);
  let state = finalizeDraft(draftState, finalities) as T;
  if (options?.enableAutoFreeze && !enableRecordTuple) {
    deepFreeze(state);
  }
  if (enableRecordTuple) {
    state = convertToImmutable(state);
  }
  return {
    state,
    patches,
    inversePatches,
  } as Result<T, O>;
}
