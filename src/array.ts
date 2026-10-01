import { DraftType, type ProxyDraft } from './interface';
import { PROXY_DRAFT } from './constant';
import { internal } from './internal';
import {
  ensureShallowCopy,
  getProxyDraft,
  isDraftable,
  latest,
  markChanged,
  markFinalization,
} from './utils';
import { checkReadable } from './unsafe';

const arrayProto = Array.prototype;

/**
 * The array draft behind `this` when a method may run natively on its copy:
 * plain arrays only, outside `current()` and without a custom mark.
 */
function nativeState(self: any): ProxyDraft | null {
  const target: ProxyDraft | undefined =
    typeof self === 'object' && self !== null ? self[PROXY_DRAFT] : undefined;
  return target &&
    target.type === DraftType.Array &&
    !target.finalized &&
    !target.options.mark &&
    Object.getPrototypeOf(target.original) === arrayProto
    ? target
    : null;
}

function toInteger(value: any) {
  const integer = Math.trunc(Number(value));
  return integer === integer ? integer : 0;
}

// A relative index argument resolved against `length`, as the array methods do.
function relativeIndex(value: any, length: number, fallback: number) {
  if (value === undefined) return fallback;
  const integer = toInteger(value);
  return integer < 0
    ? Math.max(length + integer, 0)
    : Math.min(integer, length);
}

// Original index of each element of the original array, built once elements
// have been moved natively and identity against the index no longer works.
export function baseIndices(target: ProxyDraft) {
  let indices = target.baseRefs;
  if (indices === null) {
    indices = target.baseRefs = new Map();
    const original = target.original;
    for (let index = 0; index < original.length; index += 1) {
      indices.set(original[index], index);
    }
  }
  return indices;
}

// The original index of `value`, found at `index` before an operation, or -1
// when it did not come from the original array.
function baseIndex(target: ProxyDraft, value: any, index: number) {
  if (!target.relocated) return target.original[index] === value ? index : -1;
  const found = baseIndices(target).get(value);
  return found === undefined ? -1 : found;
}

// The draft this array created for `index`, if any.
function childAt(target: ProxyDraft, index: number) {
  return target.child !== null && target.childKey === String(index)
    ? target.child
    : target.children?.[index];
}

// Registers a draft created by this array at `index`, like the get trap does.
function registerChild(target: ProxyDraft, index: number, draft: any) {
  if (target.child === null) {
    target.child = draft;
    target.childKey = String(index);
  } else {
    (target.children ??= [])[index] = draft;
  }
}

// Bookkeeping for a value placed at `index` natively, like the set trap does.
function registerAssigned(target: ProxyDraft, index: number, value: any) {
  const key = String(index);
  target.assignedMap!.set(key, true);
  if (typeof value === 'object' && value !== null) {
    markFinalization(target, key, value);
  }
}

/**
 * After a native operation moved elements: drafts created here take their
 * new keys, assigned values are registered again at their new indices, and
 * the array remembers that identity against the original index can no longer
 * tell a moved base element from an assigned value.
 */
function relocate(target: ProxyDraft, map: (index: number) => number) {
  const copy = target.copy!;
  const entries: [number, any][] = [];
  if (target.child !== null)
    entries.push([Number(target.childKey), target.child]);
  target.children?.forEach((draft: any, index: number) => {
    entries.push([index, draft]);
  });
  target.child = null;
  target.childKey = null;
  target.children = undefined;
  // Keys keep the original layout, which patch paths are expressed in; a
  // moved draft is finalized into its new index through a callback instead.
  for (let position = 0; position < entries.length; position += 1) {
    const [index, draft] = entries[position];
    const next = map(index);
    if (next >= 0) {
      registerChild(target, next, draft);
      if (next !== index) markFinalization(target, String(next), draft);
    }
  }
  const assignedMap = target.assignedMap!;
  const assigned: [any, boolean][] = [];
  assignedMap.forEach((flag, key) => {
    if (key !== 'length') assigned.push([key, flag]);
  });
  // Clear every old index before writing the new ones: an index may be both.
  for (let position = 0; position < assigned.length; position += 1) {
    assignedMap.delete(assigned[position][0]);
  }
  for (let position = 0; position < assigned.length; position += 1) {
    const [key, flag] = assigned[position];
    const next = map(Number(key));
    if (next >= 0) {
      const value = copy[next];
      if (flag && typeof value === 'object' && value !== null) {
        registerAssigned(target, next, value);
      } else {
        assignedMap.set(String(next), flag);
      }
    }
  }
  target.relocated = true;
}

// Before removing the element at `index`: its draft, or the original index
// it needs as draft key, or -1 when it is exposed as is.
function removalKey(target: ProxyDraft, index: number) {
  const draft = childAt(target, index);
  if (draft !== undefined) return draft;
  const value = target.copy![index];
  return typeof value === 'object' &&
    value !== null &&
    isDraftable(value, target.options)
    ? baseIndex(target, value, index)
    : -1;
}

// A removed element is exposed as a draft when the user could otherwise
// modify the original array through it.
function removed(target: ProxyDraft, value: any, key: any) {
  if (typeof key !== 'number') return key;
  if (key >= 0) {
    return internal.createDraft(
      value,
      target,
      key,
      target.finalities,
      target.options
    );
  }
  if (target.options.strict && typeof value === 'object' && value !== null) {
    checkReadable(value, target.options);
  }
  return value;
}

