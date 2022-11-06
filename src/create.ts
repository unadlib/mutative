import type { CreateResult, Mutable, Options } from './interface';
import { draftify } from './draftify';
import { dataTypes } from './constant';

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
export function create<
  T extends object,
  F extends boolean = false,
  O extends boolean = false,
  R extends void | Promise<void> = void
>(state: T, mutate: (draft: Mutable<T>) => R, options?: Options<O, F>) {
  if (options?.mark?.(state, dataTypes) === dataTypes.mutable) {
    const result = mutate(state as Mutable<T>);
    const finalization = options?.enablePatches ? [state, [], []] : state;
    if (result instanceof Promise) {
      return result.then(() => finalization) as CreateResult<T, O, F, R>;
    }
    return finalization as CreateResult<T, O, F, R>;
  }
  const [draft, finalize] = draftify(state, options);
  const result = mutate(draft as Mutable<T>);
  if (result instanceof Promise) {
    return result.then(finalize) as CreateResult<T, O, F, R>;
  } else if (typeof result !== 'undefined') {
    throw new Error(`The create() callback must return 'void' or 'Promise<void>'.`);
  }
  return finalize() as CreateResult<T, O, F, R>;
}
