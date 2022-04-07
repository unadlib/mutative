import { PROXY_DRAFT } from '../constant';
import { ProxyDraft } from '../interface';

export function latest<T = any>(proxyDraft: ProxyDraft): T {
  return proxyDraft.copy || proxyDraft.original;
}

export function getProxyDraft<T extends { [PROXY_DRAFT]: any }>(
  value: T
): ProxyDraft | null {
  if (typeof value !== 'object') return null;
  return value[PROXY_DRAFT];
}

export function getValue<T extends { [PROXY_DRAFT]: any }>(value: T) {
  const proxyDraft = getProxyDraft(value);
  if (!proxyDraft) {
    return value;
  }
  return proxyDraft.copy ?? proxyDraft.original;
}

export function isDraftable(value: any) {
  const { Record, Tuple } = globalThis;
  return (
    (!!value &&
      ((typeof value === 'object' &&
        Object.getPrototypeOf(value) === Object.prototype) ||
        Array.isArray(value) ||
        value instanceof Map ||
        value instanceof Set)) ||
    (Record && value instanceof Record) ||
    (Tuple && value instanceof Tuple)
  );
}
