import { DraftType } from '../interface';
import { getType, isDraft } from './draft';
import { die, ErrorCode } from '../error';

function throwFrozenError() {
  die(ErrorCode.CannotModifyFrozenObject);
}

function isFreezable(value: any) {
  return (
    __DEV__ || (value && typeof value === 'object' && !Object.isFrozen(value))
  );
}

export function deepFreeze(
  target: any,
  subKey?: any,
  stack?: any[],
  keys?: any[]
) {
  if (__DEV__) {
    stack = stack ?? [];
    keys = keys ?? [];
    // A cycle is an object that holds itself through its values. The copy of a
    // changed draft is a different object from its original, so a copy that
    // holds its original, as `draft.prev = original(draft)` makes it, is no
    // cycle, and neither is a shared object reached through another path.
    if (stack.length > 0) {
      const index = stack.indexOf(target);
      if (target && typeof target === 'object' && index !== -1) {
        if (stack[0] === target) {
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
      stack.push(target);
      keys.push(subKey);
    } else {
      stack.push(target);
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
  // Like other objects, a Map or Set is frozen before its contents, so that a
  // later freeze skips it and a circular reference ends the walk. Freezing
  // leaves its entries mutable, which the guards installed first prevent.
  switch (type) {
    case DraftType.Map:
      target.set = target.clear = target.delete = throwFrozenError;
      Object.freeze(target);
      for (const [key, value] of target) {
        if (isFreezable(key)) deepFreeze(key, key, stack, keys);
        if (isFreezable(value)) deepFreeze(value, key, stack, keys);
      }
      break;
    case DraftType.Set:
      target.add = target.clear = target.delete = throwFrozenError;
      Object.freeze(target);
      for (const value of target) {
        if (isFreezable(value)) deepFreeze(value, value, stack, keys);
      }
      break;
    case DraftType.Array:
      Object.freeze(target);
      let index = 0;
      for (const value of target) {
        if (isFreezable(value)) deepFreeze(value, index, stack, keys);
        index += 1;
      }
      break;
    default:
      Object.freeze(target);
      // ignore non-enumerable or symbol properties
      Object.keys(target).forEach((name) => {
        const value = target[name];
        if (isFreezable(value)) deepFreeze(value, name, stack, keys);
      });
  }
  if (__DEV__) {
    stack!.pop();
    keys!.pop();
  }
}
