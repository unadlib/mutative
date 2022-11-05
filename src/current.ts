import { getProxyDraft } from './utils';

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
      proxyDraft.copy.forEach((item) => {
        let value: any = item;
        if (proxyDraft.setMap!.has(item)) {
          value = proxyDraft.setMap!.get(item)!.proxy;
        }
        elements.push(getProxyDraft(value) ? current(value) : value);
      });
      return new Set(elements);
    } else if (proxyDraft.copy instanceof Map) {
      const elements: [any, any][] = [];
      proxyDraft.copy.forEach((value, key) => {
        elements.push([key, getProxyDraft(value) ? current(value) : value]);
      });
      return new Map(elements);
    } else if (
      typeof proxyDraft.copy === 'object' &&
      Object.getPrototypeOf(proxyDraft.copy) === Object.prototype
    ) {
      // For best performance with shallow copies,
      // don't use `Object.create(Object.getPrototypeOf(obj), Object.getOwnPropertyDescriptors(obj));`.
      const copy: Record<string | symbol, any> = {};
      const draftCopy = proxyDraft.copy;
      Object.keys(draftCopy).forEach((key) => {
        const value = draftCopy[key];
        copy![key] = getProxyDraft(value) ? current(value) : value;
      });
      return copy;
    } else {
      throw new Error(
        `Unsupported type: ${proxyDraft.copy}, only regular objects, arrays, Set and Map are supported`
      );
    }
  }
  return target;
}
