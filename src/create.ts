import { createDraft, finalizeDraft } from './draft';
import type { Patches, ProxyDraft, Result } from './interface';
import { isDraftable } from './utils';

/**
 * something
 */
export function create<T extends object, O extends boolean = false>(
  initialState: T,
  mutate: (draftState: T) => void,
  options?: {
    enablePatches?: O;
    enableFreeze?: boolean;
    mutable?: (target: any) => boolean;
  }
) {
  const mutableFilter = options?.mutable;
  const enablePatches = options?.enablePatches ?? false;
  if (mutableFilter?.(initialState)) {
    mutate(initialState);
    return (enablePatches ? [initialState, [], []] : initialState) as Result<
      T,
      O
    >;
  }
  if (!isDraftable(initialState)) {
    throw new Error(
      'create() only supports plain object, array, set, and map.'
    );
  }
  const proxiesMap = new WeakMap<object, ProxyDraft>();
  const assignedSet = new WeakSet<any>();
  const finalities: (() => void)[] = [];
  let patches: Patches | undefined;
  let inversePatches: Patches | undefined;
  if (enablePatches) {
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
    mutableFilter,
    assignedSet,
  });
  mutate(draftState);
  const state = finalizeDraft(draftState) as T;
  return (enablePatches ? [state, patches, inversePatches] : state) as Result<
    T,
    O
  >;
}
