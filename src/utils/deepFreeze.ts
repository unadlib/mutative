/* eslint-disable no-case-declarations */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-bitwise */
import { DraftType } from '../interface';
import { getType, isDraft } from './draft';

function throwFrozenError() {
  throw new Error('Cannot modify frozen object');
}

export function deepFreeze(
  target: any,
  key?: any,
  updatedValues?: WeakMap<any, any>,
  stack?: any[],
  keys?: any[]
) {
  if (__DEV__ && typeof target === 'object') {
    updatedValues = updatedValues ?? new WeakMap();
    stack = stack ?? [];
    keys = keys ?? [];
    const value = updatedValues.has(target)
      ? updatedValues.get(target)
      : target;
    if (stack.length > 0) {
      if (stack.includes(value)) {
        if (stack[0] === value) {
          throw new Error(`Forbids circular reference: ~]`);
        }
        throw new Error(
          `Forbids circular reference: ~.${keys
            .slice(0, stack.indexOf(value))
            .join('.')}`
        );
      }
      stack.push(value);
      keys.push(key);
    } else {
      stack.push(value);
    }
  }
  if (Object.isFrozen(target) || isDraft(target)) return;
  const type = getType(target);
  switch (type) {
    case DraftType.Map:
      for (const [key, value] of target) {
        deepFreeze(key, key, updatedValues, stack, keys);
        deepFreeze(value, value, updatedValues, stack, keys);
      }
      target.set = target.clear = target.delete = throwFrozenError;
      break;
    case DraftType.Set:
      for (const value of target) {
        deepFreeze(value, value, updatedValues, stack, keys);
      }
      target.add = target.clear = target.delete = throwFrozenError;
      break;
    case DraftType.Array:
      Object.freeze(target);
      let i = 0;
      for (const value of target) {
        deepFreeze(value, i++, updatedValues, stack, keys);
      }
      break;
    default:
      Object.freeze(target);
      // ignore non-enumerable or symbol properties
      Object.keys(target).forEach((name) => {
        const value = target[name];
        deepFreeze(value, name, updatedValues, stack, keys);
      });
  }
  stack?.pop();
  keys?.pop();
}
