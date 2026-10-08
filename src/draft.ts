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
import {
  arrayMethods,
  baseIndex,
  isMovedElement,
  resized,
  trackArrayMethod,
} from './array';
import { internal } from './internal';
import {
  deepFreeze,
  ensureShallowCopy,
  getDescriptor,
  getProxyDraft,
  getType,
  isEqual,
  isDraftable,
  latest,
  markChanged,
  revokeProxy,
  markFinalization,
  finalizeNode,
} from './utils';
import { checkReadable } from './unsafe';
import { generatePatches } from './patch';
import { die, ErrorCode } from './error';

/**
 * Accepts the keys the array set trap has always accepted: canonical
 * non-negative integer strings via an allocation-free scan, and other
 * spellings such as '-0' via the original numeric round trip.
 */
function isArrayIndexKey(key: string | number | symbol) {
  if (typeof key === 'string' && key.length < 16) {
    let index = 0;
    while (index < key.length) {
      const code = key.charCodeAt(index);
      if (code < 48 || code > 57) break;
      index += 1;
    }
    if (
      index > 0 &&
      index === key.length &&
      (index === 1 || key.charCodeAt(0) !== 48)
    ) {
      return true;
    }
  }
  if (typeof key === 'symbol') return false;
  let _key: number;
  return (
    Number.isInteger((_key = Number(key))) &&
    _key >= 0 &&
    (key === 0 || _key === 0 || String(_key) === String(key))
  );
}

const hasOwn = Object.prototype.hasOwnProperty;

function getTrap(
  target: ProxyDraft,
  key: string | number | symbol,
  receiver: any
) {
  if (key === PROXY_DRAFT) return target;
  const { options, type } = target;
  const source = latest(target);
  let markResult: any;
  if (options.mark) {
    // The mark classifies the value the draft holds now, so a value the
    // recipe assigned is read back as assigned. `size` is read without the
    // proxy as receiver: the Map and Set getters reject any other receiver.
    const value =
      key === 'size' && (source instanceof Map || source instanceof Set)
        ? Reflect.get(source, key)
        : Reflect.get(source, key, receiver);
    markResult = options.mark(value, dataTypes);
    if (markResult === dataTypes.mutable) {
      if (options.strict) {
        checkReadable(value, options, true);
      }
      return value;
    }
  }

  if (type === DraftType.Map) {
    if (mapHandlerKeys.includes(key as any)) {
      if (key === 'size') {
        return Object.getOwnPropertyDescriptor(mapHandler, 'size')!.get!.call(
          target.proxy
        );
      }
      const handle = mapHandler[key as keyof typeof mapHandler] as Function;
      return handle.bind(target.proxy);
    }
  } else if (type === DraftType.Set) {
    if (setHandlerKeys.includes(key as any)) {
      if (key === 'size') {
        return Object.getOwnPropertyDescriptor(setHandler, 'size')!.get!.call(
          target.proxy
        );
      }
      const handle = setHandler[key as keyof typeof setHandler] as Function;
      return handle.bind(target.proxy);
    }
  }

  if (
    type === DraftType.Map
      ? !(source as Map<any, any>).has(key)
      : !hasOwn.call(source, key)
  ) {
    if (
      type === DraftType.Array &&
      Object.getPrototypeOf(target.original) === Array.prototype
    ) {
      // Methods of plain arrays that can run natively on the copy; see
      // `arrayMethods`. Subclasses resolve their own methods below.
      const method = arrayMethods[key as any];
      if (method !== undefined) {
        trackArrayMethod(target);
        return method;
      }
    }
    const desc = getDescriptor(source, key);
    return desc
      ? `value` in desc
        ? desc.value
        : // !case: support for getter
          desc.get?.call(target.proxy)
      : undefined;
  }
  const value = source[key];
  if (options.strict) {
    checkReadable(value, options);
  }
  if (target.finalized || typeof value !== 'object' || value === null) {
    return value;
  }
  // This draft's own child at this key is returned without a proxy round
  // trip and without reading the original object. The first child is kept
  // inline; further children are registered per draft.
  if (value === target.child && key === target.childKey) return value;
  const children = target.children;
  if (
    children !== undefined &&
    (type === DraftType.Array ? children[key as number] : children.get(key)) ===
      value
  ) {
    return value;
  }
  // Non-draftable values never reach the original object either, so an
  // accessor that returns a Date or similar is not re-invoked for a copy.
  if (!isDraftable(value, options)) return value;
  // Reassigned values, and fresh objects produced by an accessor on the
  // original, differ from the original at this key and are not drafted. After
  // a native array operation moved elements, an original element may sit at
  // any index, so membership in the original array decides instead, except
  // for a value the recipe assigned at this index; see `baseIndex`.
  let draftKey: any = key;
  if (value !== target.original[key]) {
    draftKey = baseIndex(target, value, key as number);
    if (draftKey === -1) return value;
  }
  ensureShallowCopy(target);
  const draft = createDraft(
    value,
    target,
    type === DraftType.Array ? Number(draftKey) : draftKey,
    target.finalities,
    options
  );
  target.copy![key] = draft;
  // A moved element keeps its original index as key for patch paths and is
  // finalized into its current index through a callback.
  if (draftKey !== key) markFinalization(target, key, draft);
  if (target.child === null || target.childKey === key) {
    target.child = draft;
    target.childKey = key;
  } else if (type === DraftType.Array) {
    (target.children ??= [])[key as any] = draft;
  } else {
    (target.children ??= new Map()).set(key, draft);
  }
  // !case: support for custom shallow copy function
  if (typeof markResult === 'function') {
    const subProxyDraft = getProxyDraft(draft)!;
    ensureShallowCopy(subProxyDraft);
    // Trigger a custom shallow copy to update to a new copy
    markChanged(subProxyDraft);
    return subProxyDraft.copy;
  }
  return draft;
}

