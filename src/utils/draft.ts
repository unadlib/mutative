import type { Marker, ProxyDraft } from '../interface';
import { dataTypes, DraftType, PROXY_DRAFT } from '../constant';

export function latest<T = any>(proxyDraft: ProxyDraft): T {
  return proxyDraft.copy ?? proxyDraft.original;
}

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

export function isDraftable<T extends { marker?: Marker } = ProxyDraft>(
  value: any,
  target?: T
) {
  if (!value || typeof value !== 'object') return false;
  return (
    Object.getPrototypeOf(value) === Object.prototype ||
    Array.isArray(value) ||
    value instanceof Map ||
    value instanceof Set ||
    target?.marker?.(value, dataTypes) === dataTypes.immutable
  );
}

export function getPath(
  target: ProxyDraft,
  path: any[] = []
): (string | number | object)[] {
  if (!target) return path;
  if (target.key !== undefined)
    path.unshift(
      target.parent?.type === DraftType.Set
        ? Array.from(target.parent.setMap!.keys()).indexOf(target.key as any)
        : target.key
    );
  if (target.parent) {
    return getPath(target.parent, path);
  }
  return path;
}

export function getType(target: any) {
  if (target instanceof Map) return DraftType.Map;
  if (target instanceof Set) return DraftType.Set;
  if (Array.isArray(target)) return DraftType.Array;
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
