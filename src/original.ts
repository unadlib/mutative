import { getProxyDraft } from './utils';

export function original<T>(target: T): T {
  const proxyDraft = getProxyDraft(target);
  return proxyDraft ? proxyDraft.original : target;
}
