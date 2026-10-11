import type { ProxyDraft } from './interface';
import { dataTypes, iteratorPrototype, iteratorSymbol } from './constant';
import { internal } from './internal';
import { checkReadable } from './unsafe';
import {
  assertDraftActive,
  ensureShallowCopy,
  getProxyDraft,
  isDraftable,
  isEqual,
  latest,
  markChanged,
  markFinalization,
} from './utils';

// The value at `key` as `get()` returns it: a draft of a draftable value of
// the original Map. Iteration calls this with the draft state it looked up
// once, instead of calling `get()` through the proxy, which binds a new
// function for every entry.
function getEntry(target: ProxyDraft, key: any) {
  const value = latest(target).get(key);
  const mutable = target.options.mark?.(value, dataTypes) === dataTypes.mutable;
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
  const draft = internal.createDraft(
    value,
    target,
    key,
    target.finalities,
    target.options
  );
  ensureShallowCopy(target);
  target.copy.set(key, draft);
  return draft;
}

export const mapHandler = {
  get size() {
    const current: Map<any, any> = latest(getProxyDraft(this)!);
    return current.size;
  },
  has(key: any): boolean {
    return latest(getProxyDraft(this)!).has(key);
  },
  set(key: any, value: any) {
    // Map keys are used as they are, and a draft is revoked when its producer
    // ends, so a Map would keep a key that throws when it is read.
    if (__DEV__ && getProxyDraft(key)) {
      throw new Error(
        `A draft cannot be a Map key: its producer revokes it when it ends. Use original(key), current(key) or an id as the key; see https://mutative.js.org/docs/extra-topics/faq`
      );
    }
    const target = getProxyDraft(this)!;
    const source = latest(target);
    if (!source.has(key) || !isEqual(source.get(key), value)) {
      ensureShallowCopy(target);
      markChanged(target);
      target.assignedMap!.set(key, true);
      target.copy.set(key, value);
      markFinalization(target, key, value);
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
    latest(target).forEach((_value: any, key: any) => {
      assertDraftActive(target);
      callback.call(thisArg, getEntry(target, key), key, this);
    });
  },
  get(key: any): any {
    return getEntry(getProxyDraft(this)!, key);
  },
  keys(): IterableIterator<any> {
    return latest(getProxyDraft(this)!).keys();
  },
  values(): IterableIterator<any> {
    const target = getProxyDraft(this)!;
    const iterator = this.keys();
    return {
      __proto__: iteratorPrototype,
      next: () => {
        const result = iterator.next();
        if (result.done) return result;
        assertDraftActive(target);
        return {
          done: false,
          value: getEntry(target, result.value),
        };
      },
    } as any;
  },
  entries(): IterableIterator<[any, any]> {
    const target = getProxyDraft(this)!;
    const iterator = this.keys();
    return {
      __proto__: iteratorPrototype,
      next: () => {
        const result = iterator.next();
        if (result.done) return result;
        assertDraftActive(target);
        return {
          done: false,
          value: [result.value, getEntry(target, result.value)],
        };
      },
    } as any;
  },
  [iteratorSymbol]() {
    return this.entries();
  },
};

export const mapHandlerKeys = Reflect.ownKeys(mapHandler);
