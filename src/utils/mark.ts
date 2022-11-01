import type { ProxyDraft } from '../interface';
import { finalizePatches } from '../patch';
import { get, getProxyDraft, isEqual, set } from './draft';

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
  if (proxyDraft) {
    // !case: assign the draft value
    proxyDraft.callbacks = proxyDraft.callbacks ?? [];
    proxyDraft.callbacks.push((patches, inversePatches) => {
      if (isEqual(get(target.copy, key), value)) {
        finalizePatches(target, patches, inversePatches);
        set(target.copy, key, proxyDraft.copy ?? proxyDraft.original);
      }
    });
  }
}
