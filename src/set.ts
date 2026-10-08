import { ProxyDraft } from './interface';
import { dataTypes, iteratorPrototype, iteratorSymbol } from './constant';
import { internal } from './internal';
import {
  assertDraftActive,
  ensureShallowCopy,
  getProxyDraft,
  getSetMap,
  isDraftable,
  latest,
  markChanged,
  markFinalization,
  setItemValue,
} from './utils';
import { checkReadable } from './unsafe';

// A Set draft adds and deletes items in its copy, which holds the items in
// order. `setMap` maps the original items that an iterator drafted to their
// drafts, and the objects that the recipe added, drafts among them, to
// themselves. Finalization replaces the drafts with their final values.

const getNextIterator =
  (
    target: ProxyDraft<any>,
    iterator: IterableIterator<any>,
    isValuesIterator: boolean
  ) =>
  () => {
    const result = iterator.next();
    if (result.done) return result;
    assertDraftActive(target);
    const key = result.value as any;
    let value = setItemValue(target, key);
    const currentDraft = getProxyDraft(value);
    const mutable =
      target.options.mark?.(value, dataTypes) === dataTypes.mutable;
    if (target.options.strict) {
      checkReadable(key, target.options, mutable);
    }
    // Only an original item still mapped to itself needs a draft. Preserve
    // copies when this mapping has already been finalized.
    if (
      !mutable &&
      !currentDraft &&
      value === key &&
      isDraftable(key, target.options) &&
      !target.finalized &&
      target.original!.has(key)
    ) {
      // draft a draftable original set item
      const proxy = internal.createDraft(
        key,
        target,
        key,
        target.finalities,
        target.options
      );
      getSetMap(target).set(key, proxy);
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
    return latest(getProxyDraft(this)!).size;
  },
  has(value: any) {
    const items: Set<any> = latest(getProxyDraft(this)!);
    const valueProxyDraft = getProxyDraft(value);
    // The value itself, or the item that a draft of it stands for.
    return (
      items.has(value) ||
      (!!valueProxyDraft && items.has(valueProxyDraft.original))
    );
  },
  add(value: any) {
    const target = getProxyDraft(this)!;
    if (!this.has(value)) {
      ensureShallowCopy(target);
      markChanged(target);
      target.assignedMap!.set(value, true);
      target.copy!.add(value);
      // An added draft is replaced by its final value when finalizing, and an
      // added object is finalized for the drafts it may hold.
      if (value && typeof value === 'object')
        getSetMap(target).set(value, value);
      markFinalization(target, value, value);
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
    const copy: Set<any> = target.copy!;
    const valueProxyDraft = getProxyDraft(value);
    // A draft of an item stands for the item; an added draft is an item.
    const item =
      valueProxyDraft && copy.has(valueProxyDraft.original)
        ? valueProxyDraft.original
        : value;
    if (valueProxyDraft && item === value) {
      // reassigned
      target.assignedMap!.delete(value);
    } else {
      target.assignedMap!.set(item, false);
    }
    if (target.setMap) target.setMap.delete(item);
    return copy.delete(item);
  },
  clear() {
    if (!this.size) return;
    const target = getProxyDraft(this)!;
    ensureShallowCopy(target);
    markChanged(target);
    for (const value of target.original) {
      target.assignedMap!.set(value, false);
    }
    if (target.setMap) target.setMap.clear();
    target.copy!.clear();
  },
  values(): IterableIterator<any> {
    const target = getProxyDraft(this)!;
    ensureShallowCopy(target);
    const iterator = target.copy!.values();
    return {
      __proto__: iteratorPrototype,
      next: getNextIterator(target, iterator, true),
    } as any;
  },
  entries(): IterableIterator<[any, any]> {
    const target = getProxyDraft(this)!;
    ensureShallowCopy(target);
    const iterator = target.copy!.values();
    return {
      __proto__: iteratorPrototype,
      next: getNextIterator(
        target,
        iterator,
        false
      ) as () => IteratorReturnResult<any>,
    } as any;
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

if ('difference' in Set.prototype) {
  // for compatibility with new Set methods
  // https://github.com/tc39/proposal-set-methods
  // And `https://github.com/tc39/proposal-set-methods/blob/main/details.md#symbolspecies` has some details about the `@@species` symbol.
  // So we can't use SubSet instance constructor to get the constructor of the SubSet instance.
  (
    [
      'intersection',
      'union',
      'difference',
      'symmetricDifference',
      'isSubsetOf',
      'isSupersetOf',
      'isDisjointFrom',
    ] as const
  ).forEach((method) => {
    (setHandler as any)[method] = function (
      this: Set<any>,
      other: ReadonlySetLike<any>
    ) {
      return (Set.prototype[method] as Function).call(
        new Set(this.values()),
        other
      );
    };
  });
}

export const setHandlerKeys = Reflect.ownKeys(setHandler);
