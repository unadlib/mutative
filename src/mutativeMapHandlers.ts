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
    // TODO remove unused code?
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
    const target = getProxyDraft(this)!;
    latest(target).forEach((_value: any, _key: any) => {
      callback.call(thisArg, this.get(_key), _key, this);
    });
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
  [iteratorSymbol]() {
    return this.entries();
  },
};

export const mutativeMapHandlerKeys = Reflect.ownKeys(mutativeMapHandler);
