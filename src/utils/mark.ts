import type { ProxyDraft } from '../interface';

export function markChanged(proxyDraft: ProxyDraft) {
  if (!proxyDraft.operated) {
    proxyDraft.operated = true;
    if (proxyDraft.parent) {
      markChanged(proxyDraft.parent);
    }
  }
}
