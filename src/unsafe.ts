import { Options } from './interface';
import { isDraftable } from './utils';

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
    throw new Error(
      `Strict mode: Mutable data cannot be accessed directly, please use 'unsafe(callback)' wrap.`
    );
  }
};

/**
 * `unsafe(callback)` to access mutable data directly
 */
export const unsafe = <T>(callback: () => T): T => {
  readable = true;
  let result: T;
  try {
    result = callback();
  } finally {
    readable = false;
  }
  return result;
};
