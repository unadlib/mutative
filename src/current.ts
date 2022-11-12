import { dataTypes } from './constant';
import { getProxyDraft, shallowCopy } from './utils';

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
// TODO: refactor
export function current<T extends object>(target: T): any {
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
      return value;
    } else if (proxyDraft.copy instanceof Set) {
      const elements: any[] = [];
      proxyDraft.setMap!.forEach((item) => {
        elements.push(getProxyDraft(item) ? current(item) : item);
      });
      return new Set(elements);
    } else if (proxyDraft.copy instanceof Map) {
      const elements: [any, any][] = [];
      proxyDraft.copy.forEach((value, key) => {
        elements.push([key, getProxyDraft(value) ? current(value) : value]);
      });
      return new Map(elements);
    } else if (typeof proxyDraft.copy === 'object') {
      // For best performance with shallow copies,
      // don't use `Object.create(Object.getPrototypeOf(obj), Object.getOwnPropertyDescriptors(obj));`.
      const copy: Record<string | symbol, any> = shallowCopy(
        proxyDraft.copy,
        proxyDraft.marker
          ? () =>
              proxyDraft.marker!(proxyDraft.original, dataTypes) ===
              dataTypes.immutable
          : undefined
      );
      const draftCopy = proxyDraft.copy;
      Object.keys(draftCopy).forEach((key) => {
        const value = draftCopy[key];
        copy![key] = getProxyDraft(value) ? current(value) : value;
        Object.keys(copy![key]).forEach((_key) => {
          const _value = copy![key][_key];
          if (getProxyDraft(_value)) {
            copy![key][_key] = current(_value);
          }
        });
      });
      return copy;
    } else {
      throw new Error(
        `current() is only used for Draft, parameter: ${proxyDraft.copy}`
      );
    }
  } else {
    throw new Error(`current() is only used for Draft, parameter: ${target}`);
  }
}
