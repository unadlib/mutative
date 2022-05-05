import type { Finalities, Patches, ProxyDraft, Hook } from './interface';
import { createArrayHandler, mutableArrayMethods } from './array';
import {
  ArrayOperation,
  dataTypes,
  DraftType,
  ObjectOperation,
  PROXY_DRAFT,
} from './constant';
import { createMapHandler, mutableMapMethods } from './map';
import { createSetHandler, handleSet, mutableSetMethods } from './set';
import {
  appendParentDraft,
  appendPaths,
  deepFreeze,
  ensureDraftValue,
  ensureShallowCopy,
  getDescriptor,
  getPath,
  getProxyDraft,
  getType,
  getValue,
  getValueOrPath,
  has,
  isDraft,
  isDraftable,
  latest,
  makeChange,
} from './utils';
import { current } from './current';

function createGetter({
  assignedSet,
  patches,
  inversePatches,
}: {
  assignedSet: WeakSet<any>;
  patches?: Patches;
  inversePatches?: Patches;
}) {
  return function get(
    target: ProxyDraft,
    key: string | number | symbol,
    receiver: any
  ) {
    if (key === PROXY_DRAFT) return target;
    if (target.hook) {
      const value = Reflect.get(target.original, key, receiver);
      if (target.hook(value, dataTypes) === dataTypes.mutable) {
        return value;
      }
    }
    // In the first execution of getter adding `Set` finality func to the target
    if (target.original instanceof Set && !target.copy) {
      handleSet(target);
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
          assignedSet,
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
          assignedSet,
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
          assignedSet,
          patches,
          inversePatches,
        });
      }
      return getDescriptor(state, key)?.value;
    }
    const proxyDraft = getProxyDraft(value);
    if (typeof key !== 'symbol' && isDraftable(value, target) && !proxyDraft) {
      if (assignedSet.has(value)) return value;
      target.copy![key] = createDraft({
        original: target.original[key],
        parentDraft: target,
        key,
        patches,
        inversePatches,
        finalities: target.finalities,
        hook: target.hook,
        assignedSet,
      });
      target.finalities.draft.unshift(() => {
        const proxyDraft = getProxyDraft(target.copy![key]);
        if (proxyDraft) {
          target.copy![key] =
            proxyDraft.operated.size > 0
              ? getValue(target.copy![key])
              : proxyDraft.original;
        }
      });
      return target.copy![key];
    }
    if (proxyDraft && typeof key !== 'symbol') {
      appendParentDraft({
        current: value,
        parent: target,
        key,
      });
      return proxyDraft.proxy;
    }
    return value;
  };
}

