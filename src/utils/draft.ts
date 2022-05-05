import { dataTypes, DraftType, PROXY_DRAFT, REFERENCE } from '../constant';
import { current } from '../current';
import { Hook, Patches, ProxyDraft } from '../interface';
import { isPlainObject } from './proto';

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
  return !proxyDraft ? value : latest(proxyDraft);
}

export function isDraftable<T extends { hook?: Hook } = ProxyDraft>(
  value: any,
  target: T
) {
  return (
    (!!value &&
      (isPlainObject(value) ||
        Array.isArray(value) ||
        value instanceof Map ||
        value instanceof Set)) ||
    target.hook?.(value, dataTypes) === dataTypes.immutable
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
            target.copy.set(key, latest(proxyDraft));
          }
          return;
        }
        const value = target.copy[key];
        const proxyDraft = getProxyDraft(value);
        if (proxyDraft) {
          target.copy[key] = latest(proxyDraft);
        }
      }
    });
  }
}

export function getEntryFromParent(parent: ProxyDraft, key: any) {
  const currentKey =
    parent.copy instanceof Map || parent.copy instanceof Set
      ? Array.from(parent.copy.keys())[key as number]
      : key;
  const currentValue =
    parent.copy instanceof Map
      ? parent.copy.get(currentKey)
      : parent.copy instanceof Set
      ? parent.setMap!.get(currentKey)?.proxy ?? currentKey
      : parent.copy[key];
  return [currentKey, currentValue];
}

export function getValueOrPath(value: any) {
  const proxyDraft = getProxyDraft(value);
  if (
    proxyDraft &&
    !Array.from(proxyDraft.parents).some(([key, parent]) => {
      const [_, currentValue] = getEntryFromParent(parent, key);
      return currentValue === value;
    })
  ) {
    return current(value);
  }
  return proxyDraft ? getPath(proxyDraft) : value;
}

export function getPath(target: ProxyDraft, path: any[] = [[]]): any[] {
  const paths: any[][] = [];
  if (!target) return [[]];
  target.parents.forEach((parent, key) => {
    if (parent.parents.size > 0) {
      paths.push(
        ...getPath(
          parent,
          path.map((i) => [key, ...i])
        )
      );
    } else {
      paths.push(...path.map((i) => [REFERENCE, key, ...i]));
    }
  });
  return paths;
}

export function isPath(target: any) {
  return (
    Array.isArray(target) &&
    Array.isArray(target[0]) &&
    target[0][0] === REFERENCE
  );
}

export function getType(target: any): DraftType {
  if (target instanceof Map) return DraftType.Map;
  if (target instanceof Set) return DraftType.Set;
  if (Array.isArray(target)) return DraftType.Array;
  return DraftType.Object;
}

export function appendParentDraft({
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
    proxyDraft.parents.set(key, parent);
  }
}

export function getValueWithPath(target: object, path: (string | number)[]) {
  let current: any = target;
  for (let i = 0; i < path.length - 1; i++) {
    const key = `${path[i]}`;
    if (current instanceof Map) {
      current = current.get(Array.from(current.keys())[Number(key)]);
    } else if (current instanceof Set) {
      current = Array.from(current.values())[Number(key)];
    } else {
      current = current[key];
    }
  }
  return current;
}

export function appendPaths(
  paths: any[][],
  patches: Patches,
  inversePatches: Patches
) {
  patches.slice(-1)[0][1] = paths.map((path) => [
    ...path,
    ...patches.slice(-1)[0][1][0],
  ]);
  inversePatches[0][1] = paths.map((path) => [
    ...path,
    ...inversePatches[0][1][0],
  ]);
}
