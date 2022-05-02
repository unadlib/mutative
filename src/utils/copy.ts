import type { ProxyDraft } from '../interface';
import { dataTypes } from '../constant';
import { isDraft } from './draft';
import { isPlainObject } from './proto';

function shallowCopy(original: any, checkCopy?: (original: any) => boolean) {
  if (Array.isArray(original)) {
    return Array.prototype.concat.call(original);
  } else if (original instanceof Set) {
    return new Set(original.values());
  } else if (original instanceof Map) {
    return new Map(original.entries());
  } else if (isPlainObject(original)) {
    // For best performance with shallow copies,
    // don't use `Object.create(Object.getPrototypeOf(obj), Object.getOwnPropertyDescriptors(obj));`.
    const copy: Record<string | symbol, any> = {};
    Object.keys(original).forEach((key) => {
      copy![key] = original[key];
    });
    return copy;
  } else if (checkCopy?.(original)) {
    if (typeof original !== 'object') {
      throw new Error(`Cannot make a shallow copy ${original}`);
    }
    return Object.create(
      Object.getPrototypeOf(original),
      Object.getOwnPropertyDescriptors(original)
    );
  } else {
    throw new Error(
      `Unsupported type： ${original}, only plain objects, arrays, Set and Map are supported`
    );
  }
}

export function ensureShallowCopy(target: ProxyDraft) {
  if (target.copy) return;
  target.copy = isDraft(target.original)
    ? target.original
    : shallowCopy(
        target.original,
        target.hook
          ? () =>
              target.hook!(target.original, dataTypes) === dataTypes.immutable
          : undefined
      )!;
  if (target.original instanceof Set) {
    // for collection of updating draft Set data
    target.setMap = new Map();
  }
}

declare global {
  // The global structuredClone() method creates a deep clone of a given value using the structured clone algorithm.
  // https://developer.mozilla.org/en-US/docs/Web/API/structuredClone
  function structuredClone<T>(target: T): T;
}

export function deepClone<T extends unknown>(target: T): T {
  if (typeof target !== 'object') return target;
  if (typeof globalThis?.structuredClone === 'function')
    return globalThis.structuredClone(target);
  if (Array.isArray(target))
    return target.map((value) => deepClone(value)) as T;
  if (target instanceof Map)
    return new Map(
      Array.from(target).map(([key, value]) => [key, deepClone(value)])
    ) as T;
  if (target instanceof Set)
    return new Set(Array.from(target).map((value) => deepClone(value))) as T;
  const descriptors = Object.getOwnPropertyDescriptors(target);
  for (const key in descriptors) {
    descriptors[key].value = deepClone(descriptors[key].value);
  }
  return Object.create(Object.getPrototypeOf(target), descriptors);
}
