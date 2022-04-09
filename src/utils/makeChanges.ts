import type { ProxyDraft, Patches } from '../interface';
import { ensureShallowCopy } from './ensureShallowCopy';

export function makeChange(
  proxyDraft: ProxyDraft,
  patches?: Patches,
  inversePatches?: Patches
) {
  if (proxyDraft.parent) {
    if (!proxyDraft.operated.size) {
      proxyDraft.parent.operated.delete(proxyDraft.key);
    } else if (
      typeof proxyDraft.key !== 'undefined' &&
      proxyDraft.key !== null
    ) {
      proxyDraft.parent.operated.add(proxyDraft.key);
    } else {
      //
    }
    ensureShallowCopy(proxyDraft.parent);
    if (typeof proxyDraft.key !== 'undefined' && proxyDraft.key !== null) {
      if (patches) {
        const [last] = patches.slice(-1);
        last[1].unshift(proxyDraft.key);
      }
      if (inversePatches) {
        const [last] = inversePatches.slice(-1);
        last[1].unshift(proxyDraft.key);
      }
      if (proxyDraft.parent.copy instanceof Map) {
        proxyDraft.parent.copy.set(proxyDraft.key, proxyDraft.proxy);
      } else if (proxyDraft.parent.copy instanceof Set) {
        // for Set
      } else {
        proxyDraft.parent.copy![proxyDraft.key] = proxyDraft.copy;
      }
    }
    if (proxyDraft.parent.parent) {
      makeChange(proxyDraft.parent, patches, inversePatches);
    }
  }
}
