import { RAW_RETURN_SYMBOL } from './constant';

/**
 * Use rawReturn() to wrap the return value to skip the draft check and thus improve performance.
 *
 * ## Example
 *
 * ```ts
 * import { create, rawReturn } from '../index';
 *
 * const baseState = { foo: { bar: 'str' }, arr: [] };
 * const state = create(
 *   baseState,
 *   (draft) => {
 *     return rawReturn(baseState);
 *   },
 * );
 * expect(state).toBe(baseState);
 * ```
 */
export function rawReturn<T extends object | undefined>(value: T): T {
  if (arguments.length === 0) {
    throw new Error('rawReturn() must be called with a value.');
  }
  if (arguments.length > 1) {
    throw new Error('rawReturn() must be called with one argument.');
  }
  if (
    __DEV__ &&
    value !== undefined &&
    (typeof value !== 'object' || value === null)
  ) {
    console.warn(
      'rawReturn() must be called with an object(including plain object, arrays, Set, Map, etc.) or `undefined`, other types do not need to be returned via rawReturn().'
    );
  }
  return {
    [RAW_RETURN_SYMBOL]: [value],
  } as never;
}
