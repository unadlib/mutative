import { ProxyDraft } from './interface';
import { dataTypes, iteratorPrototype, iteratorSymbol } from './constant';
import { internal } from './internal';
import {
  assertDraftActive,
  ensureShallowCopy,
  getProxyDraft,
  isDraftable,
  markChanged,
  markFinalization,
  checkReadable,
  unsafe,
} from './utils';

/**
 * The item mapping of a Set draft. Reads that leave the Set unchanged, such
 * as `has` and `size`, answer from the original instead of building it. The
 * original of a Set draft of an outer create() call is that call's draft,
 * whose iterator checks reads in strict mode; this read is not the recipe's.
 */
export function getSetMap(target: ProxyDraft<any>): Map<any, any> {
  return (target.setMap ??= unsafe(() => new Map(target.original.entries())));
}

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
    let value = target.setMap!.get(key);
    const currentDraft = getProxyDraft(value);
    const mutable =
      target.options.mark?.(value, dataTypes) === dataTypes.mutable;
    if (target.options.strict) {
      checkReadable(key, target.options, mutable);
    }
    // Only an original item still mapped to itself needs a draft, also when it
    // is a draft of an outer create() call. Preserve copies when this mapping
    // has already been finalized.
    if (
      !mutable &&
      (!currentDraft || currentDraft.finalities !== target.finalities) &&
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
    return (target.setMap ?? target.original).size;
  },
  has(value: any) {
    const target = getProxyDraft(this)!;
    const items: Map<any, any> | Set<any> = target.setMap ?? target.original;
    // reassigned or non-draftable values
    if (items.has(value)) return true;
    const valueProxyDraft = getProxyDraft(value)!;
    // drafted
    if (valueProxyDraft && items.has(valueProxyDraft.original)) return true;
    return false;
  },
  add(value: any) {
    const target = getProxyDraft(this)!;
    if (!this.has(value)) {
      ensureShallowCopy(target);
      markChanged(target);
      target.assignedMap!.set(value, true);
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
    const setMap = getSetMap(target);
    const valueProxyDraft = getProxyDraft(value)!;
    if (valueProxyDraft && setMap.has(valueProxyDraft.original)) {
      // delete drafted
      target.assignedMap!.set(valueProxyDraft.original, false);
      return setMap.delete(valueProxyDraft.original);
    }
    // The items of a Set draft whose original is a draft of an outer
    // create() call are drafts of that call, and are deleted like original
    // items.
    if (setMap.has(value) && (!valueProxyDraft || target.original.has(value))) {
      // non-draftable values
      target.assignedMap!.set(value, false);
    } else {
      // reassigned
      target.assignedMap!.delete(value);
    }
    // delete reassigned or non-draftable values
    return setMap.delete(value);
  },
  clear() {
    if (!this.size) return;
    const target = getProxyDraft(this)!;
    ensureShallowCopy(target);
    markChanged(target);
    for (const value of target.original) {
      target.assignedMap!.set(value, false);
    }
    getSetMap(target).clear();
  },
  values(): IterableIterator<any> {
    const target = getProxyDraft(this)!;
    ensureShallowCopy(target);
    const iterator = getSetMap(target).keys();
    return {
      __proto__: iteratorPrototype,
      next: getNextIterator(target, iterator, true),
    } as any;
  },
  entries(): IterableIterator<[any, any]> {
    const target = getProxyDraft(this)!;
    ensureShallowCopy(target);
    const iterator = getSetMap(target).keys();
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
