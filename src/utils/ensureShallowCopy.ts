import type { ProxyDraft } from '../interface';

export function ensureShallowCopy(target: ProxyDraft) {
  if (target.copy) return;
  if (Array.isArray(target.original)) {
    target.copy = Array.prototype.concat.call(target.original);
  } else if (target.original instanceof Set) {
    target.copy = new Set(target.original.values());
    // for collection of changing set data
    target.setMap = new Map();
  } else if (target.original instanceof Map) {
    target.copy = new Map(target.original.entries());
  } else if (
    typeof target.original === 'object' &&
    Object.getPrototypeOf(target.original) === Object.prototype
  ) {
    // For best performance with shallow copies,
    // don't use `Object.create(Object.getPrototypeOf(obj), Object.getOwnPropertyDescriptors(obj));`.
    target.copy = {};
    Object.keys(target.original).forEach((key) => {
      target.copy![key] = target.original[key];
    });
  } else {
    throw new Error(
      `Unsupported type: ${target.original}, only regular objects, arrays, Set and Map are supported`
    );
  }
}
