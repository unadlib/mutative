import type { Options, ProxyDraft } from '../interface';
import { dataTypes } from '../constant';
import { getValue, isDraft, isDraftable } from './draft';

function strictCopy(target: any) {
  const descriptors = Object.getOwnPropertyDescriptors(target);
  Reflect.ownKeys(descriptors).forEach((key: any) => {
    const desc = descriptors[key];
    // for freeze
    if (!desc.writable) {
      desc.writable = true;
      desc.configurable = true;
    }
    if (desc.get || desc.set)
      descriptors[key] = {
        configurable: true,
        writable: true,
        enumerable: desc.enumerable,
        value: target[key],
      };
  });
  return Object.create(Object.getPrototypeOf(target), descriptors);
}

export function shallowCopy(original: any, options?: Options<any, any>) {
  let markResult: any;
  if (Array.isArray(original)) {
    return Array.prototype.concat.call(original);
  } else if (original instanceof Set) {
    return new Set(original.values());
  } else if (original instanceof Map) {
    return new Map(original);
  } else if (
    options?.mark &&
    ((markResult = options.mark(original, dataTypes)),
    typeof markResult !== 'undefined') &&
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
    throw new Error(`Unsupported mark result: ${markResult}`);
  } else if (
    typeof original === 'object' &&
    Object.getPrototypeOf(original) === Object.prototype
  ) {
    // For best performance with shallow copies,
    // don't use `Object.create(Object.getPrototypeOf(obj), Object.getOwnPropertyDescriptors(obj));` by default.
    const copy: Record<string | symbol, any> = {};
    Object.keys(original).forEach((key) => {
      copy![key] = original[key];
    });
    return copy;
  } else {
    throw new Error(
      `Unsupported type: ${original}, only plain objects, arrays, Set and Map are supported`
    );
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
  if (target instanceof Map)
    return new Map(
      Array.from(target.entries()).map(([k, v]) => [k, deepClone(v)])
    );
  if (target instanceof Set) return new Set(Array.from(target).map(deepClone));
  const copy = Object.create(Object.getPrototypeOf(target));
  for (const key in target) copy[key] = deepClone(target[key]);
  return copy;
}

export function cloneIfNeeded<T>(target: T): T {
  return isDraft(target) ? deepClone(target) : target;
}

export { deepClone };
