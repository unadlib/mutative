import type { Finalities, Patches, ProxyDraft, Marker } from './interface';
import { dataTypes, DraftType, PROXY_DRAFT } from './constant';
// import { createMapHandler, mutableMapMethods } from './map';
// import { createSetHandler, mutableSetMethods } from './set';
import {
  deepFreeze,
  ensureShallowCopy,
  getDescriptor,
  getProxyDraft,
  getType,
  getValue,
  has,
  isEqual,
  isDraftable,
  latest,
  makeChange,
  peek,
} from './utils';
import { finalizePatches } from './patches';

const proxyHandler: ProxyHandler<ProxyDraft> = {
  get(target: ProxyDraft, key: string | number | symbol, receiver: any) {
    if (key === PROXY_DRAFT) return target;
    if (target.marker) {
      const value = Reflect.get(target.original, key, receiver);
      if (target.marker(value, dataTypes) === dataTypes.mutable) {
        return value;
      }
    }
    const source = latest(target);
    if (!has(source, key)) {
      const desc = getDescriptor(source, key);
      return desc
        ? `value` in desc
          ? desc.value
          : // !case: support for getter
            desc.get?.call(target.proxy)
        : undefined;
    }
    const value = source[key];

    if (target.finalized || !isDraftable(value, target)) {
      return value;
    }
    // Ensure that the assigned values are not drafted
    if (value === peek(target.original, key)) {
      ensureShallowCopy(target);
      target.copy![key] = createDraft({
        original: target.original[key],
        parentDraft: target,
        key,
        finalities: target.finalities,
        marker: target.marker,
      });
      const oldProxyDraft = getProxyDraft(target.copy![key]);
      target.finalities.draft.unshift((patches, inversePatches) => {
        const proxyDraft = getProxyDraft(target.copy![key]);
        if (proxyDraft) {
          finalizePatches(proxyDraft, patches, inversePatches);
          // assign the updated value to the copy object
          target.copy![key] = proxyDraft.operated
            ? getValue(target.copy![key])
            : proxyDraft.original;
        }
        // !case: handle the deleted key
        oldProxyDraft?.callbacks?.forEach((callback) => {
          callback(patches, inversePatches);
        });
      });
      return target.copy![key];
    }
    return value;
  },
  set(target: ProxyDraft, key: string | number | symbol, value: any) {
    if (
      target.type === DraftType.Array &&
      key !== 'length' &&
      isNaN(parseInt(key as any))
    ) {
      throw new Error(
        `Only supports setting array indices and the 'length' property.`
      );
    }
    const desc = getDescriptor(latest(target), key);
    if (desc?.set) {
      // !case: cover the case of setter
      desc.set.call(target.proxy, value);
      return true;
    }
    const current = peek(latest(target), key);
    const currentProxyDraft = getProxyDraft(current);
    if (currentProxyDraft && isEqual(currentProxyDraft.original, value)) {
      // !case: ignore the case of assigning the original value to a draft
      target.copy![key] = value;
      target.assignedMap.set(key, false);
      return true;
    }
    // !case: handle new props with value 'undefined'
    if (
      isEqual(value, current) &&
      (value !== undefined || has(target.original, key))
    )
      return true;
    ensureShallowCopy(target);
    makeChange(target);
    target.copy![key] = value;
    target.assignedMap.set(key, true);
    const proxyDraft = getProxyDraft(value);
    if (proxyDraft) {
      // !case: assign the draft value
      proxyDraft.callbacks = proxyDraft.callbacks ?? [];
      proxyDraft.callbacks.push((patches, inversePatches) => {
        if (isEqual(target.copy![key], value)) {
          finalizePatches(target, patches, inversePatches);
          target.copy![key] = proxyDraft.copy ?? proxyDraft.original;
        }
      });
    }
    return true;
  },
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
    throw new Error('Cannot `setPrototypeOf()` on a draft');
  },
  defineProperty(
    target: ProxyDraft,
    key: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    throw new Error('Cannot `defineProperty()` on a draft');
  },
  deleteProperty(target: ProxyDraft, key: string | symbol) {
    if (target.type === DraftType.Array) {
      return proxyHandler.set!.call(this, target, key, undefined, target.proxy);
    }
    if (peek(target.original, key) !== undefined || key in target.original) {
      // !case: delete an existing key
      target.assignedMap.set(key, false);
      ensureShallowCopy(target);
      makeChange(target);
    } else {
      // The original non-existent key has been deleted
      target.assignedMap.delete(key);
    }
    const proxyDraft = getProxyDraft(target.copy[key]);
    if (target.copy) delete target.copy[key];
    if (proxyDraft) {
      // !case: handle delete a draft
      target.finalities.draft.unshift((patches, inversePatches) => {
        proxyDraft.callbacks?.forEach((callback) => {
          callback(patches, inversePatches);
        });
      });
    }
    return true;
  },
};

export function createDraft<T extends object>({
  original,
  parentDraft,
  key,
  finalities,
  enableAutoFreeze,
  marker,
}: {
  original: T;
  finalities: Finalities;
  parentDraft?: ProxyDraft | null;
  key?: string | number | symbol;
  enableAutoFreeze?: boolean;
  marker?: Marker;
}): T {
  const proxyDraft: ProxyDraft = {
    type: getType(original),
    finalized: false,
    parent: parentDraft,
    original,
    copy: null,
    proxy: null,
    key,
    finalities,
    enableAutoFreeze,
    marker,
    assignedMap: new Map(),
  };
  const { proxy, revoke } = Proxy.revocable<any>(
    Array.isArray(original) ? Object.assign([], proxyDraft) : proxyDraft,
    proxyHandler
  );
  finalities.revoke.unshift(revoke);
  proxyDraft.proxy = proxy;
  return proxy;
}

export function finalizeDraft<T>(
  result: T,
  patches?: Patches,
  inversePatches?: Patches
) {
  const proxyDraft = getProxyDraft(result as any)!;
  for (const finalize of proxyDraft.finalities.draft) {
    finalize(patches, inversePatches);
  }
  const state = !proxyDraft.operated ? proxyDraft.original : proxyDraft.copy;
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
