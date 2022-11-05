import type { ProxyDraft } from '../interface';
import { dataTypes } from '../constant';
import { getValue, isDraft, isDraftable } from './draft';

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
  target.copy = shallowCopy(
    target.original,
    target.marker
      ? () => target.marker!(target.original, dataTypes) === dataTypes.immutable
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
  // TODO: copy immutable symbols?
  return copy;
}

export function cloneIfNeeded<T>(target: T): T {
  if (isDraft(target)) {
    return deepClone(target);
  } else return target;
}

export { deepClone };
