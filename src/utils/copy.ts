import type { ProxyDraft } from '../interface';
import { dataTypes } from '../constant';
import { isDraft } from './draft';

function shallowCopy(original: any, checkCopy?: (original: any) => boolean) {
  if (Array.isArray(original)) {
    return Array.prototype.concat.call(original);
  } else if (original instanceof Set) {
    return new Set(original.values());
  } else if (original instanceof Map) {
    return new Map(original.entries());
  } else if (
    typeof original === 'object' &&
    Object.getPrototypeOf(original) === Object.prototype
  ) {
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

// TODO: fix types
export function deepClone<T>(target: T): T {
  if (typeof target !== 'object') return target;
  if (Array.isArray(target))
    return target.map((value) => deepClone(value)) as any;
  if (target instanceof Map)
    return new Map(
      Array.from(target).map(([key, value]) => [key, deepClone(value)])
    ) as any;
  if (target instanceof Set)
    return new Set(Array.from(target).map((value) => deepClone(value))) as any;
  const descriptors = Object.getOwnPropertyDescriptors(target);
  for (const key in descriptors) {
    descriptors[key].value = deepClone(descriptors[key].value);
  }
  return Object.create(Object.getPrototypeOf(target), descriptors);
}
