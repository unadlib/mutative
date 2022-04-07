import type { Patches, ProxyDraft } from './interface';
import { createArrayHandler, mutableArrayMethods } from './array';
import { DraftType, Operation, PROXY_DRAFT } from './constant';
import { createMapHandler, mutableMapMethods } from './map';
import { createSetHandler, mutableSetMethods } from './set';
import {
  ensureShallowCopy,
  getDescriptor,
  getProxyDraft,
  getValue,
  has,
  isDraftable,
  latest,
  makeChange,
} from './utils';
import { convertToImmutable } from './recordTuple';

const mutableObjectMethods = ['delete', 'set'];

function createGetter({
  proxiesMap,
  finalities,
  enableRecordTuple,
  patches,
  inversePatches,
}: {
  proxiesMap: WeakMap<object, ProxyDraft>;
  finalities: (() => void)[];
  enableRecordTuple: boolean;
  patches?: Patches;
  inversePatches?: Patches;
}) {
  return function get(target: ProxyDraft, key: string | symbol, receiver: any) {
    if (key === PROXY_DRAFT) return target;
    if (target.original instanceof Set && !target.copy) {
      finalities.unshift(() => {
        if (target.finalized) return;
        target.finalized = true;
        if (
          target.copy instanceof Set &&
          target.updated &&
          Object.keys(target.assigned ?? {}).length > 0
        ) {
          const iterator = Array.from(target.copy);
          target.copy.clear();
          for (const item of iterator) {
            if (typeof item === 'object') {
              const proxyDraft = target.setMap?.get(item);
              if (proxyDraft) {
                const value =
                  proxyDraft.updated &&
                  Object.keys(proxyDraft.assigned ?? {}).length > 0
                    ? proxyDraft.copy
                    : proxyDraft.original;
                target.copy.add(value);
              } else {
                target.copy.add(item);
              }
            } else {
              target.copy.add(item);
            }
          }
        } else {
          // todo: check
          // target.parent.copy![target.key!] = target.original;
        }
      });
    }
    ensureShallowCopy(target);
    const state = target.copy!;
    const value = state[key];
    if (!has(state, key)) {
      if (
        Array.isArray(state) &&
        typeof key === 'string' &&
        mutableArrayMethods.includes(key)
      ) {
        return createArrayHandler({
          target,
          key,
          state,
          patches,
          inversePatches,
        });
      }

      if (
        state instanceof Set &&
        (typeof key === 'string' || typeof key === 'symbol') &&
        mutableSetMethods.includes(key)
      ) {
        return createSetHandler({
          target,
          key,
          state,
          finalities,
          proxiesMap,
          enableRecordTuple,
          patches,
          inversePatches,
        });
      }
      if (
        state instanceof Map &&
        (typeof key === 'string' || typeof key === 'symbol') &&
        mutableMapMethods.includes(key)
      ) {
        return createMapHandler({
          target,
          key,
          state,
          proxiesMap,
          enableRecordTuple,
          finalities,
          patches,
          inversePatches,
        });
      }
      return getDescriptor(state, key)?.value;
    }
    if (isDraftable(value) && !getProxyDraft(value)) {
      const proxyDraft = proxiesMap.get(target.original[key]);
      if (!proxyDraft) {
        target.copy![key] = createDraft({
          original: target.original[key],
          parentDraft: target,
          key,
          patches,
          inversePatches,
          finalities,
          proxiesMap,
          enableRecordTuple,
        });
        finalities.unshift(() => {
          const proxyDraft = getProxyDraft(target.copy![key]);
          if (proxyDraft) {
            const value =
              proxyDraft.updated &&
              Object.keys(proxyDraft.assigned ?? {}).length > 0
                ? getValue(target.copy![key])
                : proxyDraft.original;
            target.copy![key] = enableRecordTuple
              ? convertToImmutable(value)
              : value;
          }
        });
        return target.copy![key];
      } else {
        // TODO: think about set proxy draft parent key for some key
        // @ts-ignore
        // proxyDraft[PROXY_DRAFT].key = key;
        return proxyDraft;
      }
    }
    return value;
  };
}

