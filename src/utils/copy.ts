import type { Options, ProxyDraft } from '../interface';
import { dataTypes } from '../constant';
import { getProxyDraft, getValue, isDraft, isDraftable, latest } from './draft';
import { isBaseMapInstance, isBaseSetInstance, isPlainArray } from './proto';
import { unsafe } from './unsafe';
import { die, ErrorCode } from '../error';

function strictCopy(target: any) {
  const copy = Object.create(Object.getPrototypeOf(target));
  Reflect.ownKeys(target).forEach((key: any) => {
    let desc = Reflect.getOwnPropertyDescriptor(target, key)!;
    if (desc.enumerable && desc.configurable && desc.writable) {
      copy[key] = target[key];
      return;
    }
    // for freeze
    if (!desc.writable) {
      desc.writable = true;
      desc.configurable = true;
    }
    if (desc.get || desc.set)
      desc = {
        configurable: true,
        writable: true,
        enumerable: desc.enumerable,
        value: target[key],
      };
    Reflect.defineProperty(copy, key, desc);
  });
  return copy;
}

const propIsEnum = Object.prototype.propertyIsEnumerable;

/**
 * Plain objects with at most this many own enumerable string keys are copied
 * with object spread, which V8 clones in one step. Wider objects are copied
 * key by key into a dictionary-mode object: a map transition per key is far
 * slower there, and whether V8 stays in fast mode depends on transitions that
 * other code may have created for the same key sequence.
 */
const SPREAD_KEY_LIMIT = 128;

function copyPlainObject(original: any, keys = Object.keys(original)) {
  if (keys.length <= SPREAD_KEY_LIMIT) {
    // Own enumerable string and symbol keys, like the loop below.
    return { ...original };
  }
  const copy: Record<string | symbol, any> = {};
  // Deleting a property that is not the last one switches the object to
  // dictionary mode, so the wide copy inserts in constant time per key.
  copy.a = 1;
  copy.b = 1;
  delete copy.a;
  delete copy.b;
  for (let index = 0; index < keys.length; index += 1) {
    const key = keys[index];
    if (key === '__proto__') {
      // An own `__proto__` key (e.g. from JSON.parse) must stay a data
      // property instead of changing the copy's prototype.
      Object.defineProperty(copy, key, {
        value: original[key],
        writable: true,
        enumerable: true,
        configurable: true,
      });
    } else {
      copy[key] = original[key];
    }
  }
  const symbols = Object.getOwnPropertySymbols(original);
  for (let index = 0; index < symbols.length; index += 1) {
    const key = symbols[index];
    if (propIsEnum.call(original, key)) {
      copy[key] = original[key];
    }
  }
  return copy;
}

// current() copies drafts, and the drafts of a producer whose base is a draft
// have drafts as originals. A draft is copied from its current object, since
// spreading the Proxy takes a slow generic path; the objects it holds are then
// read through it, which drafts them when it belongs to an outer producer.
function copyDraft(original: any, draft: ProxyDraft) {
  const source = latest(draft);
  const keys = Object.keys(source);
  if (keys.length > SPREAD_KEY_LIMIT) return copyPlainObject(original, keys);
  const copy: any = { ...source };
  Reflect.ownKeys(copy).forEach((key) => {
    const value = copy[key];
    // The spread made every key an own data property, so assigning one,
    // `__proto__` included, only replaces its value.
    if (typeof value === 'object' && value !== null) copy[key] = original[key];
  });
  return copy;
}

// An array draft is copied from its current array, and the objects it holds
// are then read through it, which drafts them when it belongs to an outer
// producer and keeps the strict-mode checks; primitives never pass through
// the Proxy, whose `concat` runs two traps per element. The array of a frozen
// state is copied like a locked array, since `concat` is slow on it.
function copyDraftArray(draft: ProxyDraft) {
  const source = latest(draft);
  const copy = Object.isExtensible(source)
    ? concatCopy(source)
    : copyLockedArray(source);
  const proxy = draft.proxy;
  for (let index = 0; index < copy.length; index += 1) {
    const value = copy[index];
    if (typeof value === 'object' && value !== null) copy[index] = proxy[index];
  }
  return copy;
}

// Copies an array with `concat`, which keeps holes and creates the copy
// through `Symbol.species`. `concat` puts an array whose
// `Symbol.isConcatSpreadable` is false into the copy as one element instead,
// so such an array is copied with `slice`.
function concatCopy(original: any[]) {
  const copy = Array.prototype.concat.call(original);
  return copy.length === 1 && copy[0] === original
    ? Array.prototype.slice.call(original)
    : copy;
}

const arrayValues = Array.prototype[Symbol.iterator];
const arrayIterator = Object.getPrototypeOf(arrayValues.call([]));
const arrayIteratorNext = arrayIterator.next;

