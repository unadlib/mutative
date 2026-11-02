import {
  type Draft,
  DraftType,
  type Options,
  type ProxyDraft,
} from './interface';
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
  isFreezable,
  iterateSet,
  latest,
  set,
  setItemValue,
  shallowCopy,
} from './utils';
import { checksReads } from './unsafe';
import { die, ErrorCode } from './error';

// Only development builds read `containsDraft`, so production builds keep no
// state for the warnings.
export function handleReturnValue(
  rootDraft: ProxyDraft<any> | undefined,
  value: object,
  useRawReturn?: boolean
) {
  let containsDraft = false;
  const options = rootDraft?.options;
  // With auto-freeze, the state is frozen, so production builds do not search
  // frozen objects, the returned value included, or the values they hold,
  // which spares searching state built from earlier states. Nor do they search
  // the objects that auto-freeze leaves unfrozen, such as class instances,
  // which would otherwise be searched again in every update. Without it,
  // values are rarely frozen and checking would cost more than it saves.
  const isSkipped = (target: object) =>
    !!options?.enableAutoFreeze &&
    (Object.isFrozen(target) || !isFreezable(target, options.mark));
  // Development builds search the skipped objects too, to report the drafts
  // that production builds would leave there, and each of them once, as an
  // object that auto-freeze leaves unfrozen may hold itself.
  const searched = __DEV__ ? new WeakSet<object>() : undefined;
  // `skipped` tells development builds that a skipped object holds `target`.
  // The elements of an ArrayBuffer view are numbers, and listing them as keys
  // costs time in proportion to its bytes, so views are not searched.
  const replaceDrafts = (target: object, skipped?: boolean) =>
    !ArrayBuffer.isView(target) &&
    forEach(target, (key, item, source) => {
      const proxyDraft = getProxyDraft(item);
      // just handle the draft which is created by the same rootDraft
      if (
        proxyDraft &&
        rootDraft &&
        proxyDraft.finalities === rootDraft.finalities
      ) {
        if (__DEV__ && skipped) {
          throw new Error(
            `The return value holds a draft in a frozen object, in an object that auto-freeze leaves unfrozen, such as a class instance, or in a value they hold. With auto-freeze, production builds do not search those objects for drafts, so do not put drafts there.`
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
        if (!skipped && !isSkipped(item)) {
          replaceDrafts(item);
        } else if (__DEV__ && !searched!.has(item)) {
          searched!.add(item);
          replaceDrafts(item, true);
        }
      }
    });
  // The returned value follows the same rule as the values it holds.
  if (!isSkipped(value)) {
    replaceDrafts(value);
  } else if (__DEV__) {
    searched!.add(value);
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

function getCurrent(target: any, rootOptions?: Options<any, any>) {
  const proxyDraft = getProxyDraft(target);
  // Values assigned in the recipe are no drafts; the options of the draft
  // above them decide whether a mark makes them draftable.
  const options = proxyDraft ? proxyDraft.options : rootOptions;
  if (!isDraftable(target, options)) return target;
  const type = getType(target);
  if (proxyDraft && !proxyDraft.operated) return proxyDraft.original;
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
            ? // The items in order, with the drafts that stand for some.
              Array.from(iterateSet(latest(proxyDraft)), (item) =>
                setItemValue(proxyDraft, item)
              )
            : Array.from(target as Set<any>)
          : shallowCopy(array ? latest(array) : target, options);
  }

  if (proxyDraft) {
    // It's a proxy draft, let's create a shallow copy eagerly
    // Restore the flag instead of clearing it: current() must not unfinalize
    // a draft, which would let reads through it create drafts again and let
    // it generate its patches twice.
    const finalized = proxyDraft.finalized;
    proxyDraft.finalized = true;
    try {
      ensureShallowCopy();
    } finally {
      proxyDraft.finalized = finalized;
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
      (isEqual(get(proxyDraft.original, key), value) ||
        (array &&
          !isDraft(value) &&
          (typeof value !== 'object' ||
            !(array.assignedMap!.size && array.assignedMap!.get(String(key))))))
    ) {
      return;
    }
    const newValue = getCurrent(value, options);
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
 * import { create, current } from 'mutative';
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