function createSetter({
  finalities,
  patches,
  inversePatches,
}: {
  finalities: (() => void)[];
  patches?: Patches;
  inversePatches?: Patches;
}) {
  return function set(target: ProxyDraft, key: string, value: any) {
    if (!target.updated) {
      ensureShallowCopy(target);
    }
    const previousState = target.copy![key];
    if (getProxyDraft(value)) {
      finalities.unshift(() => {
        const proxyDraft = getProxyDraft(target.copy![key]);
        if (proxyDraft) {
          target.copy![key] = getValue(target.copy![key]);
        }
      });
    }
    target.copy![key] = value;
    target.assigned ??= {};
    target.assigned![key] = true;
    target.updated = true;
    patches?.push([Operation.Set, [key], [value]]);
    if (Array.isArray(target.original)) {
      const numberKey = Number(key);
      if (!isNaN(numberKey) && numberKey >= target.original.length) {
        inversePatches?.push([
          Operation.Set,
          ['length'],
          [target.original.length],
        ]);
      } else {
        inversePatches?.push([Operation.Set, [key], [previousState]]);
      }
    } else {
      inversePatches?.push([Operation.Set, [key], [previousState]]);
    }
    makeChange(target, patches, inversePatches);
    return true;
  };
}

export function createDraft<T extends object>({
  original,
  finalities,
  proxiesMap,
  parentDraft,
  enableRecordTuple,
  key,
  patches,
  inversePatches,
}: {
  original: T;
  finalities: (() => void)[];
  proxiesMap: WeakMap<object, ProxyDraft>;
  enableRecordTuple: boolean;
  parentDraft?: ProxyDraft | null;
  key?: string | symbol;
  patches?: Patches;
  inversePatches?: Patches;
}): T {
  const proxyDraft: ProxyDraft = {
    type: DraftType.Object,
    finalized: false,
    updated: false,
    assigned: null,
    parent: parentDraft,
    original,
    copy: null,
    proxy: null,
    key,
  };
  const { proxy, revoke } = Proxy.revocable<any>(proxyDraft, {
    get: createGetter({
      patches,
      inversePatches,
      enableRecordTuple,
      finalities,
      proxiesMap,
    }),
    set: createSetter({ patches, inversePatches, finalities }),
    has(target: ProxyDraft, key: string | symbol) {
      return key in latest(target);
    },
    ownKeys(target: ProxyDraft) {
      return Reflect.ownKeys(latest(target));
    },
    getOwnPropertyDescriptor(target: ProxyDraft, key: string | symbol) {
      const owner = latest(target);
      const descriptor = Reflect.getOwnPropertyDescriptor(owner, key);
      if (!descriptor) return descriptor;
      return {
        writable: true,
        configurable: target.type !== DraftType.Array || key !== 'length',
        enumerable: descriptor.enumerable,
        value: owner[key],
      };
    },
    getPrototypeOf(target: ProxyDraft) {
      return Reflect.getPrototypeOf(target.original);
    },
    setPrototypeOf(target: ProxyDraft, value: object | null) {
      throw new Error('Cannot set prototype on draft');
    },
    defineProperty(
      target: ProxyDraft,
      key: string | symbol,
      descriptor: PropertyDescriptor
    ) {
      throw new Error('Cannot define property on draft');
    },
    deleteProperty(target: ProxyDraft, key: string | symbol) {
      if (!target.updated) {
        ensureShallowCopy(target);
        target.assigned = {};
      }
      const previousState = target.copy![key];
      delete target.copy![key];
      if (target.assigned) {
        delete target.assigned![key];
      }
      target.updated = true;
      patches?.push([Operation.Delete, [key], []]);
      inversePatches?.push([Operation.Set, [key], [previousState]]);
      makeChange(target, patches, inversePatches);
      return true;
    },
  });
  finalities.unshift(revoke);
  proxyDraft.proxy = proxy;
  if (original) {
    proxiesMap.set(original, proxy);
  }
  return proxy;
}

export function finalizeDraft<T>(result: T, finalities: (() => void)[]) {
  const proxyDraft: ProxyDraft = getProxyDraft(result as any)!;
  for (const finalize of finalities) {
    finalize();
  }
  if (!proxyDraft.updated) return proxyDraft.original;
  return proxyDraft.copy;
}
