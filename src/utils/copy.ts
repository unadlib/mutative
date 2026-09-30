import type { Options, ProxyDraft } from '../interface';
import { dataTypes } from '../constant';
import { getValue, isDraft, isDraftable } from './draft';
import { isBaseMapInstance, isBaseSetInstance } from './proto';
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

function copyPlainObject(original: any) {
  const keys = Object.keys(original);
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

export function shallowCopy(original: any, options?: Options<any, any>) {
  let markResult: any;
  if (Array.isArray(original)) {
    return Array.prototype.concat.call(original);
  } else if (original instanceof Set) {
    if (!isBaseSetInstance(original)) {
      const SubClass = Object.getPrototypeOf(original).constructor;
      return new SubClass(original.values());
    }
    return Set.prototype.difference
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
    return copyPlainObject(original);
  } else {
    die(ErrorCode.InvalidMark);
  }
}

export function ensureShallowCopy(target: ProxyDraft) {
  if (target.copy) return;
  target.copy = shallowCopy(target.original, target.options)!;
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
  const copy = Object.create(Object.getPrototypeOf(target));
  for (const key in target) copy[key] = deepClone(target[key]);
  return copy;
}

export function cloneIfNeeded<T>(target: T): T {
  return isDraft(target) ? deepClone(target) : target;
}

export { deepClone };
