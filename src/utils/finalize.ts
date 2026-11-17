import { DraftType, Patches, ProxyDraft } from '../interface';
import {
  checkMapKey,
  get,
  getPath,
  getProxyDraft,
  getValue,
  isDraft,
  isDraftable,
  isEqual,
  iterateSet,
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
    if (__DEV__ && target instanceof Map) checkMapKey(key);
    if (isDraft(value)) {
      const proxyDraft = getProxyDraft(value)!;
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

// Set drafts collect their inverse patches on their producer instead of in
// `inversePatches`; see `generatePatches()`.
export type GeneratePatches = (
  proxyState: ProxyDraft,
  basePath: any[],
  patches: Patches,
  inversePatches: Patches
) => void;

// The copy of a Set draft holds its items in order, so only items that a draft
// stands for may need their final value: the Set is rebuilt in order once one
// of them differs from the item itself. The first rebuild keeps the items on
// `setMap`. `finalities` is the producer that is finalizing its drafts, whose
// values no longer change, so the Set takes them once per producer rather
// than once per draft it holds. For an outer producer whose drafts a nested
// producer's Set holds, only a Set rebuilt before is rebuilt; other Sets may
// still be changing, and are rebuilt when their own producer finalizes them.
export function finalizeSetValue(
  target: ProxyDraft,
  finalities = target.finalities
) {
  // Only Set drafts have `setMap`, and an unchanged draft stands for its
  // original.
  const setMap = target.setMap;
  if (!setMap || !target.operated || setMap.finalities === finalities) return;
  setMap.finalities = finalities;
  let items = setMap.items;
  if (!items) {
    if (finalities !== target.finalities) return;
    // Without added or deleted items, an item that the Set drafted changed,
    // unless the recipe added and deleted a draft; rebuilding then changes
    // nothing.
    let differs = target.assignedMap!.size === 0;
    if (!differs) {
      for (const [item, value] of setMap) {
        if (getValue(value) !== item) {
          differs = true;
          break;
        }
      }
    }
    if (!differs) return;
    items = setMap.items = Array.from(iterateSet(target.copy));
  }
  const copy: Set<any> = target.copy;
  copy.clear();
  items.forEach((item) => {
    const value = setMap.get(item);
    copy.add(value === undefined ? item : getValue(value));
  });
}

export function finalizePatches(
  target: ProxyDraft,
  generatePatches: GeneratePatches,
  patches?: Patches,
  inversePatches?: Patches
) {
  const shouldFinalize =
    target.operated &&
    ((target.arrayState !== null && target.arrayState.relocated) ||
      (target.assignedMap !== undefined && target.assignedMap.size > 0)) &&
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

/**
 * Finalize one draft node: write the final value back into the parent's copy,
 * generate its patches and run callbacks registered for it, for example
 * because it was assigned to another location.
 */
export function finalizeNode(
  node: ProxyDraft,
  generatePatches: GeneratePatches,
  patches?: Patches,
  inversePatches?: Patches
) {
  const parent = node.parent;
  // A Set draft gives its items their final values before it generates its
  // patches, and also when it left its key: it then reaches its new place as
  // a value, through a callback or a value assigned there.
  finalizeSetValue(node);
  if (parent) {
    const parentType = parent.type;
    // if the parent is a Set draft, `setMap` is the real Set copies proxy mapping.
    const copy = parentType === DraftType.Set ? parent.setMap : parent.copy;
    // `setMap` holds the draft of an item by the item, which is the original
    // of the draft; its key is the position of the item.
    const key = parentType === DraftType.Set ? node.original : node.key!;
    const isMapLike =
      parentType === DraftType.Set || parentType === DraftType.Map;
    const draft = isMapLike ? copy.get(key) : copy[key];
    // Fast path: the node is still at its own key. Otherwise another draft
    // may have been moved here, e.g. by `reverse()`, and its value is written
    // here instead.
    const proxyDraft = draft === node.proxy ? node : getProxyDraft(draft);
    if (proxyDraft) {
      // assign the updated value to the copy object
      const updatedValue = proxyDraft.operated
        ? proxyDraft.copy
        : proxyDraft.original;
      // A draft generates its patches at its own node, after the nodes of its
      // child drafts, whose patches assume its original layout and so come
      // before its own. A draft found at another node's key generates them at
      // its own node, in its own producer, if it is still at its own key;
      // otherwise its value is part of the patches of the draft holding it.
      if (proxyDraft === node)
        finalizePatches(node, generatePatches, patches, inversePatches);
      // A draft of another producer, which a recipe placed here, is
      // finalized by that producer: its recipe may still change the draft.
      else if (proxyDraft.finalities === node.finalities)
        finalizeSetValue(proxyDraft);
      // final update value
      if (isMapLike) {
        copy.set(key, updatedValue);
      } else {
        copy[key] = updatedValue;
      }
    }
  } else {
    // !case: handle the root draft
    finalizePatches(node, generatePatches, patches, inversePatches);
  }
  // !case: handle the deleted key
  const callbacks = node.callbacks;
  if (callbacks) {
    for (let index = 0; index < callbacks.length; index += 1) {
      callbacks[index](patches, inversePatches);
    }
  }
}

export function markFinalization(target: ProxyDraft, key: any, value: any) {
  const proxyDraft = getProxyDraft(value);
  if (proxyDraft) {
    // !case: assign the draft value
    if (!proxyDraft.callbacks) {
      proxyDraft.callbacks = [];
    }
    proxyDraft.callbacks.push(() => {
      const copy = target.type === DraftType.Set ? target.setMap : target.copy;
      if (isEqual(get(copy, key), value)) {
        // Drafts are finalized in reverse order of creation, so a target
        // created before this draft generates its patches after this callback
        // and they carry the value written here. A target created after it
        // has already generated its patches, which carry a snapshot of the
        // draft from `cloneIfNeeded()` in place of this value.
        const updatedValue = proxyDraft.operated
          ? proxyDraft.copy
          : proxyDraft.original;
        // The drafts of a Set's own producer are done changing when it rebuilds
        // the Set; a draft of another producer may change after that.
        if (proxyDraft.finalities !== target.finalities)
          finalizeSetValue(target, proxyDraft.finalities);
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
  } else if (isDraftable(value, target.options)) {
    // !case: assign the non-draft value
    target.finalities.draft.push(() => {
      const copy = target.type === DraftType.Set ? target.setMap : target.copy;
      if (isEqual(get(copy, key), value)) {
        finalizeAssigned(target, key);
      }
    });
  }
}