function setTrap(
  target: ProxyDraft,
  key: string | number | symbol,
  value: any
) {
  if (target.type === DraftType.Set || target.type === DraftType.Map) {
    die(ErrorCode.CannotAssignToMapOrSet);
  }
  if (
    target.type === DraftType.Array &&
    key !== 'length' &&
    !isArrayIndexKey(key)
  ) {
    die(ErrorCode.InvalidArrayIndex);
  }
  const source = latest(target);
  // An own data property shadows any prototype setter, so the prototype
  // chain only needs to be searched for keys the source does not own.
  if (!hasOwn.call(source, key)) {
    const desc = getDescriptor(source, key);
    if (desc?.set) {
      // !case: cover the case of setter
      desc.set.call(target.proxy, value);
      return true;
    }
  }
  const current = source[key];
  const currentProxyDraft = getProxyDraft(current);
  const original = target.original;
  if (currentProxyDraft && isEqual(currentProxyDraft.original, value)) {
    // !case: assigning the original object of the draft at this key drops
    // the draft. The key holds its original value again unless the draft
    // was moved here from another key, in which case it is an assignment.
    target.copy![key] = value;
    target.assignedMap = target.assignedMap ?? new Map();
    if (hasOwn.call(original, key) && isEqual(value, original[key])) {
      target.assignedMap.delete(key);
    } else {
      markChanged(target);
      target.assignedMap.set(key, true);
      markFinalization(target, key, value);
    }
    return true;
  }
  // !case: handle new props with value 'undefined'
  // The current copy decides whether the key exists: a key removed from the
  // copy, by delete or by a shrinking array method, is added back by this
  // assignment even when the original still has it.
  if (
    isEqual(value, current) &&
    (value !== undefined || hasOwn.call(source, key)) &&
    (target.arrayState === null || !isMovedElement(target, value, key))
  )
    return true;
  ensureShallowCopy(target);
  markChanged(target);
  const arrayState = target.arrayState;
  if (
    arrayState !== null &&
    ((typeof value === 'object' && value !== null) ||
      typeof value === 'function')
  ) {
    arrayState.inert = null;
  }
  if (hasOwn.call(original, key) && isEqual(value, original[key])) {
    // !case: handle the case of assigning the original non-draftable value to a draft
    target.assignedMap!.delete(key);
  } else {
    target.assignedMap!.set(key, true);
  }
  // A longer length, or an index past the end, leaves holes behind.
  const length = target.type === DraftType.Array ? target.copy!.length : -1;
  target.copy![key] = value;
  if (
    length !== -1 &&
    target.copy!.length > length + (key === 'length' ? 0 : 1)
  ) {
    resized(target, length);
  }
  markFinalization(target, key, value);
  return true;
}

function hasTrap(target: ProxyDraft, key: string | symbol) {
  return key in latest(target);
}

function ownKeysTrap(target: ProxyDraft) {
  return Reflect.ownKeys(latest(target));
}

function getOwnPropertyDescriptorTrap(
  target: ProxyDraft,
  key: string | symbol
) {
  const source = latest(target);
  const descriptor = Reflect.getOwnPropertyDescriptor(source, key);
  if (!descriptor) return descriptor;
  return {
    writable: true,
    configurable: target.type !== DraftType.Array || key !== 'length',
    enumerable: descriptor.enumerable,
    value: source[key],
  };
}

function getPrototypeOfTrap(target: ProxyDraft) {
  return Reflect.getPrototypeOf(target.original);
}

function setPrototypeOfTrap(): never {
  die(ErrorCode.CannotSetPrototypeOfDraft);
}

function definePropertyTrap(): never {
  die(ErrorCode.CannotDefinePropertyOnDraft);
}

