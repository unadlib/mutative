import { PROXY_DRAFT } from '../constant';
import { current } from '../current';
import { ProxyDraft } from '../interface';
import { ensureShallowCopy } from './ensureShallowCopy';

export function latest<T = any>(proxyDraft: ProxyDraft): T {
  return proxyDraft.copy || proxyDraft.original;
}

export function isDraft(target: any) {
  return !!getProxyDraft(target);
}

export function getProxyDraft<T extends object>(value: T): ProxyDraft | null {
  if (typeof value !== 'object') return null;
  return (value as { [PROXY_DRAFT]: any })[PROXY_DRAFT];
}

export function getValue<T extends object>(value: T) {
  const proxyDraft = getProxyDraft(value);
  if (!proxyDraft) {
    return value;
  }
  return proxyDraft.copy ?? proxyDraft.original;
}

export function isDraftable(value: any) {
  return (
    !!value &&
    ((typeof value === 'object' &&
      Object.getPrototypeOf(value) === Object.prototype) ||
      Array.isArray(value) ||
      value instanceof Map ||
      value instanceof Set)
  );
}

export function ensureDraftValue(target: ProxyDraft, key: any, value: any) {
  if (getProxyDraft(value)) {
    target.finalities.draft.unshift(() => {
      if (target.copy) {
        if (target.copy instanceof Map) {
          const value = target.copy.get(key);
          const proxyDraft = getProxyDraft(value);
          if (proxyDraft) {
            target.copy.set(key, proxyDraft.copy ?? proxyDraft.original);
          }
          return;
        }
        const value = target.copy[key];
        const proxyDraft = getProxyDraft(value);
        if (proxyDraft) {
          target.copy[key] =
            proxyDraft.finalities === target.finalities
              ? proxyDraft.copy ?? proxyDraft.original
              : (ensureShallowCopy(proxyDraft), current(value)); // TODO: Optimize performance
        }
      }
    });
  }
}
