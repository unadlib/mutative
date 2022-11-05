import { DraftType } from '../constant';
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
  // TODO: Reduce repetition callbacks
  if (proxyDraft) {
    // !case: assign the draft value
    proxyDraft.callbacks = proxyDraft.callbacks ?? [];
    proxyDraft.callbacks.push((patches, inversePatches) => {
      const copy = target.type === DraftType.Set ? target.setMap : target.copy;
      if (isEqual(get(copy, key), value)) {
        finalizePatches(target, patches, inversePatches);
        set(copy, key, proxyDraft.copy ?? proxyDraft.original);
      }
    });
  }
}
