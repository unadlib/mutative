import { DraftType, Options, ProxyDraft } from '../interface';
import { dataTypes, PROXY_DRAFT } from '../constant';

export function latest<T = any>(proxyDraft: ProxyDraft): T {
  return proxyDraft.copy ?? proxyDraft.original;
}

/**
 * Check if the value is a draft
 */
export function isDraft(target: any) {
  return !!getProxyDraft(target);
}

export function getProxyDraft<T extends any>(value: T): ProxyDraft | null {
  if (typeof value !== 'object') return null;
  return (value as { [PROXY_DRAFT]: any })?.[PROXY_DRAFT];
}

export function getValue<T extends object>(value: T): T {
  const proxyDraft = getProxyDraft(value);
  return proxyDraft ? proxyDraft.copy ?? proxyDraft.original : value;
}

export function isDraftable(value: any, options?: Options<any, any>) {
  if (!value || typeof value !== 'object') return false;
  let markResult: any;
  return (
    Object.getPrototypeOf(value) === Object.prototype ||
    Array.isArray(value) ||
    value instanceof Map ||
    value instanceof Set ||
    (!!options?.mark &&
      ((markResult = options.mark(value, dataTypes)) === dataTypes.immutable ||
        typeof markResult === 'function'))
  );
}

export function getPath(
  target: ProxyDraft,
  path: any[] = []
): (string | number | object)[] {
  if (Object.hasOwnProperty.call(target, 'key'))
    path.push(
      target.parent!.type === DraftType.Set
        ? Array.from(target.parent!.setMap!.keys()).indexOf(target.key)
        : target.key
    );
  if (target.parent) {
    return getPath(target.parent, path);
  }
  return path.reverse();
}

export function getType(target: any) {
  if (Array.isArray(target)) return DraftType.Array;
  if (target instanceof Map) return DraftType.Map;
  if (target instanceof Set) return DraftType.Set;
  return DraftType.Object;
}

export function get(target: any, key: PropertyKey) {
  return getType(target) === DraftType.Map ? target.get(key) : target[key];
}

export function set(target: any, key: PropertyKey, value: any) {
  if (getType(target) === DraftType.Map) {
    target.set(key, value);
  } else {
    target[key] = value;
  }
}

export function peek(target: any, key: PropertyKey) {
  const state = getProxyDraft(target);
  const source = state ? latest(state) : target;
  return source[key];
}

export function isEqual(x: any, y: any) {
  if (x === y) {
    return x !== 0 || 1 / x === 1 / y;
  } else {
    return x !== x && y !== y;
  }
}

export function revokeProxy(proxyDraft: ProxyDraft | null) {
  if (!proxyDraft) return;
  while (proxyDraft.finalities.revoke.length > 0) {
    const revoke = proxyDraft.finalities.revoke.pop()!;
    revoke();
  }
}
