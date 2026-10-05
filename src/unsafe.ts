import { Options } from './interface';
import { isDraftable } from './utils';
import { die, ErrorCode } from './error';

let readable = false;

export const checkReadable = (
  value: any,
  options: Options<any, any>,
  ignoreCheckDraftable = false
) => {
  if (
    typeof value === 'object' &&
    value !== null &&
    (!isDraftable(value, options) || ignoreCheckDraftable) &&
    !readable
  ) {
    die(ErrorCode.StrictModeAccess);
  }
};

// Whether reads from drafts are checked now: in strict mode, outside
// `unsafe()`.
export const checksReads = (options: Options<any, any>) =>
  !!options.strict && !readable;

/**
 * `unsafe(callback)` to access mutable data directly in strict mode.
 *
 * ## Example
 *
 * ```ts
 * import { create, unsafe } from '../index';
 *
 * class Foobar {
 *   bar = 1;
 * }
 *
 * const baseState = { foobar: new Foobar() };
 * const state = create(
 *   baseState,
 *   (draft) => {
 *    unsafe(() => {
 *      draft.foobar.bar = 2;
 *    });
 *   },
 *   {
 *     strict: true,
 *   }
 * );
 *
 * expect(state).toBe(baseState);
 * expect(state.foobar).toBe(baseState.foobar);
 * expect(state.foobar.bar).toBe(2);
 * ```
 */
export function unsafe<T>(callback: () => T): T {
  // A nested call hands the outer call's access back when it ends.
  const previous = readable;
  readable = true;
  try {
    return callback();
  } finally {
    readable = previous;
  }
}
