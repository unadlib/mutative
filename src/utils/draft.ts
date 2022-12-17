import type { Options, ProxyDraft } from '../interface';
import { dataTypes, DraftType, PROXY_DRAFT } from '../constant';
import { ensureShallowCopy } from './copy';
import { forEach } from './forEach';

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
    path.unshift(
      target.parent!.type === DraftType.Set
        ? Array.from(target.parent!.setMap!.keys()).indexOf(target.key as any)
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

export function revokeProxy(proxyDraft: ProxyDraft) {
  for (const revoke of proxyDraft.finalities.revoke) {
    revoke();
  }
}

export function handleValue(target: any, handledSet: WeakSet<any>) {
  if (
    isDraft(target) ||
    !isDraftable(target) ||
    handledSet.has(target) ||
    Object.isFrozen(target)
  )
    return;
  const isSet = target instanceof Set;
  const setMap: Map<any, any> | undefined = isSet ? new Map() : undefined;
  handledSet.add(target);
  forEach(target, (key, value) => {
    if (isDraft(value)) {
      const proxyDraft = getProxyDraft(value)!;
      ensureShallowCopy(proxyDraft);
      const updatedValue = proxyDraft.assignedMap.size
        ? proxyDraft.copy
        : proxyDraft.original;
      if (isSet) {
        setMap!.set(key, updatedValue);
      } else {
        set(target, key, updatedValue);
      }
    } else {
      handleValue(value, handledSet);
    }
  });
  if (setMap) {
    const set = target as Set<any>;
    const values = Array.from(set);
    set.clear();
    values.forEach((value) => {
      set.add(setMap!.has(value) ? setMap!.get(value) : value);
    });
  }
}

export function finalizeAssigned(proxyDraft: ProxyDraft, key: PropertyKey) {
  // handle the draftable assigned values， and the value is not a draft
  const copy =
    proxyDraft.type === DraftType.Set ? proxyDraft.setMap : proxyDraft.copy;
  if (
    proxyDraft.finalities.revoke.length > 1 &&
    proxyDraft.assignedMap.get(key) &&
    copy
  ) {
    handleValue(get(copy, key), proxyDraft.finalities.handledSet);
  }
}
