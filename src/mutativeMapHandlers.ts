import { dataTypes, iteratorSymbol } from './constant';
import { internal } from './internal';
import { generatePatches } from './patch';
import { checkReadable } from './unsafe';
import {
  ensureShallowCopy,
  getProxyDraft,
  isDraftable,
  latest,
  markChanged,
  markFinalization,
} from './utils';
import { objectIs } from './generic-utils/equality';
import { MutativeMap } from './MutativeMap';

// TODO [MutativeMap] [refactoring] ended up being basically an exact copy of mapHandlers, so code could be deduplicated. But additional methods to optimize performance could be added here.
export const mutativeMapHandler = {
  get size() {
    const current: MutativeMap<any, any> = latest(getProxyDraft(this)!);
    return current.size;
  },
  has(key: any): boolean {
    return latest(getProxyDraft(this)!).has(key);
  },
  set(key: any, value: any) {
    const target = getProxyDraft(this)!;
    const source = latest(target);
    if (!source.has(key) || !objectIs(source.get(key), value)) {
      ensureShallowCopy(target);
      markChanged(target);
      target.assignedMap!.set(key, true);
      target.copy.set(key, value);
      markFinalization(target, key, value, generatePatches);
    }
    return this;
  },
  delete(key: any): boolean {
    if (!this.has(key)) {
      return false;
    }
    const target = getProxyDraft(this)!;
    ensureShallowCopy(target);
    markChanged(target);
    if (target.original.has(key)) {
      target.assignedMap!.set(key, false);
    } else {
      target.assignedMap!.delete(key);
    }
    target.copy.delete(key);
    return true;
  },
  clear() {
    const target = getProxyDraft(this)!;
    if (!this.size) return;
    ensureShallowCopy(target);
    markChanged(target);
    target.assignedMap = new Map();
    for (const [key] of target.original) {
      target.assignedMap.set(key, false);
    }
    target.copy!.clear();
  },
  forEach(callback: (value: any, key: any, self: any) => void, thisArg?: any) {
    const keys = this.keysArray(); // get as array to make sure that modifications due to creating drafts do not lead to the same key being iterated over multiple times
    for (const key of keys) {
      callback.call(thisArg, this.get(key), key, this);
    }
  },
  get(key: any): any {
    const target = getProxyDraft(this)!;
    const value = latest(target).get(key);
    const mutable =
      target.options.mark?.(value, dataTypes) === dataTypes.mutable;
    if (target.options.strict) {
      checkReadable(value, target.options, mutable);
    }
    if (mutable) {
      return value;
    }
    if (target.finalized || !isDraftable(value, target.options)) {
      return value;
    }
    // drafted or reassigned
    if (value !== target.original.get(key)) {
      return value;
    }
    const draft = internal.createDraft({
      original: value,
      parentDraft: target,
      key,
      finalities: target.finalities,
      options: target.options,
    });
    ensureShallowCopy(target);
    target.copy.set(key, draft);
    return draft;
  },
  keys(): IterableIterator<any> {
    return latest(getProxyDraft(this)!).keys();
  },
  keysArray(): any[] {
    // TODO [MutativeMap] [bug] iteration order changes when calling .values() because of creating drafts. So if calling .values() again, the order is different but stays stable starting then. Fix by just returning patchData keys/entries first?
    return latest(getProxyDraft(this)!).keysArray();
  },
  values(): IterableIterator<any> {
    const iterator = this.keys();
    return {
      [iteratorSymbol]: () => this.values(),
      next: () => {
        const result = iterator.next();
        const value = this.get(result.value);
        return {
          done: result.done,
          value,
        };
      },
    } as any;
  },
  // values(): IterableIterator<any> {
  //   const keys = this.keysArray(); // get as array to make sure that modifications due to creating drafts do not lead to the same key being iterated over multiple times
  //   let nextIndex = 0;
  //   return {
  //     [iteratorSymbol]: () => this.values(),
  //     next: () => {
  //       if (nextIndex >= keys.length) {
  //         return { done: true };
  //       }
  //       const key = keys[nextIndex++];
  //       const value = this.get(key);
  //       return {
  //         done: false,
  //         value,
  //       };
  //     },
  //   } as any;
  // },
  valuesArray(): any[] {
    // TODO [MutativeMap] [performance] could probably be optimized just like non-draft fn
    return Array.from(this.values());
  },
  entries(): IterableIterator<[any, any]> {
    const iterator = this.keys();
    return {
      [iteratorSymbol]: () => this.entries(),
      next: () => {
        const result = iterator.next();
        const value = this.get(result.value);
        return {
          done: result.done,
          value: [result.value, value],
        };
      },
    } as any;
  },
  // entries(): IterableIterator<[any, any]> {
  //   const keys = this.keysArray(); // get as array to make sure that modifications due to creating drafts do not lead to the same key being iterated over multiple times
  //   let nextIndex = 0;
  //   return {
  //     [iteratorSymbol]: () => this.entries(),
  //     next: () => {
  //       if (nextIndex >= keys.length) {
  //         return { done: true };
  //       }
  //       const key = keys[nextIndex++];
  //       const value = this.get(key);
  //       return {
  //         done: false,
  //         value: [key, value],
  //       };
  //     },
  //   } as any;
  // },
  entriesArray(): [any, any][] {
    // TODO [MutativeMap] [performance] could probably be optimized just like non-draft fn
    return Array.from(this.entries());
  },
  mapValues<ResultValue>(
    fn: (value: any, key: any) => ResultValue
  ): ResultValue[] {
    return Array.from(this.entries(), ([key, value]) => fn(value, key));
  },
  [iteratorSymbol]() {
    return this.entries();
  },
};

export const mutativeMapHandlerKeys = Reflect.ownKeys(mutativeMapHandler);
