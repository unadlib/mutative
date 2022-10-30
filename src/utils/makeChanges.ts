import type { ProxyDraft } from '../interface';

export function makeChange(proxyDraft: ProxyDraft) {
  if (!proxyDraft.operated) {
    proxyDraft.operated = true;
    if (proxyDraft.parent) {
      makeChange(proxyDraft.parent);
    }
  }
}
