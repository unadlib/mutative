import { DraftType } from './interface';
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
