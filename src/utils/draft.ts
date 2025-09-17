import { DraftType, Mark, ProxyDraft } from '../interface';
import { dataTypes, PROXY_DRAFT } from '../constant';
import { has } from './proto';

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
  return proxyDraft ? (proxyDraft.copy ?? proxyDraft.original) : value;
}

/**
 * Check if a value is draftable
 */
export function isDraftable(value: any, options?: { mark?: Mark<any, any> }) {
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
): (string | number | object)[] | null {
  if (Object.hasOwnProperty.call(target, 'key')) {
    // check if the parent is a draft and the original value is not equal to the current value
    const parentCopy = target.parent!.copy;
    const proxyDraft = getProxyDraft(get(parentCopy, target.key!));
    if (proxyDraft !== null && proxyDraft?.original !== target.original) {
      return null;
    }
    const isSet = target.parent!.type === DraftType.Set;
    const key = isSet
      ? Array.from(target.parent!.setMap!.keys()).indexOf(target.key)
      : target.key;
    // check if the key is still in the next state parent
    if (
      !((isSet && parentCopy.size > (key as number)) || has(parentCopy, key!))
    )
      return null;
    path.push(key);
  }
  if (target.parent) {
    return getPath(target.parent, path);
  }
  // `target` is root draft.
  path.reverse();
  try {
    // check if the path is valid
    resolvePath(target.copy, path);
  } catch (e) {
    return null;
  }
  return path;
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
  const type = getType(target);
  if (type === DraftType.Map) {
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

// handle JSON Pointer path with spec https://www.rfc-editor.org/rfc/rfc6901
export function escapePath(path: string[], pathAsArray: boolean) {
  return pathAsArray
    ? path
    : ['']
        .concat(path)
        .map((_item) => {
          const item = `${_item}`;
          if (item.indexOf('/') === -1 && item.indexOf('~') === -1) return item;
          return item.replace(/~/g, '~0').replace(/\//g, '~1');
        })
        .join('/');
}

export function unescapePath(path: string | (string | number)[]) {
  if (Array.isArray(path)) return path;
  return path
    .split('/')
    .map((_item) => _item.replace(/~1/g, '/').replace(/~0/g, '~'))
    .slice(1);
}

export function resolvePath(base: any, path: (string | number)[]) {
  for (let index = 0; index < path.length - 1; index += 1) {
    const key = path[index];
    // use `index` in Set draft
    base = get(getType(base) === DraftType.Set ? Array.from(base) : base, key);
    if (typeof base !== 'object') {
      throw new Error(`Cannot resolve patch at '${path.join('/')}'.`);
    }
  }
  return base;
}
