import {
  DraftType,
  Finalities,
  Patches,
  ProxyDraft,
  Options,
  Operation,
} from './interface';
import { dataTypes, PROXY_DRAFT } from './constant';
import { mapHandler, mapHandlerKeys } from './map';
import { setHandler, setHandlerKeys } from './set';
import { internal } from './internal';
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
  markChanged,
  peek,
  get,
  set,
  revokeProxy,
} from './utils';
import { finalizePatches, markFinalization } from './patch';
import { checkReadable } from './unsafe';

const proxyHandler: ProxyHandler<ProxyDraft> = {
  get(target: ProxyDraft, key: string | number | symbol, receiver: any) {
    if (key === PROXY_DRAFT) return target;
    let markResult: any;
    if (target.options.mark) {
      const value = Reflect.get(target.original, key, receiver);
      markResult = target.options.mark(value, dataTypes);
      if (markResult === dataTypes.mutable) {
        if (target.options.strict) {
          checkReadable(value, target.options, true);
        }
        return value;
      }
    }
    const source = latest(target);

    if (source instanceof Map && mapHandlerKeys.includes(key as any)) {
      if (key === 'size') {
        return Object.getOwnPropertyDescriptor(mapHandler, 'size')!.get!.call(
          target.proxy
        );
      }
      const handle = mapHandler[key as keyof typeof mapHandler] as Function;
      if (handle) {
        return handle.bind(target.proxy);
      }
    }

    if (source instanceof Set && setHandlerKeys.includes(key as any)) {
      if (key === 'size') {
        return Object.getOwnPropertyDescriptor(setHandler, 'size')!.get!.call(
          target.proxy
        );
      }
      const handle = setHandler[key as keyof typeof setHandler] as Function;
      if (handle) {
        return handle.bind(target.proxy);
      }
    }

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
    if (target.options.strict) {
      checkReadable(value, target.options);
    }
    if (target.finalized || !isDraftable(value, target.options)) {
      return value;
    }
    // Ensure that the assigned values are not drafted
    if (value === peek(target.original, key)) {
      ensureShallowCopy(target);
      target.copy![key] = createDraft({
        original: target.original[key],
        parentDraft: target,
        key: target.type === DraftType.Array ? Number(key) : key,
        finalities: target.finalities,
        options: target.options,
      });
      if (typeof markResult === 'function') {
        const subProxyDraft = getProxyDraft(target.copy![key])!;
        ensureShallowCopy(subProxyDraft);
        markChanged(subProxyDraft);
        return subProxyDraft.copy;
      }
      return target.copy![key];
    }
    return value;
  },
  set(target: ProxyDraft, key: string | number | symbol, value: any) {
    if (target.type === DraftType.Set || target.type === DraftType.Map) {
      throw new Error(
        `'${target.type}' draft does not support any property assignment.`
      );
    }
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
      // !case: ignore the case of assigning the original draftable value to a draft
      target.copy![key] = value;
      target.assignedMap = target.assignedMap ?? new Map();
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
    markChanged(target);
    if (has(target.original, key) && isEqual(value, target.original[key])) {
      // !case: handle the case of assigning the original non-draftable value to a draft
      target.assignedMap!.delete(key);
    } else {
      target.assignedMap!.set(key, true);
    }
    target.copy![key] = value;
    markFinalization(target, key, value);
    return true;
  },
  has(target: ProxyDraft, key: string | symbol) {
    return key in latest(target);
  },
  ownKeys(target: ProxyDraft) {
    return Reflect.ownKeys(latest(target));
  },
  getOwnPropertyDescriptor(target: ProxyDraft, key: string | symbol) {
    const source = latest(target);
    const descriptor = Reflect.getOwnPropertyDescriptor(source, key);
    if (!descriptor) return descriptor;
    return {
      writable: true,
      configurable: target.type !== DraftType.Array || key !== 'length',
      enumerable: descriptor.enumerable,
      value: source[key],
    };
  },
  getPrototypeOf(target: ProxyDraft) {
    return Reflect.getPrototypeOf(target.original);
  },
  setPrototypeOf() {
    throw new Error(`Cannot call 'setPrototypeOf()' on drafts`);
  },
  defineProperty() {
    throw new Error(`Cannot call 'defineProperty()' on drafts`);
  },
  deleteProperty(target: ProxyDraft, key: string | symbol) {
    if (target.type === DraftType.Array) {
      return proxyHandler.set!.call(this, target, key, undefined, target.proxy);
    }
    if (peek(target.original, key) !== undefined || key in target.original) {
      // !case: delete an existing key
      ensureShallowCopy(target);
      markChanged(target);
      target.assignedMap!.set(key, false);
    } else {
      target.assignedMap = target.assignedMap ?? new Map();
      // The original non-existent key has been deleted
      target.assignedMap.delete(key);
    }
    if (target.copy) delete target.copy[key];
    return true;
  },
};

