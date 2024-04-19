import { DraftType, Patches, ProxyDraft } from '../interface';
import { ensureShallowCopy } from './copy';
import {
  get,
  getPath,
  getProxyDraft,
  getValue,
  isDraft,
  isDraftable,
  isEqual,
  set,
} from './draft';
import { forEach } from './forEach';

export function handleValue(
  target: any,
  handledSet: WeakSet<any>,
  options?: ProxyDraft['options']
) {
  if (
    isDraft(target) ||
    !isDraftable(target, options) ||
    handledSet.has(target) ||
    Object.isFrozen(target)
  )
    return;
  const isSet = target instanceof Set;
  const setMap: Map<any, any> | undefined = isSet ? new Map() : undefined;
  handledSet.add(target);
  forEach(target, (key, value) => {
    if (isDraft(value)) {
      const proxyDraft = getProxyDraft(value)!;
      ensureShallowCopy(proxyDraft);
      // A draft where a child node has been changed, or assigned a value
      const updatedValue =
        proxyDraft.assignedMap?.size || proxyDraft.operated
          ? proxyDraft.copy
          : proxyDraft.original;
      // final update value
      set(isSet ? setMap! : target, key, updatedValue);
    } else {
      handleValue(value, handledSet, options);
    }
  });
  if (setMap) {
    const set = target as Set<any>;
    const values = Array.from(set);
    set.clear();
    values.forEach((value) => {
      set.add(setMap!.has(value) ? setMap!.get(value) : value);
    });
  }
}

export function finalizeAssigned(proxyDraft: ProxyDraft, key: PropertyKey) {
  // handle the draftable assigned values， and the value is not a draft
  const copy =
    proxyDraft.type === DraftType.Set ? proxyDraft.setMap : proxyDraft.copy;
  if (
    proxyDraft.finalities.revoke.length > 1 &&
    proxyDraft.assignedMap!.get(key) &&
    copy
  ) {
    handleValue(
      get(copy, key),
      proxyDraft.finalities.handledSet,
      proxyDraft.options
    );
  }
}

export type GeneratePatches = (
  proxyState: ProxyDraft,
  basePath: any[],
  patches: Patches,
  inversePatches: Patches
) => void;

export function finalizeSetValue(target: ProxyDraft) {
  if (target.type === DraftType.Set && target.copy) {
    target.copy.clear();
    target.setMap!.forEach((value) => {
      target.copy!.add(getValue(value));
    });
  }
}

export function finalizePatches(
  target: ProxyDraft,
  generatePatches: GeneratePatches,
  patches?: Patches,
  inversePatches?: Patches
) {
  const shouldFinalize =
    target.operated &&
    target.assignedMap &&
    target.assignedMap.size > 0 &&
    !target.finalized;
  if (shouldFinalize) {
    if (patches && inversePatches) {
      const basePath = getPath(target);
      if (basePath) {
        generatePatches(target, basePath, patches, inversePatches);
      }
    }
    target.finalized = true;
  }
}

export function markFinalization(
  target: ProxyDraft,
  key: any,
  value: any,
  generatePatches: GeneratePatches
) {
  const proxyDraft = getProxyDraft(value);
  if (proxyDraft) {
    // !case: assign the draft value
    if (!proxyDraft.callbacks) {
      proxyDraft.callbacks = [];
    }
    proxyDraft.callbacks.push((patches, inversePatches) => {
      const copy = target.type === DraftType.Set ? target.setMap : target.copy;
      if (isEqual(get(copy, key), value)) {
        let updatedValue = proxyDraft.original;
        if (proxyDraft.copy) {
          updatedValue = proxyDraft.copy;
        }
        finalizeSetValue(target);
        finalizePatches(target, generatePatches, patches, inversePatches);
        if (__DEV__ && target.options.enableAutoFreeze) {
          target.options.updatedValues =
            target.options.updatedValues ?? new WeakMap();
          target.options.updatedValues.set(updatedValue, proxyDraft.original);
        }
        // final update value
        set(copy, key, updatedValue);
      }
    });
    if (target.options.enableAutoFreeze) {
      // !case: assign the draft value in cross draft tree
      if (proxyDraft.finalities !== target.finalities) {
        target.options.enableAutoFreeze = false;
      }
    }
  }
  if (isDraftable(value, target.options)) {
    // !case: assign the non-draft value
    target.finalities.draft.push(() => {
      const copy = target.type === DraftType.Set ? target.setMap : target.copy;
      if (isEqual(get(copy, key), value)) {
        finalizeAssigned(target, key);
      }
    });
  }
}
