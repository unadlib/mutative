import type { ProxyDraft } from '../interface';
import { dataTypes } from '../constant';
import { getValue, isDraft, isDraftable } from './draft';

function strictCopy(target: any) {
  const descriptors = Object.getOwnPropertyDescriptors(target);
  Reflect.ownKeys(descriptors).forEach((key: any) => {
    const desc = descriptors[key];
    if (desc.writable === false) {
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

export function shallowCopy(
  original: any,
  checkCopy?: (original: any) => boolean,
  strictCopy?: (original: any) => any,
) {
  if (Array.isArray(original)) {
    return Array.prototype.concat.call(original);
  } else if (original instanceof Set) {
    return new Set(original.values());
  } else if (original instanceof Map) {
    return new Map(original.entries());
  } else if (checkCopy?.(original)) {
    if (typeof original !== 'object') {
      throw new Error(`Cannot make a shallow copy ${original}`);
    }

    const descriptors = Object.getOwnPropertyDescriptors(original);
    Reflect.ownKeys(descriptors).forEach((key: any) => {
      const descriptor = descriptors[key];
      // for freeze
      if (!descriptor.writable) {
        descriptor.writable = true;
      }
    });
    return Object.create(Object.getPrototypeOf(original), descriptors);
  } else if (
    typeof original === 'object' &&
    Object.getPrototypeOf(original) === Object.prototype
  ) {
    if (strictCopy) return strictCopy(original);
    // For best performance with shallow copies,
    // don't use `Object.create(Object.getPrototypeOf(obj), Object.getOwnPropertyDescriptors(obj));` by default.
    const copy: Record<string | symbol, any> = {};
    Object.keys(original).forEach((key) => {
      copy![key] = original[key];
    });
    return copy;
  } else {
    throw new Error(
      `Unsupported type： ${original}, only plain objects, arrays, Set and Map are supported`
    );
  }
}

export function ensureShallowCopy(target: ProxyDraft) {
  if (target.copy) return;
  target.copy = shallowCopy(
    target.original,
    target.options.mark
      ? () =>
          target.options.mark!(target.original, dataTypes) ===
          dataTypes.immutable
      : undefined
  )!;
}

// todo: optimize
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
