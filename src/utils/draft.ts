import { DraftType, Finalities, Mark, ProxyDraft } from '../interface';
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

// Iterators retain draft state instead of reading through the proxy. Once
// its scope has been revoked, use the proxy to throw the same native error.
export function assertDraftActive(target: ProxyDraft) {
  if (target.finalities.revoke.length === 0) getProxyDraft(target.proxy);
}

export function getValue<T extends object>(value: T): T {
  const proxyDraft = getProxyDraft(value);
  if (!proxyDraft) return value;
  // A copy also exists once a child has merely been read; an unchanged draft
  // still stands for its original, as every other finalization path decides.
  return proxyDraft.operated ? proxyDraft.copy! : proxyDraft.original;
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

// A string path holds only strings, so a Map key of another type or a symbol
// key would name a different key when the patch is applied. Development
// builds check the keys of the patch paths they generate.
export function checkPathKey(
  type: DraftType,
  key: unknown,
  pathAsArray: boolean | undefined
) {
  if (
    pathAsArray === false &&
    typeof key !== 'string' &&
    (type === DraftType.Map || typeof key === 'symbol')
  ) {
    throw new Error(
      `Patches with string paths only support string Map keys and no symbol keys, got a key of type '${typeof key}'. Set 'pathAsArray' to true to keep keys of other types.`
    );
  }
}

export function getPath(
  target: ProxyDraft,
  path: any[] = []
): (string | number | object)[] | null {
  const parent = target.parent;
  if (parent) {
    const parentCopy = parent.copy;
    let key: any = target.key;
    if (parent.type === DraftType.Set) {
      // Set items are keyed by their original value; paths use positions,
      // which patches can follow only while the Set itself is unchanged.
      // Once the recipe added or removed items, the Set's own patches carry
      // every changed item by value, so patches under this path would be
      // applied to whatever sits at the position in the base Set.
      if (parent.assignedMap!.size > 0) return null;
      key = Array.from(parent.setMap!.keys()).indexOf(key);
    } else if (get(parentCopy, key) !== target.proxy) {
      // The child left its key: it was moved, deleted or replaced, possibly
      // by another draft of a shared object. The parent's patches carry its
      // value wherever it is now, so patches under this path would be stale.
      return null;
    }
    path.push(key);
    const resolved = getPath(parent, path);
    // Checked once the path resolves, as a stale path emits no patches.
    if (__DEV__ && resolved) {
      checkPathKey(parent.type, key, parent.options.enablePatches.pathAsArray);
    }
    return resolved;
  }
  // `target` is the root draft. Every level above found its child at its
  // key, so the path resolves in the root's copy.
  path.reverse();
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

export function isEqual(x: any, y: any) {
  if (x === y) {
    return x !== 0 || 1 / x === 1 / y;
  } else {
    return x !== x && y !== y;
  }
}

// Revokes every draft of a producer without reading any of them.
export function revokeProxy(finalities: Finalities) {
  const revoke = finalities.revoke;
  while (revoke.length > 0) revoke.pop()!();
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