// Drafts the original element at `index` in place, like a read would.
function draftAt(target: ProxyDraft, index: number) {
  const copy = target.copy!;
  const value = copy[index];
  if (
    typeof value !== 'object' ||
    value === null ||
    childAt(target, index) !== undefined ||
    !isDraftable(value, target.options)
  ) {
    return;
  }
  const key = baseIndex(target, value, index);
  if (key < 0) return;
  const draft = internal.createDraft(
    value,
    target,
    key,
    target.finalities,
    target.options
  );
  copy[index] = draft;
  registerChild(target, index, draft);
  if (key !== index) markFinalization(target, String(index), draft);
}

function prepare(target: ProxyDraft) {
  ensureShallowCopy(target);
  markChanged(target);
  return target.copy! as any[];
}

/**
 * Array methods without callbacks run natively on the draft's copy instead
 * of moving every element through the proxy traps.
 */
export const arrayMethods: Record<PropertyKey, (...args: any[]) => any> =
  Object.assign(Object.create(null), {
    shift(this: any) {
      const target = nativeState(this);
      if (target === null) return arrayProto.shift.call(this);
      if (latest(target).length === 0) return undefined;
      const copy = prepare(target);
      const key = removalKey(target, 0);
      const value = arrayProto.shift.call(copy);
      relocate(target, (index) => index - 1);
      return removed(target, value, key);
    },
    unshift(this: any, ...items: any[]) {
      const target = nativeState(this);
      if (target === null) return arrayProto.unshift.apply(this, items);
      const count = items.length;
      if (count === 0) return latest(target).length;
      const copy = prepare(target);
      arrayProto.unshift.apply(copy, items);
      relocate(target, (index) => index + count);
      for (let index = 0; index < count; index += 1) {
        registerAssigned(target, index, items[index]);
      }
      return copy.length;
    },
    splice(this: any, ...args: any[]) {
      const target = nativeState(this);
      if (target === null) return (arrayProto.splice as any).apply(this, args);
      const length = latest(target).length;
      const start = relativeIndex(args[0], length, 0);
      const deleteCount =
        args.length === 0
          ? 0
          : args.length === 1
            ? length - start
            : Math.min(Math.max(toInteger(args[1]), 0), length - start);
      const insertCount = Math.max(args.length - 2, 0);
      if (deleteCount === 0 && insertCount === 0) return [];
      const copy = prepare(target);
      const keys: any[] = [];
      for (let index = 0; index < deleteCount; index += 1) {
        keys.push(removalKey(target, start + index));
      }
      const values: any[] = (arrayProto.splice as any).apply(copy, args);
      relocate(target, (index) =>
        index < start
          ? index
          : index < start + deleteCount
            ? -1
            : index - deleteCount + insertCount
      );
      for (let index = 0; index < insertCount; index += 1) {
        registerAssigned(target, start + index, args[index + 2]);
      }
      for (let index = 0; index < values.length; index += 1) {
        values[index] = removed(target, values[index], keys[index]);
      }
      return values;
    },
    reverse(this: any) {
      const target = nativeState(this);
      if (target === null) return arrayProto.reverse.call(this);
      const length = latest(target).length;
      if (length > 1) {
        arrayProto.reverse.call(prepare(target));
        relocate(target, (index) => length - 1 - index);
      }
      return this;
    },
    fill(this: any, value: any, start?: any, end?: any) {
      const target = nativeState(this);
      if (target === null) return arrayProto.fill.call(this, value, start, end);
      const length = latest(target).length;
      const from = relativeIndex(start, length, 0);
      const to = relativeIndex(end, length, length);
      if (from < to) {
        arrayProto.fill.call(prepare(target), value, from, to);
        relocate(target, (index) => (index >= from && index < to ? -1 : index));
        // One shared object needs one registration; a draft must be
        // finalized into every index that holds it.
        const last = getProxyDraft(value) ? to : from + 1;
        for (let index = from; index < last; index += 1) {
          registerAssigned(target, index, value);
        }
      }
      return this;
    },
    copyWithin(this: any, targetIndex: any, start: any, end?: any) {
      const target = nativeState(this);
      if (target === null) {
        return arrayProto.copyWithin.call(this, targetIndex, start, end);
      }
      const length = latest(target).length;
      const to = relativeIndex(targetIndex, length, 0);
      const from = relativeIndex(start, length, 0);
      const count = Math.min(
        relativeIndex(end, length, length) - from,
        length - to
      );
      if (count > 0 && to !== from) {
        const copy = prepare(target);
        // Copied original elements are drafted first so that both indices
        // share one draft, as they share one object.
        for (let index = from; index < from + count; index += 1) {
          draftAt(target, index);
        }
        arrayProto.copyWithin.call(copy, to, from, from + count);
        relocate(target, (index) =>
          index >= to && index < to + count ? -1 : index
        );
        // The copied values are additional references to elements that keep
        // their own place.
        for (let index = to; index < to + count; index += 1) {
          const value = copy[index];
          if (typeof value === 'object' && value !== null) {
            if (getProxyDraft(value)?.parent === target) {
              registerChild(target, index, value);
            }
            registerAssigned(target, index, value);
          }
        }
      }
      return this;
    },
  });
