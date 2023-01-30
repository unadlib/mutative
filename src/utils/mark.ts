import { ProxyDraft } from '../interface';

export function markChanged(proxyDraft: ProxyDraft) {
  proxyDraft.assignedMap = proxyDraft.assignedMap ?? new Map();
  if (!proxyDraft.operated) {
    proxyDraft.operated = true;
    if (proxyDraft.parent) {
      markChanged(proxyDraft.parent);
    }
  }
}
