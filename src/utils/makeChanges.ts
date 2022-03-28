import type { ProxyDraft, Patches } from '../interface';
import { ensureShallowCopy } from './ensureShallowCopy';

export function makeChange(
  proxyDraft: ProxyDraft,
  patches?: Patches,
  inversePatches?: Patches
) {
  if (proxyDraft.parent) {
    proxyDraft.parent.updated = true;
    proxyDraft.parent.assigned ??= {};
    if (proxyDraft.key) {
      proxyDraft.parent.assigned![proxyDraft.key] = true;
    }
    ensureShallowCopy(proxyDraft.parent);
    if (proxyDraft.key) {
      if (patches) {
        const [last] = patches.slice(-1);
        last[1].unshift(proxyDraft.key);
      }
      if (inversePatches) {
        const [last] = inversePatches.slice(-1);
        last[1].unshift(proxyDraft.key);
      }
      proxyDraft.parent.copy![proxyDraft.key] = proxyDraft.copy;
    }
    if (proxyDraft.parent.parent) {
      makeChange(proxyDraft.parent.parent);
    }
  } else {
    proxyDraft.updated = true;
  }
}
