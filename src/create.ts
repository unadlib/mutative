import type { CreateResult, Draft, Options, Result } from './interface';
import { draftify } from './draftify';
import { dataTypes } from './constant';
import { getProxyDraft, isDraft, revokeProxy } from './utils';
import { current } from './current';

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
  T extends object,
  F extends boolean = false,
  O extends boolean = false,
  R extends void | Promise<void> = void
>(
  base: T,
  mutate: (draft: Draft<T>) => R,
  options?: Options<O, F>
): CreateResult<T, O, F, R>;
function create<
  T extends object,
  F extends boolean = false,
  O extends boolean = false,
  R extends void | Promise<void> = void
>(
  base: T,
  mutate: (draft: T) => R,
  options?: Options<O, F>
): CreateResult<T, O, F, R>;
function create<
  T extends object,
  P extends any[] = [],
  F extends boolean = false,
  O extends boolean = false,
  R extends void | Promise<void> = void
>(
  mutate: (draft: Draft<T>, ...args: P) => R,
  options?: Options<O, F>
): (base: T, ...args: P) => CreateResult<T, O, F, R>;
function create<
  T extends object,
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
  if (options !== undefined && toString.call(options) !== '[object Object]') {
    throw new Error(
      `Invalid options: ${options}, 'options' should be an object.`
    );
  }
  const state = isDraft(base) ? current(base) : base;
  if (options?.mark?.(state, dataTypes) === dataTypes.mutable) {
    const finalization = options?.enablePatches ? [state, [], []] : state;
    if (typeof arg1 !== 'function') {
      return [state, () => finalization];
    }
    const result = mutate(state);
    if (result instanceof Promise) {
      return result.then(() => finalization);
    }
    return finalization;
  }
  const [draft, finalize] = draftify(state, options);
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
  if (result instanceof Promise) {
    return result.then(finalize, (error) => {
      revokeProxy(getProxyDraft(draft)!);
      throw error;
    });
  }
  if (result !== undefined) {
    throw new Error(
      `The create() callback must return 'void' or 'Promise<void>'.`
    );
  }
  return finalize();
}

export { create };
