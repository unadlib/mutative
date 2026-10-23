import { makeCreator } from './makeCreator';

/**
 * `create(baseState, callback, options)` to create the next state
 *
 * ## Example
 *
 * ```ts
 * import { create } from 'mutative';
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
const create = /* @__PURE__ */ makeCreator();

export { create };
