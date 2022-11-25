import type { ProxyDraft } from '../interface';
import { DraftType } from '../constant';
import { finalizePatches } from '../patch';
import {
  finalizeAssigned,
  get,
  getProxyDraft,
  isDraftable,
  isEqual,
  set,
} from './draft';

export function markChanged(proxyDraft: ProxyDraft) {
  if (!proxyDraft.operated) {
    proxyDraft.operated = true;
    if (proxyDraft.parent) {
      markChanged(proxyDraft.parent);
    }
  }
}

export function markSetValue(target: ProxyDraft, key: any, value: any) {
  const proxyDraft = getProxyDraft(value);
  // TODO: Reduce repetition callbacks
  if (proxyDraft) {
    // !case: assign the draft value
    proxyDraft.callbacks = proxyDraft.callbacks ?? [];
    proxyDraft.callbacks.push((patches, inversePatches) => {
      const copy = target.type === DraftType.Set ? target.setMap : target.copy;
      if (isEqual(get(copy, key), value)) {
        let updatedValue = proxyDraft.original;
        if (proxyDraft.copy) {
          updatedValue = proxyDraft.copy;
        }
        finalizePatches(target, patches, inversePatches);
        set(copy, key, updatedValue);
      }
    });
    if (target.options.enableAutoFreeze) {
      // !case: assign the draft value in cross draft tree
      if (proxyDraft && proxyDraft.finalities !== target.finalities) {
        target.options.enableAutoFreeze = false;
      }
    }
  } if (isDraftable(value, target.options)) {
    // !case: assign the non-draft value
    target.finalities.draft.unshift(() => {
      const copy = target.type === DraftType.Set ? target.setMap : target.copy;
      if (isEqual(get(copy, key), value)) {
        finalizeAssigned(target, key);
      }
    });
  }
}