function deletePropertyTrap(target: ProxyDraft, key: string | symbol) {
  if (target.type === DraftType.Array) {
    return setTrap(target, key, undefined);
  }
  if (target.original[key] !== undefined || key in target.original) {
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
}

const objectHandler: ProxyHandler<ProxyDraft> = {
  get: getTrap,
  set: setTrap,
  has: hasTrap,
  ownKeys: ownKeysTrap,
  getOwnPropertyDescriptor: getOwnPropertyDescriptorTrap,
  getPrototypeOf: getPrototypeOfTrap,
  setPrototypeOf: setPrototypeOfTrap,
  defineProperty: definePropertyTrap,
  deleteProperty: deletePropertyTrap,
};

// Array drafts use a one-element array as the proxy target so that
// `Array.isArray(draft)` holds; these wrappers unwrap the state from it.
const arrayHandler: ProxyHandler<[ProxyDraft]> = {};
Object.keys(objectHandler).forEach((name) => {
  const trap = objectHandler[name as keyof ProxyHandler<ProxyDraft>] as (
    ...args: any[]
  ) => any;
  (arrayHandler as any)[name] = (target: [ProxyDraft], key: any, value: any) =>
    trap(target[0], key, value);
});

export function createDraft<T extends object>(
  original: T,
  parentDraft: ProxyDraft | null,
  key: string | number | symbol | undefined,
  finalities: Finalities,
  options: Options<any, any>
): T {
  const type = getType(original);
  // Every field is initialized here so all draft states share one shape.
  const proxyDraft: ProxyDraft = {
    type,
    finalized: false,
    operated: false,
    parent: parentDraft,
    key,
    original,
    copy: null,
    proxy: null,
    finalities,
    options,
    // Mapping of draft Set items to their corresponding draft values, built
    // once a Set draft is changed or iterated; see `getSetMap`.
    setMap: undefined,
    assignedMap: undefined,
    callbacks: undefined,
    children: undefined,
    child: null,
    childKey: null,
    arrayState: null,
  };
  const { proxy, revoke } =
    type === DraftType.Array
      ? Proxy.revocable<any>([proxyDraft], arrayHandler)
      : Proxy.revocable<any>(proxyDraft, objectHandler);
  finalities.revoke.push(revoke);
  proxyDraft.proxy = proxy;
  finalities.draft.push(proxyDraft);
  return proxy;
}

internal.createDraft = createDraft;

// Development builds warn once, in strict mode, when a producer leaves at
// least this many drafts unchanged.
const UNCHANGED_DRAFTS_WARNING_THRESHOLD = 1000;
let unchangedDraftsWarned = false;

/**
 * Every object read through a draft becomes a draft, so a search through a
 * large draft array creates one per element it visits. Drafts that are
 * unchanged and still at the key they were read from count; elements that
 * array methods drafted when removing or moving them do not. An object or
 * array draft has a copy before it drafts a child.
 */
function warnUnchangedDrafts(finalities: Finalities) {
  let count = 0;
  for (const entry of finalities.draft) {
    if (typeof entry !== 'function' && !entry.operated) {
      const parent = entry.parent;
      if (
        parent !== null &&
        (parent.type === DraftType.Array || parent.type === DraftType.Object) &&
        parent.copy[entry.key!] === entry.proxy
      ) {
        count += 1;
      }
    }
  }
  if (count >= UNCHANGED_DRAFTS_WARNING_THRESHOLD) {
    unchangedDraftsWarned = true;
    console.warn(
      `Strict mode: the recipe left ${count} drafts unchanged; every object read through a draft becomes one. For read-only scans of large arrays, search 'current(draft.list)' instead; see https://mutative.js.org/docs/api-reference/current`
    );
  }
}

export function finalizeDraft<T>(
  result: T,
  returnedValue: [T] | [],
  patches?: Patches,
  inversePatches?: Patches,
  enableAutoFreeze?: boolean
) {
  const proxyDraft = getProxyDraft(result);
  if (__DEV__ && proxyDraft?.options.strict && !unchangedDraftsWarned) {
    warnUnchangedDrafts(proxyDraft.finalities);
  }
  const original = proxyDraft?.original ?? result;
  const hasReturnedValue = !!returnedValue.length;
  if (proxyDraft?.operated) {
    const list = proxyDraft.finalities.draft;
    while (list.length > 0) {
      const entry = list.pop()!;
      if (typeof entry === 'function') {
        entry(patches, inversePatches);
      } else {
        finalizeNode(entry, generatePatches, patches, inversePatches);
      }
    }
  }
  const state = hasReturnedValue
    ? returnedValue[0]
    : proxyDraft
      ? proxyDraft.operated
        ? proxyDraft.copy
        : proxyDraft.original
      : result;
  if (proxyDraft) revokeProxy(proxyDraft.finalities);
  if (enableAutoFreeze) {
    deepFreeze(state, state, proxyDraft?.options.updatedValues);
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
