import { PROXY_DRAFT } from '../constant';
import { ProxyDraft } from '../interface';

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
  const proxyDraft = getProxyDraft(value);
  if (proxyDraft) {
    if (proxyDraft.finalities !== target.finalities) {
      throw new Error(
        `${key} should not be set by other draft ${value}, please use 'current(value)' to make sure it is non-draft.`
      );
    }
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
          target.copy[key] = proxyDraft.copy ?? proxyDraft.original;
        }
      }
    });
  }
}
