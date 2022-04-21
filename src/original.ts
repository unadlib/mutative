import { getProxyDraft } from './utils';

export function original<T extends object>(target: T): T {
  const proxyDraft = getProxyDraft(target);
  return proxyDraft?.original;
}
