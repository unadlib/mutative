import { ProxyDraft } from './interface';
import { dataTypes, iteratorSymbol } from './constant';
import { internal } from './internal';
import {
  ensureShallowCopy,
  getProxyDraft,
  isDraftable,
  markChanged,
  markFinalization,
} from './utils';
import { checkReadable } from './unsafe';
import { generatePatches } from './patch';

const getNextIterator =
  (
    target: ProxyDraft<any>,
    iterator: IterableIterator<any>,
    { isValuesIterator }: { isValuesIterator: boolean }
  ) =>
  () => {
    const result = iterator.next();
    if (result.done) return result;
    const key = result.value as any;
    let value = target.setMap!.get(key);
    const currentDraft = getProxyDraft(value);
    const mutable =
      target.options.mark?.(value, dataTypes) === dataTypes.mutable;
    if (target.options.strict) {
      checkReadable(key, target.options, mutable);
    }
    if (
      !mutable &&
      !currentDraft &&
      isDraftable(key, target.options) &&
      !target.finalized &&
      target.original!.has(key)
    ) {
      // draft a draftable original set item
      const proxy = internal.createDraft({
        original: key,
        parentDraft: target,
        key,
        finalities: target.finalities,
        options: target.options,
      });
      target.setMap!.set(key, proxy);
      value = proxy;
    } else if (currentDraft) {
      // drafted
      value = currentDraft.proxy;
    }
    return {
      done: false,
      value: isValuesIterator ? value : [value, value],
    };
  };

export const setHandler = {
  get size() {
    const target: ProxyDraft<any> = getProxyDraft(this)!;
    return target.setMap!.size;
  },
  has(value: any) {
    const target = getProxyDraft(this)!;
    // reassigned or non-draftable values
    if (target.setMap!.has(value)) return true;
    ensureShallowCopy(target);
    const valueProxyDraft = getProxyDraft(value)!;
    // drafted
    if (valueProxyDraft && target.setMap!.has(valueProxyDraft.original))
      return true;
    return false;
  },
  add(value: any) {
    const target = getProxyDraft(this)!;
    if (!this.has(value)) {
      ensureShallowCopy(target);
      markChanged(target);
      target.assignedMap!.set(value, true);
      target.setMap!.set(value, value);
      markFinalization(target, value, value, generatePatches);
    }
    return this;
  },
  delete(value: any): boolean {
    if (!this.has(value)) {
      return false;
    }
    const target = getProxyDraft(this)!;
    ensureShallowCopy(target);
    markChanged(target);
    const valueProxyDraft = getProxyDraft(value)!;
    if (valueProxyDraft && target.setMap!.has(valueProxyDraft.original)) {
      // delete drafted
      target.assignedMap!.set(valueProxyDraft.original, false);
      return target.setMap!.delete(valueProxyDraft.original);
    }
    if (!valueProxyDraft && target.setMap!.has(value)) {
      // non-draftable values
      target.assignedMap!.set(value, false);
    } else {
      // reassigned
      target.assignedMap!.delete(value);
    }
    // delete reassigned or non-draftable values
    return target.setMap!.delete(value);
  },
  clear() {
    if (!this.size) return;
    const target = getProxyDraft(this)!;
    ensureShallowCopy(target);
    markChanged(target);
    for (const value of target.original) {
      target.assignedMap!.set(value, false);
    }
    target.setMap!.clear();
  },
  values(): IterableIterator<any> {
    const target = getProxyDraft(this)!;
    ensureShallowCopy(target);
    const iterator = target.setMap!.keys();
    return {
      [Symbol.iterator]: () => this.values(),
      next: getNextIterator(target, iterator, { isValuesIterator: true }),
    };
  },
  entries(): IterableIterator<[any, any]> {
    const target = getProxyDraft(this)!;
    ensureShallowCopy(target);
    const iterator = target.setMap!.keys();
    return {
      [Symbol.iterator]: () => this.entries(),
      next: getNextIterator(target, iterator, {
        isValuesIterator: false,
      }) as () => IteratorReturnResult<any>,
    };
  },
  keys(): IterableIterator<any> {
    return this.values();
  },
  [iteratorSymbol]() {
    return this.values();
  },
  forEach(callback: any, thisArg?: any) {
    const iterator = this.values();
    let result = iterator.next();
    while (!result.done) {
      callback.call(thisArg, result.value, result.value, this);
      result = iterator.next();
    }
  },
};

export const setHandlerKeys = Reflect.ownKeys(setHandler);
