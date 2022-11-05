import { dataTypes, iteratorSymbol } from './constant';
import { createDraft } from './draft';
import {
  ensureShallowCopy,
  getProxyDraft,
  isDraftable,
  isEqual,
  latest,
  markChanged,
  markSetValue,
} from './utils';

export const mapHandler = {
  get size() {
    return latest(getProxyDraft(this)!).size;
  },
  has(key: any): boolean {
    return latest(getProxyDraft(this)!).has(key);
  },
  set(key: any, value: any) {
    const target = getProxyDraft(this)!;
    const source = latest(target);
    if (!source.has(key) || !isEqual(source.get(key), value)) {
      ensureShallowCopy(target);
      markChanged(target);
      target.copy.set(key, value);
      target.assignedMap.set(key, true);
      markSetValue(target, key, value);
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
      target.assignedMap.set(key, false);
    } else {
      target.assignedMap.delete(key);
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
    target.copy.clear();
  },
  forEach(callback: (value: any, key: any, self: any) => void, thisArg?: any) {
    const target = getProxyDraft(this)!;
    latest(target).forEach((_value: any, _key: any, _map: any) => {
      callback.call(thisArg, this.get(_key), _key, this);
    });
  },
  get(key: any): any {
    const target = getProxyDraft(this)!;
    const value = latest(target).get(key);
    if (target.marker?.(value, dataTypes) === dataTypes.mutable) {
      return value;
    }
    if (target.finalized || !isDraftable(value)) {
      return value;
    }
    // drafted or reassigned
    if (value !== target.original.get(key)) {
      return value;
    }
    const draft = createDraft({
      original: value,
      parentDraft: target,
      key,
      finalities: target.finalities,
      marker: target.marker,
    });
    ensureShallowCopy(target);
    target.copy!.set(key, draft);
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
        if (result.done) return result;
        const value = this.get(result.value);
        return {
          done: false,
          value,
        };
      },
    };
  },
  entries(): IterableIterator<[any, any]> {
    const iterator = this.keys();
    return {
      [iteratorSymbol]: () => this.entries(),
      next: () => {
        const result = iterator.next();
        if (result.done) return result;
        const value = this.get(result.value);
        return {
          done: false,
          value: [result.value, value],
        };
      },
    };
  },
  [iteratorSymbol]() {
    return this.entries();
  },
};

export const mapHandlerKeys = Reflect.ownKeys(mapHandler);
