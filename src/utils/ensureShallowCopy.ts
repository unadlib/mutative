import type { ProxyDraft } from '../interface';

function shallowCopy(original: any) {
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
  } else {
    throw new Error(
      `Unsupported type: ${original}, only regular objects, arrays, Set and Map are supported`
    );
  }
}

export function ensureShallowCopy(target: ProxyDraft) {
  if (target.copy) return;
  target.copy = shallowCopy(target.original)!;
  if (target.original instanceof Set) {
    // for collection of changing set data
    target.setMap = new Map();
  }
}
