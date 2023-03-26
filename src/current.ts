import { DraftType, ProxyDraft } from './interface';
import {
  forEach,
  get,
  getProxyDraft,
  getType,
  isDraft,
  isDraftable,
  isEqual,
  set,
  shallowCopy,
} from './utils';

export function handleReturnValue<T extends object>(
  rootDraft: ProxyDraft<any> | undefined,
  value: T,
  warning = false
) {
  let isContainDraft = false;
  forEach(value, (key, item, source) => {
    const proxyDraft = getProxyDraft(item);
    // just handle the draft which is created by the same rootDraft
    if (proxyDraft && proxyDraft?.finalities === rootDraft?.finalities) {
      isContainDraft = true;
      if (__DEV__ && warning) {
        console.warn(
          `The return value contains drafts, please don't use 'rawReturn()' to wrap the return value.`
        );
      }
      const currentValue = proxyDraft.original;
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
      handleReturnValue(rootDraft, item, warning);
    }
  });
  if (__DEV__ && warning && !isContainDraft) {
    console.warn(
      `The return value does not contain any draft, please use 'rawReturn()' to wrap the return value to improve performance.`
    );
  }
}

function getCurrent(target: any) {
  const proxyDraft = getProxyDraft(target);
  if (!isDraftable(target, proxyDraft?.options)) return target;
  const type = getType(target);
  if (proxyDraft && !proxyDraft.operated) return proxyDraft.original;
  if (proxyDraft) proxyDraft.finalized = true;
  let currentValue: any;
  try {
    currentValue =
      type === DraftType.Map
        ? new Map(target)
        : type === DraftType.Set
        ? Array.from(proxyDraft!.setMap!.values()!)
        : shallowCopy(target, proxyDraft?.options);
  } finally {
    if (proxyDraft) proxyDraft.finalized = false;
  }
  forEach(currentValue, (key, value) => {
    if (proxyDraft && isEqual(get(proxyDraft.original, key), value)) return;
    set(currentValue, key, getCurrent(value));
  });
  return type === DraftType.Set ? new Set(currentValue) : currentValue;
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
export function current<T extends object>(target: T): T {
  if (!isDraft(target)) {
    throw new Error(`current() is only used for Draft, parameter: ${target}`);
  }
  return getCurrent(target);
}
