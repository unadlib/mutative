import { CreateResult, Draft, Options, Result } from './interface';
import { draftify } from './draftify';
import { dataTypes } from './constant';
import {
  getProxyDraft,
  isDraft,
  isDraftable,
  isEqual,
  revokeProxy,
} from './utils';
import { current, handleReturnValue } from './current';
import { safeReturnValue } from './safeReturn';

/**
 * `create(baseState, callback, options)` to create the next state
 *
 * ## Example
 *
 * ```ts
 * import { create } from '../index';
 *
 * const baseState = { foo: { bar: 'str' }, arr: [] };
 * const state = create(
 *   baseState,
 *   (draft) => {
 *     draft.foo.bar = 'str2';
 *   },
 * );
 *
 * expect(state).toEqual({ foo: { bar: 'str2' }, arr: [] });
 * expect(state).not.toBe(baseState);
 * expect(state.foo).not.toBe(baseState.foo);
 * expect(state.arr).toBe(baseState.arr);
 * ```
 */
function create<
  T extends any,
  F extends boolean = false,
  O extends boolean = false,
  R extends void | Promise<void> | T | Promise<T> = void
>(
  base: T,
  mutate: (draft: Draft<T>) => R,
  options?: Options<O, F>
): CreateResult<T, O, F, R>;
function create<
  T extends any,
  F extends boolean = false,
  O extends boolean = false,
  R extends void | Promise<void> = void
>(
  base: T,
  mutate: (draft: T) => R,
  options?: Options<O, F>
): CreateResult<T, O, F, R>;
function create<
  T extends any,
  P extends any[] = [],
  F extends boolean = false,
  O extends boolean = false,
  R extends void | Promise<void> = void
>(
  mutate: (draft: Draft<T>, ...args: P) => R,
  options?: Options<O, F>
): (base: T, ...args: P) => CreateResult<T, O, F, R>;
function create<
  T extends any,
  O extends boolean = false,
  F extends boolean = false
>(base: T, options?: Options<O, F>): [T, () => Result<T, O, F>];
function create(arg0: any, arg1: any, arg2?: any): any {
  if (typeof arg0 === 'function' && typeof arg1 !== 'function') {
    return function (this: any, base: any, ...args: any[]) {
      return create(
        base,
        (draft: any) => arg0.call(this, draft, ...args),
        arg1
      );
    };
  }
  let base = arg0;
  let mutate = arg1;
  let options = arg2;
  if (typeof arg1 !== 'function') {
    options = arg1;
  }
  if (
    options !== undefined &&
    Object.prototype.toString.call(options) !== '[object Object]'
  ) {
    throw new Error(
      `Invalid options: ${options}, 'options' should be an object.`
    );
  }
  const state = isDraft(base) ? current(base) : base;
  const mark = options?.mark;
  const enablePatches = options?.enablePatches ?? false;
  const strict = options?.strict ?? false;
  const enableAutoFreeze = options?.enableAutoFreeze ?? false;
  const _options = {
    enableAutoFreeze,
    mark,
    strict,
    enablePatches,
  };
  if (
    _options.mark?.(state, dataTypes) === dataTypes.mutable ||
    !isDraftable(state, _options)
  ) {
    const finalization = _options.enablePatches ? [state, [], []] : state;
    if (typeof arg1 !== 'function') {
      return [state, () => finalization];
    }
    const result = mutate(state);
    if (result instanceof Promise) {
      return result.then(() => finalization);
    }
    return finalization;
  }
  const [draft, finalize] = draftify(state, _options);
  if (typeof arg1 !== 'function') {
    return [draft, finalize];
  }
  let result;
  try {
    result = mutate(draft);
  } catch (error) {
    revokeProxy(getProxyDraft(draft)!);
    throw error;
  }
  const returnValue = (value: any) => {
    if (!isDraft(value)) {
      const proxyDraft = getProxyDraft(draft);
      if (!isEqual(value, draft) && proxyDraft?.operated) {
        throw new Error(
          `Either the value is returned as a new non-draft value, or only the draft is modified without returning any value.`
        );
      }
      if (safeReturnValue.length) {
        const _value = safeReturnValue.pop();
        if (typeof _value !== 'undefined') {
          handleReturnValue(value);
        }
        return finalize(_value);
      }
      if (typeof value !== 'undefined') {
        if (_options.strict) {
          handleReturnValue(value, true);
        }
        return finalize(value);
      }
    }
    if (typeof value !== 'undefined' && value !== draft) {
      throw new Error(`The return draft should be the current root draft.`);
    }
    return finalize();
  };
  if (result instanceof Promise) {
    return result.then(returnValue, (error) => {
      revokeProxy(getProxyDraft(draft)!);
      throw error;
    });
  }
  return returnValue(result);
}

export { create };
