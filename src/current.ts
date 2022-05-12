import { getProxyDraft, isPlainObject } from './utils';

/**
 * `current(draft)` to get current state
 *
 * ## Example
 *
 * ```ts
 * import { create, current } from '../index';
 *
 * const baseState = { foo: { bar: 'str' }, arr: [] };
 * const state = create(
 *   baseState,
 *   (draft) => {
 *     draft.foo.bar = 'str2';
 *     expect(current(draft.foo)).toEqual({ bar: 'str2' });
 *   },
 * );
 */
export function current<T extends object>(target: T): T {
  const proxyDraft = getProxyDraft(target);
  if (proxyDraft) {
    if (!proxyDraft.copy) return proxyDraft.original;
    if (Array.isArray(proxyDraft.copy)) {
      const value = Array.prototype.concat.call(proxyDraft.copy);
      value.forEach((item, index) => {
        if (getProxyDraft(item)) {
          value[index] = current(item);
        }
      });
      return value as T;
    } else if (proxyDraft.copy instanceof Set) {
      const elements: any[] = [];
      proxyDraft.copy.forEach((item) => {
        let value: any = item;
        if (proxyDraft.setMap!.has(item)) {
          value = proxyDraft.setMap!.get(item)!.proxy;
        }
        elements.push(current(value));
      });
      return new Set(elements) as T;
    } else if (proxyDraft.copy instanceof Map) {
      const elements: [any, any][] = [];
      proxyDraft.copy.forEach((value, key) => {
        elements.push([key, current(value)]);
      });
      return new Map(elements) as T;
    } else if (isPlainObject(proxyDraft.copy)) {
      // For best performance with shallow copies,
      // don't use `Object.create(Object.getPrototypeOf(obj), Object.getOwnPropertyDescriptors(obj));`.
      const copy: Record<string | symbol, any> = {};
      const draftCopy = proxyDraft.copy;
      Object.keys(draftCopy).forEach((key) => {
        const value = draftCopy[key];
        copy![key] = current(value);
      });
      return copy as T;
    } else {
      throw new Error(
        `Unsupported type: ${proxyDraft.copy}, only regular objects, arrays, Set and Map are supported`
      );
    }
  }
  return target;
}
