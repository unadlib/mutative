import { DraftType } from '../interface';
import { getType, isDraft } from './draft';

function throwFrozenError() {
  throw new Error('Cannot modify frozen object');
}

function isFreezable(value: any) {
  return (
    __DEV__ || (value && typeof value === 'object' && !Object.isFrozen(value))
  );
}

export function deepFreeze(
  target: any,
  subKey?: any,
  updatedValues?: WeakMap<any, any>,
  stack?: any[],
  keys?: any[]
) {
  if (__DEV__) {
    updatedValues = updatedValues ?? new WeakMap();
    stack = stack ?? [];
    keys = keys ?? [];
    const value = updatedValues.has(target)
      ? updatedValues.get(target)
      : target;
    if (stack.length > 0) {
      const index = stack.indexOf(value);
      if (value && typeof value === 'object' && index !== -1) {
        if (stack[0] === value) {
          throw new Error(`Forbids circular reference`);
        }
        throw new Error(
          `Forbids circular reference: ~/${keys
            .slice(0, index)
            .map((key, index) => {
              if (typeof key === 'symbol') return `[${key.toString()}]`;
              const parent = stack![index];
              if (
                typeof key === 'object' &&
                (parent instanceof Map || parent instanceof Set)
              )
                return Array.from(parent.keys()).indexOf(key);
              return key;
            })
            .join('/')}`
        );
      }
      stack.push(value);
      keys.push(subKey);
    } else {
      stack.push(value);
    }
  }
  if (Object.isFrozen(target) || isDraft(target)) {
    if (__DEV__) {
      stack!.pop();
      keys!.pop();
    }
    return;
  }
  const type = getType(target);
  switch (type) {
    case DraftType.Map:
      for (const [key, value] of target) {
        if (isFreezable(key)) deepFreeze(key, key, updatedValues, stack, keys);
        if (isFreezable(value))
          deepFreeze(value, key, updatedValues, stack, keys);
      }
      target.set = target.clear = target.delete = throwFrozenError;
      break;
    case DraftType.Set:
      for (const value of target) {
        if (isFreezable(value))
          deepFreeze(value, value, updatedValues, stack, keys);
      }
      target.add = target.clear = target.delete = throwFrozenError;
      break;
    case DraftType.Array:
      Object.freeze(target);
      let index = 0;
      for (const value of target) {
        if (isFreezable(value))
          deepFreeze(value, index, updatedValues, stack, keys);
        index += 1;
      }
      break;
    default:
      Object.freeze(target);
      // ignore non-enumerable or symbol properties
      Object.keys(target).forEach((name) => {
        const value = target[name];
        if (isFreezable(value))
          deepFreeze(value, name, updatedValues, stack, keys);
      });
  }
  if (__DEV__) {
    stack!.pop();
    keys!.pop();
  }
}
