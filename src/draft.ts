import type { Patches, ProxyDraft } from './interface';
import { createArrayHandler, mutableArrayMethods } from './array';
import { DraftType, Operation, PROXY_DRAFT } from './constant';
import { createMapHandler, mutableMapMethods } from './map';
import { createSetHandler, mutableSetMethods } from './set';
import {
  deepFreeze,
  ensureShallowCopy,
  getDescriptor,
  getProxyDraft,
  getValue,
  has,
  isDraftable,
  latest,
  makeChange,
} from './utils';

function createGetter({
  proxiesMap,
  assignedSet,
  finalities,
  patches,
  inversePatches,
  mutableFilter,
}: {
  proxiesMap: WeakMap<object, ProxyDraft>;
  assignedSet: WeakSet<any>;
  finalities: (() => void)[];
  patches?: Patches;
  inversePatches?: Patches;
  mutableFilter?: (target: any) => boolean;
}) {
  return function get(target: ProxyDraft, key: string | symbol, receiver: any) {
    if (key === PROXY_DRAFT) return target;
    if (mutableFilter) {
      const value = Reflect.get(target.original, key, receiver);
      if (mutableFilter(value)) {
        return value;
      }
    }
    if (target.original instanceof Set && !target.copy) {
      finalities.unshift(() => {
        if (target.finalized) return;
        target.finalized = true;
        if (target.copy instanceof Set && target.operated.size > 0) {
          const iterator = Array.from(target.copy);
          target.copy.clear();
          for (const item of iterator) {
            if (typeof item === 'object') {
              const proxyDraft = target.setMap?.get(item);
              if (proxyDraft) {
                const value =
                  proxyDraft.operated.size > 0
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
          assignedSet,
          patches,
          inversePatches,
          mutableFilter,
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
          assignedSet,
          finalities,
          patches,
          inversePatches,
          mutableFilter,
        });
      }
      return getDescriptor(state, key)?.value;
    }
    if (isDraftable(value) && !getProxyDraft(value)) {
      if (assignedSet.has(value)) return value;
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
          mutableFilter,
          assignedSet,
        });
        finalities.unshift(() => {
          const proxyDraft = getProxyDraft(target.copy![key]);
          if (proxyDraft) {
            target.copy![key] =
              proxyDraft.operated.size > 0
                ? getValue(target.copy![key])
                : proxyDraft.original;
          }
        });
        return target.copy![key];
      } else {
        if (proxyDraft.key !== key) {
          proxyDraft.key = key;
        }
        return proxyDraft.proxy;
      }
    }
    return value;
  };
}

function createSetter({
  finalities,
  assignedSet,
  patches,
  inversePatches,
}: {
  finalities: (() => void)[];
  assignedSet: WeakSet<any>;
  patches?: Patches;
  inversePatches?: Patches;
}) {
  return function set(target: ProxyDraft, key: string, value: any) {
    ensureShallowCopy(target);
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
    if (value === target.original[key]) {
      target.operated.delete(key);
    } else {
      target.operated.add(key);
    }
    if (isDraftable(value)) {
      assignedSet.add(value);
    }
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
  parentDraft,
  key,
  patches,
  inversePatches,
  finalities,
  proxiesMap,
  assignedSet,
  enableFreeze,
  mutableFilter,
}: {
  original: T;
  finalities: (() => void)[];
  proxiesMap: WeakMap<object, ProxyDraft>;
  assignedSet: WeakSet<any>;
  parentDraft?: ProxyDraft | null;
  key?: string | symbol;
  patches?: Patches;
  inversePatches?: Patches;
  enableFreeze?: boolean;
  mutableFilter?: (target: any) => boolean;
}): T {
  const proxyDraft: ProxyDraft = {
    // todo: check
    type: DraftType.Object,
    finalized: false,
    operated: new Set(),
    parent: parentDraft,
    original,
    copy: null,
    proxy: null,
    key,
    finalities,
    enableFreeze,
  };
  const { proxy, revoke } = Proxy.revocable<any>(proxyDraft, {
    get: createGetter({
      patches,
      inversePatches,
      finalities,
      proxiesMap,
      mutableFilter,
      assignedSet,
    }),
    set: createSetter({
      patches,
      inversePatches,
      finalities,
      assignedSet,
    }),
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
      if (!target.copy) {
        ensureShallowCopy(target);
      }
      const previousState = target.copy![key];
      delete target.copy![key];
      if (!Object.hasOwnProperty.call(target.original, key)) {
        target.operated.delete(key);
      } else {
        target.operated.add(key);
      }
      patches?.push([Operation.Delete, [key], []]);
      inversePatches?.push([Operation.Set, [key], [previousState]]);
      makeChange(target, patches, inversePatches);
      return true;
    },
  });
  finalities.unshift(revoke);
  proxyDraft.proxy = proxy;
  if (original) {
    proxiesMap.set(original, proxyDraft);
  }
  return proxy;
}

export function finalizeDraft<T>(result: T) {
  const proxyDraft: ProxyDraft = getProxyDraft(result as any)!;
  for (const finalize of proxyDraft.finalities) {
    finalize();
  }
  const state = !proxyDraft.operated.size
    ? proxyDraft.original
    : proxyDraft.copy;
  if (proxyDraft.enableFreeze) {
    deepFreeze(state);
  }
  return state;
}
