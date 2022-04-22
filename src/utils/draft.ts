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
