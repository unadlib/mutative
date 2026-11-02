import { DraftType, type Mark } from '../interface';
import { dataTypes } from '../constant';
import { getType, isDraft } from './draft';
import { die, ErrorCode } from '../error';

function throwFrozenError() {
  die(ErrorCode.CannotModifyFrozenObject);
}

// An object is frozen before the values it holds, so development builds also
// visit frozen objects, to find a value that holds an object being frozen.
function isVisited(value: any) {
  return (
    typeof value === 'object' &&
    value !== null &&
    (__DEV__ || !Object.isFrozen(value))
  );
}

/**
 * Whether auto-freeze freezes an object of the type that `getType()` gives,
 * one that is neither frozen nor a draft. It freezes the values that Mutative
 * drafts, as `isDraftable()` tells them: plain objects, arrays, Maps and Sets
 * and the values that a mark makes draftable, unless a mark makes them
 * mutable for the recipe to change in place. Like Immer, it leaves other
 * objects as they are, with the values they hold: class instances,
 * null-prototype objects, dates, regular expressions and the like.
 * `Object.freeze()` throws for a typed array with elements and cannot make
 * the bytes of any ArrayBuffer view read-only, so views are left as they are
 * even when a mark makes them draftable; `ArrayBuffer.isView()` also
 * recognizes views of other realms. The mark is called once, and not for
 * views.
 */
function isFreezableAs(target: object, type: DraftType, mark?: Mark<any, any>) {
  if (type === DraftType.Object && ArrayBuffer.isView(target)) return false;
  const markResult = mark?.(target, dataTypes);
  return (
    markResult !== dataTypes.mutable &&
    (type !== DraftType.Object ||
      Object.getPrototypeOf(target) === Object.prototype ||
      markResult === dataTypes.immutable ||
      typeof markResult === 'function')
  );
}

// Development builds warn once, see `warnUnfrozen()`.
let unfrozenWarned = false;

/**
 * Before 2.1, auto-freeze also froze the objects that Mutative does not
 * draft, so development builds warn once when it leaves one unfrozen that
 * has own enumerable properties, such as a class instance with fields, for
 * code that relied on it being frozen. Objects that a mark makes mutable are
 * left without a warning, which calls the mark a second time.
 */
function warnUnfrozen(target: object, type: DraftType, mark?: Mark<any, any>) {
  if (
    type === DraftType.Object &&
    !ArrayBuffer.isView(target) &&
    Object.keys(target).length > 0 &&
    mark?.(target, dataTypes) !== dataTypes.mutable
  ) {
    unfrozenWarned = true;
    const prototype = Object.getPrototypeOf(target);
    console.warn(
      `Auto-freeze left ${prototype === null ? 'an object without a prototype' : `an instance of ${prototype.constructor?.name || 'a class'}`} unfrozen: since Mutative 2.1, it freezes only the values that Mutative drafts, as Immer does. Freeze such values in their constructor or mark them immutable to keep them frozen, or mark them mutable to silence this warning; see https://mutative.js.org/docs/advanced-guides/auto-freeze#keeping-class-instances-frozen`
    );
  }
}

export function deepFreeze(
  target: any,
  mark?: Mark<any, any>,
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
  const type = getType(target);
  const skipped = Object.isFrozen(target) || isDraft(target);
  if (skipped || !isFreezableAs(target, type, mark)) {
    if (__DEV__) {
      if (!skipped && !unfrozenWarned) warnUnfrozen(target, type, mark);
      stack!.pop();
      keys!.pop();
    }
    return;
  }
  // Like other objects, a Map or Set is frozen before its contents, so that a
  // later freeze skips it and a circular reference ends the walk. Freezing
  // leaves its entries mutable, which the guards installed first prevent.
  switch (type) {
    case DraftType.Map:
      target.set = target.clear = target.delete = throwFrozenError;
      Object.freeze(target);
      for (const [key, value] of target) {
        if (isVisited(key)) deepFreeze(key, mark, key, stack, keys);
        if (isVisited(value)) deepFreeze(value, mark, key, stack, keys);
      }
      break;
    case DraftType.Set:
      target.add = target.clear = target.delete = throwFrozenError;
      Object.freeze(target);
      for (const value of target) {
        if (isVisited(value)) deepFreeze(value, mark, value, stack, keys);
      }
      break;
    case DraftType.Array:
      Object.freeze(target);
      let index = 0;
      for (const value of target) {
        if (isVisited(value)) deepFreeze(value, mark, index, stack, keys);
        index += 1;
      }
      break;
    default:
      Object.freeze(target);
      // ignore non-enumerable or symbol properties
      Object.keys(target).forEach((name) => {
        const value = target[name];
        if (isVisited(value)) deepFreeze(value, mark, name, stack, keys);
      });
  }
  if (__DEV__) {
    stack!.pop();
    keys!.pop();
  }
}