export function createDraft<T extends object>(createDraftOptions: {
  original: T;
  parentDraft?: ProxyDraft | null;
  key?: string | number | symbol;
  finalities: Finalities;
  options: Options<any, any>;
}): T {
  const { original, parentDraft, key, finalities, options } =
    createDraftOptions;
  const type = getType(original);
  // @ts-ignore
  const proxyDraft: ProxyDraft = {
    type,
    finalized: false,
    parent: parentDraft,
    original,
    copy: null,
    proxy: null,
    finalities,
    options,
    // Mapping of draft Set items to their corresponding draft values.
    setMap:
      type === DraftType.Set
        ? new Map((original as Set<any>).entries())
        : undefined,
  };
  // !case: undefined as a draft map key
  if (key || 'key' in createDraftOptions) {
    proxyDraft.key = key;
  }
  const { proxy, revoke } = Proxy.revocable<any>(
    type === DraftType.Array ? Object.assign([], proxyDraft) : proxyDraft,
    proxyHandler
  );
  finalities.revoke.push(revoke);
  proxyDraft.proxy = proxy;
  if (parentDraft) {
    const target = parentDraft;
    const oldProxyDraft = getProxyDraft(proxy)!;
    target.finalities.draft.push((patches, inversePatches) => {
      // if target is a Set draft, `setMap` is the real Set copies proxy mapping.
      const proxyDraft = getProxyDraft(
        get(target.type === DraftType.Set ? target.setMap : target.copy, key!)
      );
      if (proxyDraft) {
        // assign the updated value to the copy object
        let updatedValue = proxyDraft.original;
        if (proxyDraft.operated) {
          updatedValue = getValue(get(target.copy, key!));
        }
        finalizePatches(proxyDraft, patches, inversePatches);
        set(target.copy, key!, updatedValue);
      }
      // !case: handle the deleted key
      oldProxyDraft.callbacks?.forEach((callback) => {
        callback(patches, inversePatches);
      });
    });
  } else {
    // !case: handle the root draft
    const target = getProxyDraft(proxy)!;
    target.finalities.draft.push((patches, inversePatches) => {
      finalizePatches(target, patches, inversePatches);
    });
  }
  return proxy;
}

internal.createDraft = createDraft;

export function finalizeDraft<T>(
  result: T,
  returnedValue: [T] | [],
  patches?: Patches,
  inversePatches?: Patches
) {
  const proxyDraft = getProxyDraft(result)!;
  const original = proxyDraft.original;
  if (proxyDraft.operated) {
    while (proxyDraft.finalities.draft.length > 0) {
      const finalize = proxyDraft.finalities.draft.pop()!;
      finalize(patches, inversePatches);
    }
  }
  const hasReturnedValue = !!returnedValue.length;
  const state = hasReturnedValue
    ? returnedValue[0]
    : proxyDraft.operated
    ? proxyDraft.copy
    : proxyDraft.original;
  revokeProxy(proxyDraft);
  if (proxyDraft.options.enableAutoFreeze) {
    deepFreeze(state);
  }
  return [
    state,
    patches && hasReturnedValue
      ? [{ op: Operation.Replace, path: [], value: returnedValue[0] }]
      : patches,
    inversePatches && hasReturnedValue
      ? [{ op: Operation.Replace, path: [], value: original }]
      : inversePatches,
  ] as [T, Patches | undefined, Patches | undefined];
}