/**
 * `concat` leaves V8's fast path for frozen, sealed and non-extensible arrays
 * and takes about ten times as long as a spread there. A spread copies a
 * plain array the same way when it has no holes and none of the iterators it
 * calls has been replaced. Holes read as `undefined`, so arrays that hold
 * `undefined` keep `concat`.
 */
function copyLockedArray(original: any[]) {
  return isPlainArray(original) &&
    !Object.prototype.hasOwnProperty.call(original, Symbol.iterator) &&
    Array.prototype[Symbol.iterator] === arrayValues &&
    arrayIterator.next === arrayIteratorNext &&
    !Array.prototype.includes.call(original, undefined)
    ? [...original]
    : concatCopy(original);
}

export function shallowCopy(
  original: any,
  options?: Options<any, any>,
  draft?: ProxyDraft | null
) {
  let markResult: any;
  if (Array.isArray(original)) {
    if (draft) return copyDraftArray(draft);
    // With auto-freeze, the arrays of a state are frozen; otherwise checking
    // for that would cost more than it saves.
    return options?.enableAutoFreeze && !Object.isExtensible(original)
      ? copyLockedArray(original)
      : concatCopy(original);
  } else if (original instanceof Set) {
    if (!isBaseSetInstance(original)) {
      const SubClass = Object.getPrototypeOf(original).constructor;
      return new SubClass(original.values());
    }
    // The Set draft of an outer create() call has no Set internals.
    return !isDraft(original) && Set.prototype.difference
      ? Set.prototype.difference.call(original, new Set())
      : new Set(original.values());
  } else if (original instanceof Map) {
    if (!isBaseMapInstance(original)) {
      const SubClass = Object.getPrototypeOf(original).constructor;
      return new SubClass(original);
    }
    return new Map(original);
  } else if (
    options?.mark &&
    ((markResult = options.mark(original, dataTypes)),
    markResult !== undefined) &&
    markResult !== dataTypes.mutable
  ) {
    if (markResult === dataTypes.immutable) {
      return strictCopy(original);
    } else if (typeof markResult === 'function') {
      if (__DEV__ && (options.enablePatches || options.enableAutoFreeze)) {
        throw new Error(
          `You can't use mark and patches or auto freeze together.`
        );
      }
      return markResult();
    }
    die(ErrorCode.UnsupportedMarkResult, markResult);
  } else if (
    typeof original === 'object' &&
    Object.getPrototypeOf(original) === Object.prototype
  ) {
    return draft ? copyDraft(original, draft) : copyPlainObject(original);
  } else {
    die(ErrorCode.InvalidMark);
  }
}

export function ensureShallowCopy(target: ProxyDraft) {
  if (target.copy) return;
  // Only a producer whose base is a draft checks whether originals are.
  target.copy = target.finalities.nested
    ? copyOuterDraft(target)
    : shallowCopy(target.original, target.options)!;
}

// The copy of a draft whose original is a draft of an outer create() call
// reads every object it holds through that draft, which in strict mode would
// reject the non-draftable ones as if the recipe had read them. The copy
// reads them unchecked; the drafts of this call check the recipe's reads.
function copyOuterDraft(target: ProxyDraft) {
  return unsafe(() =>
    shallowCopy(target.original, target.options, getProxyDraft(target.original))
  );
}

function deepClone<T>(target: T): T;
function deepClone(target: any) {
  if (!isDraftable(target)) return getValue(target);
  if (Array.isArray(target)) return target.map(deepClone);
  if (target instanceof Map) {
    const iterable = Array.from(target.entries()).map(([k, v]) => [
      k,
      deepClone(v),
    ]) as Iterable<readonly [any, any]>;
    if (!isBaseMapInstance(target)) {
      const SubClass = Object.getPrototypeOf(target).constructor;
      return new SubClass(iterable);
    }
    return new Map(iterable);
  }
  if (target instanceof Set) {
    const iterable = Array.from(target).map(deepClone);
    if (!isBaseSetInstance(target)) {
      const SubClass = Object.getPrototypeOf(target).constructor;
      return new SubClass(iterable);
    }
    return new Set(iterable);
  }
  // Own enumerable string and symbol keys, as drafts copy plain objects. The
  // spread keeps an own `__proto__` key a data property, and assignments to
  // the copy's own keys cannot change its prototype.
  const copy = { ...target };
  for (const key in copy) {
    const value = copy[key];
    if (typeof value === 'object' && value !== null) {
      copy[key] = deepClone(value);
    }
  }
  const symbols = Object.getOwnPropertySymbols(copy);
  for (let index = 0; index < symbols.length; index += 1) {
    const value = copy[symbols[index]];
    if (typeof value === 'object' && value !== null) {
      copy[symbols[index]] = deepClone(value);
    }
  }
  return copy;
}

export { deepClone };