function createSetter({
  assignedSet,
  patches,
  inversePatches,
}: {
  assignedSet: WeakSet<any>;
  patches?: Patches;
  inversePatches?: Patches;
}) {
  return function set(target: ProxyDraft, key: string, value: any) {
    ensureShallowCopy(target);
    let previousState: any;
    let previousItems: any[] | null;
    let hasOwnProperty = false;
    if (patches && inversePatches) {
      previousState = target.copy![key];
      previousItems =
        Array.isArray(target.copy) && key === 'length' && inversePatches
          ? target.copy.slice(value)
          : null;
      hasOwnProperty = Object.hasOwnProperty.call(target.copy!, key);
    }
    ensureDraftValue(target, key, value);
    target.copy![key] = value;
    if (target.original[key] === getValue(value)) {
      target.operated.delete(key);
    } else {
      target.operated.add(key);
    }
    if (isDraftable(value, target)) {
      assignedSet.add(value);
    }
    if (patches && inversePatches) {
      if (Array.isArray(target.original)) {
        patches.push([
          [DraftType.Array, ArrayOperation.Set],
          [[key]],
          [getValueOrPath(value)],
        ]);
        const numberKey = Number(key);
        if (key === 'length') {
          inversePatches.unshift([
            [DraftType.Array, ArrayOperation.Push],
            [[]],
            previousItems!.map((i) => current(i)),
          ]);
        } else if (!isNaN(numberKey) && numberKey >= target.original.length) {
          inversePatches.unshift([
            [DraftType.Array, ArrayOperation.Set],
            [['length']],
            [target.original.length],
          ]);
        } else {
          inversePatches.unshift([
            [DraftType.Array, ArrayOperation.Set],
            [[key]],
            [current(previousState)],
          ]);
        }
      } else {
        patches.push([
          [DraftType.Object, ObjectOperation.Set],
          [[key]],
          [getValueOrPath(value)],
        ]);
        inversePatches.unshift([
          [
            DraftType.Object,
            hasOwnProperty ? ObjectOperation.Set : ObjectOperation.Delete,
          ],
          [[key]],
          hasOwnProperty ? [getValueOrPath(previousState)] : [],
        ]);
      }
    }
    const paths = makeChange(target, patches && inversePatches && [[]]);
    if (patches && inversePatches) {
      appendPaths(paths!, patches, inversePatches);
    }
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
  assignedSet,
  enableAutoFreeze,
  hook,
}: {
  original: T;
  finalities: Finalities;
  assignedSet: WeakSet<any>;
  parentDraft?: ProxyDraft | null;
  key?: string | number;
  patches?: Patches;
  inversePatches?: Patches;
  enableAutoFreeze?: boolean;
  hook?: Hook;
}): T {
  if (isDraft(original)) {
    const proxyDraft = getProxyDraft(original)!;
    if (proxyDraft.finalities === finalities) {
      if (key && parentDraft)
        getProxyDraft(original)!.parents.set(key!, parentDraft);
      return original;
    } else {
      throw new Error(`Cannot create a draft of other draft`);
    }
  }
  const proxyDraft: ProxyDraft = {
    type: getType(original),
    finalized: false,
    operated: new Set(),
    parents: parentDraft ? new Map([[key, parentDraft]]) : new Map(),
    original,
    copy: null,
    proxy: null,
    finalities,
    enableAutoFreeze,
    hook,
  };
  const { proxy, revoke } = Proxy.revocable<any>(proxyDraft, {
    get: createGetter({
      patches,
      inversePatches,
      assignedSet,
    }),
    set: createSetter({
      patches,
      inversePatches,
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
    deleteProperty(target: ProxyDraft, key: string | number | symbol) {
      if (typeof key === 'symbol') {
        throw new Error(`Cannot delete property symbol of draft`);
      }
      if (!target.copy) {
        ensureShallowCopy(target);
      }
      const previousState = inversePatches ? target.copy![key] : null;
      delete target.copy![key];
      if (!Object.hasOwnProperty.call(target.original, key)) {
        target.operated.delete(key);
      } else {
        target.operated.add(key);
      }
      patches?.push([[DraftType.Object, ObjectOperation.Delete], [[key]], []]);
      inversePatches?.unshift([
        [DraftType.Object, ObjectOperation.Set],
        [[key]],
        [current(previousState)],
      ]);
      const paths = makeChange(target, patches && inversePatches && [[]]);
      if (patches && inversePatches) {
        appendPaths(paths!, patches, inversePatches);
      }
      return true;
    },
  });
  finalities.revoke.unshift(revoke);
  proxyDraft.proxy = proxy;
  return proxy;
}

export function finalizeDraft<T extends object>(
  result: T,
  patches?: Patches,
  inversePatches?: Patches
) {
  inversePatches?.forEach((item) => {
    item[2] = item[2].map((value) => {
      const proxyDraft = getProxyDraft(value);
      if (!proxyDraft) return value;
      const path = getPath(proxyDraft);
      return path;
    });
  });
  const proxyDraft = getProxyDraft(result)!;
  for (const finalize of proxyDraft.finalities.draft) {
    finalize();
  }
  const state = !proxyDraft.operated.size
    ? proxyDraft.original
    : proxyDraft.copy;
  for (const revoke of proxyDraft.finalities.revoke) {
    revoke();
  }
  if (proxyDraft.enableAutoFreeze) {
    deepFreeze(state);
  }
  return [state, patches, inversePatches] as [
    state: T,
    patches?: Patches,
    inversePatches?: Patches
  ];
}
