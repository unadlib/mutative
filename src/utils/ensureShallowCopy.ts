import type { ProxyDraft } from '../interface';

export function ensureShallowCopy(target: ProxyDraft) {
  if (target.copy) return;
  const { Record, Tuple } = globalThis;
  if (Record && target.original instanceof Record) {
    target.copy = {};
    Object.keys(target.original).forEach((key) => {
      target.copy![key] = target.original[key];
    });
  } else if (Tuple && target.original instanceof Tuple) {
    target.copy = Array.prototype.concat.call(Array.from(target.original));
  } else if (Array.isArray(target.original)) {
    target.copy = Array.prototype.concat.call(target.original);
  } else if (target.original instanceof Set) {
    target.copy = new Set(target.original.values());
    target.setMap = new Map();
  } else if (target.original instanceof Map) {
    target.copy = new Map(target.original.entries());
  } else {
    // For best performance with shallow copies,
    // don't use `Object.create(Object.getPrototypeOf(obj), Object.getOwnPropertyDescriptors(obj));`.
    target.copy = {};
    Object.keys(target.original).forEach((key) => {
      target.copy![key] = target.original[key];
    });
  }
}
