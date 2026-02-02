import { ProxyDraft } from '../interface';

export function markChanged(proxyDraft: ProxyDraft) {
  proxyDraft.assignedMap = proxyDraft.assignedMap ?? new Map();
  if (proxyDraft.operated) return;
  proxyDraft.operated = true;
  if (proxyDraft.parent) {
    // inline tail recursion avoidance for shallow trees
    let parent: ProxyDraft | undefined | null = proxyDraft.parent;
    while (parent && !parent.operated) {
      parent.assignedMap = parent.assignedMap ?? new Map();
      parent.operated = true;
      parent = parent.parent;
    }
  }
}
