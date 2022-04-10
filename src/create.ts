import { createDraft, finalizeDraft } from './draft';
import type { Patches, ProxyDraft, Result } from './interface';
import { deepFreeze, isDraftable } from './utils';

/**
 * something
 */
export function create<T extends object, O extends boolean = false>(
  initialState: T,
  mutate: (draftState: T) => void,
  options?: {
    enablePatches?: O;
    enableFreeze?: boolean;
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
  const draftState = createDraft({
    original: initialState,
    proxiesMap,
    parentDraft: null,
    patches,
    inversePatches,
    finalities,
    enableFreeze: options?.enableFreeze,
  });
  mutate(draftState);
  const state = finalizeDraft(draftState) as T;
  return { state, patches, inversePatches } as Result<T, O>;
}
