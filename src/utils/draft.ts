import { dataTypes, DraftType, PROXY_DRAFT, REFERENCE } from '../constant';
import { current } from '../current';
import { Marker, ProxyDraft } from '../interface';

export function latest<T = any>(proxyDraft: ProxyDraft): T {
  return proxyDraft.copy ?? proxyDraft.original;
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

export function isDraftable<T extends { marker?: Marker } = ProxyDraft>(
  value: any,
  target: T
) {
  return (
    (!!value &&
      ((typeof value === 'object' &&
        Object.getPrototypeOf(value) === Object.prototype) ||
        Array.isArray(value) ||
        value instanceof Map ||
        value instanceof Set)) ||
    target.marker?.(value, dataTypes) === dataTypes.immutable
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

export function getValueOrPath(value: any) {
  const proxyDraft = getProxyDraft(value);
  // todo: support map and set
  // @ts-ignore
  if (proxyDraft && !(proxyDraft.key in proxyDraft.parent.copy)) {
    return current(value);
  }
  return proxyDraft ? getPath(proxyDraft) : value;
}

export function getPath(target: ProxyDraft, path: any[] = []): any[] {
  if (!target) return path;
  if (typeof target.key !== 'undefined') path.unshift(target.key);
  if (target.parent) {
    return getPath(target.parent, path);
  }
  path.unshift(REFERENCE);
  return path;
}

export function isPath(target: any) {
  return Array.isArray(target) && target[0] === REFERENCE;
}

export function getType(target: any): DraftType {
  if (target instanceof Map) return DraftType.Map;
  if (target instanceof Set) return DraftType.Set;
  if (Array.isArray(target)) return DraftType.Array;
  return DraftType.Object;
}

export function adjustParentDraft({
  current,
  parent,
  key,
}: {
  current: any;
  parent: ProxyDraft;
  key: string | number;
}) {
  const proxyDraft = getProxyDraft(current);
  if (proxyDraft) {
    if (proxyDraft.key !== key) {
      proxyDraft.key = key;
    }
    if (proxyDraft.parent && proxyDraft.parent !== parent) {
      proxyDraft.parent = parent;
    }
  }
}
