import { type Draft, DraftType, type ProxyDraft } from './interface';
import {
  forEach,
  get,
  getProxyDraft,
  getType,
  isBaseMapInstance,
  isBaseSetInstance,
  isDraft,
  isDraftable,
  isEqual,
  latest,
  set,
  shallowCopy,
} from './utils';
import { checksReads } from './unsafe';
import { getSetMap } from './set';
import { die, ErrorCode } from './error';

// Only development builds read `containsDraft`, so production builds keep no
// state for the warnings.
export function handleReturnValue(
  rootDraft: ProxyDraft<any> | undefined,
  value: object,
  useRawReturn?: boolean
) {
  let containsDraft = false;
  // With auto-freeze, the state is frozen, so production builds do not search
  // frozen objects, the returned value included, or the values they hold,
  // which spares searching state built from earlier states. Without it,
  // values are rarely frozen and checking would cost more than it saves.
  const skipsFrozen = !!rootDraft?.options.enableAutoFreeze;
  // `frozen` tells development builds that a skipped object holds `target`.
  const replaceDrafts = (target: object, frozen?: boolean) =>
    forEach(target, (key, item, source) => {
      const proxyDraft = getProxyDraft(item);
      // just handle the draft which is created by the same rootDraft
      if (
        proxyDraft &&
        rootDraft &&
        proxyDraft.finalities === rootDraft.finalities
      ) {
        if (__DEV__ && frozen) {
          throw new Error(
            `The return value holds a draft in a frozen object or in a value it holds. With auto-freeze, production builds do not search frozen objects for drafts, so do not put drafts there.`
          );
        }
        containsDraft = true;
        const currentValue = proxyDraft.original;
        // final update value, but just handle return value
        if (source instanceof Set) {
          const arr = Array.from(source);
          source.clear();
          arr.forEach((_item) =>
            source.add(key === _item ? currentValue : _item)
          );
        } else {
          set(source, key, currentValue);
        }
      } else if (typeof item === 'object' && item !== null) {
        // Development builds search skipped objects too, to report the drafts
        // that production builds would leave there.
        if (!skipsFrozen || !Object.isFrozen(item)) {
          replaceDrafts(item, frozen);
        } else if (__DEV__) {
          replaceDrafts(item, true);
        }
      }
    });
  // The returned value follows the same rule as the values it holds.
  if (!skipsFrozen || !Object.isFrozen(value)) {
    replaceDrafts(value);
  } else if (__DEV__) {
    replaceDrafts(value, true);
  }
  if (__DEV__) {
    if (useRawReturn) {
      if (containsDraft) {
        console.warn(
          `The return value contains drafts, please don't use 'rawReturn()' to wrap the return value.`
        );
      }
    } else if (!containsDraft) {
      console.warn(
        `The return value does not contain any draft, please use 'rawReturn()' to wrap the return value to improve performance.`
      );
    }
  }
}

function getCurrent(target: any): any {
  const proxyDraft = getProxyDraft(target);
  if (!isDraftable(target, proxyDraft?.options)) return target;
  const type = getType(target);
  // The original of a draft can be a draft of an outer create() call, whose
  // current state stands in for it.
  const nested = !!proxyDraft && isDraft(proxyDraft.original);
  if (proxyDraft && !proxyDraft.operated) {
    return nested ? getCurrent(proxyDraft.original) : proxyDraft.original;
  }
  // A changed array draft is copied from its current array, since a copy
  // through the proxy runs two traps per element. In strict mode, outside
  // `unsafe()`, the proxy checks each element it reads, so such arrays are
  // still copied through the proxy.
  const array =
    type === DraftType.Array && proxyDraft && !checksReads(proxyDraft.options)
      ? proxyDraft
      : null;
  let currentValue: any;
  let changed = false;
  function ensureShallowCopy() {
    currentValue =
      type === DraftType.Map
        ? !isBaseMapInstance(target)
          ? new (Object.getPrototypeOf(target).constructor)(target)
          : new Map(target)
        : type === DraftType.Set
          ? proxyDraft
            ? Array.from(getSetMap(proxyDraft).values())
            : Array.from(target as Set<any>)
          : // A draft is copied from its current object, see `shallowCopy`;
            // an array whose reads are not checked is copied as it is.
            shallowCopy(
              array ? latest(array) : target,
              proxyDraft?.options,
              array ? null : proxyDraft
            );
  }

  if (proxyDraft) {
    // It's a proxy draft, let's create a shallow copy eagerly
    proxyDraft.finalized = true;
    try {
      ensureShallowCopy();
    } finally {
      proxyDraft.finalized = false;
    }
  } else if (type === DraftType.Set) {
    // A plain Set is walked as an indexed snapshot so nested drafts can be
    // replaced by position; the Set itself is rebuilt only if that happens.
    ensureShallowCopy();
  } else {
    // It's not a proxy draft, let's use the target directly and let's see
    // lazily if we need to create a shallow copy
    currentValue = target;
  }

  forEach(currentValue, (key, value) => {
    // Every value the recipe places in an array is recorded as assigned, so
    // an object that is neither assigned nor a draft is an element of the base
    // state, which holds no drafts, even after a native method moved it.
    if (
      proxyDraft &&
      ((!nested && isEqual(get(proxyDraft.original, key), value)) ||
        (array &&
          !isDraft(value) &&
          (typeof value !== 'object' ||
            !(array.assignedMap!.size && array.assignedMap!.get(String(key))))))
    ) {
      return;
    }
    const newValue = getCurrent(value);
    if (newValue !== value) {
      changed = true;
      if (currentValue === target) ensureShallowCopy();
      set(currentValue, key, newValue);
    }
  });
  if (type === DraftType.Set) {
    if (!proxyDraft && !changed) return target;
    const value = proxyDraft?.original ?? target;
    return !isBaseSetInstance(value)
      ? new (Object.getPrototypeOf(value).constructor)(currentValue)
      : new Set(currentValue);
  }
  return currentValue;
}

/**
 * `current(draft)` to get current state in the draft mutation function.
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
 * ```
 */
export function current<T extends object>(target: Draft<T>): T;
/** @deprecated You should call current only on `Draft<T>` types. */
export function current<T extends object>(target: T): T;
export function current<T extends object>(target: T | Draft<T>): T {
  if (!isDraft(target)) {
    die(ErrorCode.CurrentOnNonDraft, target);
  }
  return getCurrent(target);
}
