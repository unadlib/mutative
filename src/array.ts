import { DraftType, type ProxyDraft } from './interface';
import { PROXY_DRAFT } from './constant';
import { internal } from './internal';
import {
  ensureShallowCopy,
  getProxyDraft,
  isDraftable,
  isEqual,
  latest,
  markChanged,
  markFinalization,
} from './utils';
import { checkReadable } from './unsafe';

const arrayProto = Array.prototype;

function canExecute(value: any) {
  return (
    (typeof value === 'object' && value !== null) || typeof value === 'function'
  );
}

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

// ToIntegerOrInfinity: the unary plus applies ToNumber, which rejects BigInt
// and Symbol values like the array methods do.
const toInteger = (value: any) => Math.trunc(+value) || 0;

// A relative index argument resolved against `length`, as the array methods do.
function relativeIndex(value: any, length: number, fallback: number) {
  if (value === undefined) return fallback;
  const integer = toInteger(value);
  return integer < 0
    ? Math.max(length + integer, 0)
    : Math.min(integer, length);
}

// The native-method bookkeeping of an array draft, created on first use.
function arrayState(target: ProxyDraft) {
  return (target.arrayState ??= {
    relocated: false,
    diffStart: 0,
    diffEnd: 0,
    baseRefs: null,
    inert: null,
    dense: null,
  });
}

// Whether the array has no holes and no undefined elements, so that a native
// operation and the replay of its patches agree on every index. Sparse
// arrays keep the proxy path. Cached until an undefined value is assigned or
// the length changes.
function isDense(target: ProxyDraft) {
  const state = arrayState(target);
  let dense = state.dense;
  if (dense === null) {
    dense = state.dense = !arrayProto.includes.call(latest(target), undefined);
  }
  return dense;
}

// Original index of each element of the original array, built once elements
// have been moved natively and identity against the index no longer works.
export function baseIndices(target: ProxyDraft) {
  const state = arrayState(target);
  let indices = state.baseRefs;
  if (indices === null) {
    indices = state.baseRefs = new Map();
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
  const state = target.arrayState;
  if (state === null || !state.relocated) {
    return target.original[index] === value ? index : -1;
  }
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
  const state = target.arrayState;
  if (state !== null && canExecute(value)) state.inert = null;
  if (typeof value === 'object' && value !== null) {
    markFinalization(target, key, value);
  } else if (value === undefined && state !== null) {
    state.dense = null;
  }
}

// Only primitives have no conversion hooks. Functions can implement their
// own toString or Symbol.toPrimitive, just like objects. Cached until either
// kind of reference is assigned.
function isInert(target: ProxyDraft) {
  const state = arrayState(target);
  let inert = state.inert;
  if (inert === null) {
    const source = latest(target);
    inert = true;
    for (let index = 0; index < source.length; index += 1) {
      const value = source[index];
      if (canExecute(value)) {
        inert = false;
        break;
      }
    }
    state.inert = inert;
  }
  return inert;
}

// Records that a native operation may have changed the indices in
// [from, to) and that elements may have moved away from their original index.
function markRange(target: ProxyDraft, from: number, to: number) {
  const state = arrayState(target);
  if (state.diffEnd > state.diffStart) {
    state.diffStart = Math.min(state.diffStart, from);
    state.diffEnd = Math.max(state.diffEnd, to);
  } else {
    state.diffStart = from;
    state.diffEnd = to;
  }
  state.relocated = true;
}

/**
 * After a native operation moved elements: drafts created here take their
 * new keys, assigned values are registered again at their new indices, and
 * the array remembers that identity against the original index can no longer
 * tell a moved base element from an assigned value.
 */
function relocate(
  target: ProxyDraft,
  map: (index: number) => number,
  from: number,
  to: number
) {
  markRange(target, from, to);
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
}

// Before removing the element at `index`: its draft, or the original index
// it needs as draft key, or -1 when it is exposed as is. This runs before the
// array changes, so a strict-mode rejection leaves the array untouched. The
// current array decides what is at `index`; the child registry is only a
// cache, because writes through the set trap and the proxy path do not
// maintain it.
function removalKey(target: ProxyDraft, index: number) {
  const value = latest(target)[index];
  if (typeof value !== 'object' || value === null) return -1;
  if (childAt(target, index) === value || getProxyDraft(value)) return value;
  if (isDraftable(value, target.options)) {
    return baseIndex(target, value, index);
  }
  if (target.options.strict) checkReadable(value, target.options);
  return -1;
}

// A removed element is exposed as a draft when the user could otherwise
// modify the original array through it.
function removed(target: ProxyDraft, value: any, key: any) {
  if (typeof key !== 'number') return key;
  if (key < 0) return value;
  // The draft is finalized against the parent's copy, which must exist.
  ensureShallowCopy(target);
  return internal.createDraft(
    value,
    target,
    key,
    target.finalities,
    target.options
  );
}

function prepare(target: ProxyDraft) {
  ensureShallowCopy(target);
  markChanged(target);
  return target.copy! as any[];
}

type Native = (...args: any[]) => any;

// A method that runs `impl` on the array draft behind `this`, or the
// original method when `this` is not an eligible draft. Methods that move
// elements also stay on the proxy path for sparse arrays.
function native(
  method: keyof typeof arrayProto,
  impl: (target: ProxyDraft, self: any, args: any[]) => any,
  moves = false
): Native {
  const original: Native = arrayProto[method] as any;
  return function (this: any, ...args: any[]) {
    const target = nativeState(this);
    return target === null || (moves && !isDense(target))
      ? original.apply(this, args)
      : impl(target, this, args);
  };
}

// Identity searches read the array directly. The index argument is converted
// after the length is read and before the elements, as the native methods
// do, so a conversion that changes the array is observed the same way. A
// draft also matches the original it stands for, as a read through the proxy
// would return the draft for it.
function search(method: 'indexOf' | 'lastIndexOf' | 'includes') {
  const nativeSearch: Native = arrayProto[method] as any;
  return native(method, (target, self, args) => {
    const length = latest(target).length;
    if (length === 0) return method === 'includes' ? false : -1;
    if (canExecute(args[1])) return nativeSearch.apply(self, args);
    const from =
      args.length > 1
        ? toInteger(args[1])
        : method === 'lastIndexOf'
          ? length - 1
          : 0;
    const source = latest(target);
    const value = args[0];
    const found = nativeSearch.call(source, value, from);
    const original = getProxyDraft(value)?.original;
    if (original === undefined || (found !== -1 && found !== false)) {
      return found;
    }
    return nativeSearch.call(source, original, from);
  });
}

/**
 * Array methods without callbacks run natively on the draft's copy instead
 * of moving every element through the proxy traps.
 */
export const arrayMethods: Record<PropertyKey, Native> = Object.assign(
  Object.create(null),
  {
    indexOf: search('indexOf'),
    lastIndexOf: search('lastIndexOf'),
    includes: search('includes'),
    // The separator is converted after the length is read and before the
    // elements, as the native method does. Arrays of primitives are read
    // directly; others read through the draft like the native method.
    join: native('join', (target, self, args) => {
      const length = latest(target).length;
      const separator = args[0] === undefined ? ',' : `${args[0]}`;
      const source = isInert(target) ? latest(target) : self;
      let result = '';
      for (let index = 0; index < length; index += 1) {
        if (index > 0) result += separator;
        const element = source[index];
        if (element !== undefined && element !== null) result += `${element}`;
      }
      return result;
    }),
    shift: native(
      'shift',
      (target) => {
        if (latest(target).length === 0) return undefined;
        const key = removalKey(target, 0);
        const copy = prepare(target);
        const value = arrayProto.shift.call(copy);
        relocate(target, (index) => index - 1, 0, copy.length + 1);
        return removed(target, value, key);
      },
      true
    ),
    unshift: native(
      'unshift',
      (target, _self, items) => {
        const count = items.length;
        if (count === 0) return latest(target).length;
        const copy = prepare(target);
        arrayProto.unshift.apply(copy, items);
        relocate(target, (index) => index + count, 0, copy.length);
        for (let index = 0; index < count; index += 1) {
          registerAssigned(target, index, items[index]);
        }
        return copy.length;
      },
      true
    ),
    splice: native('splice', (target, self, args) => {
      // Let the native algorithm retain its length and read order when
      // converting an argument can execute user code or change the draft.
      if (canExecute(args[0]) || canExecute(args[1])) {
        return (arrayProto.splice as any).apply(self, args);
      }
      const length = latest(target).length;
      const start = relativeIndex(args[0], length, 0);
      const deleteCount =
        args.length === 0
          ? 0
          : args.length === 1
            ? length - start
            : Math.min(Math.max(toInteger(args[1]), 0), length - start);
      const insertCount = Math.max(args.length - 2, 0);
      if ((deleteCount === 0 && insertCount === 0) || !isDense(target)) {
        return (arrayProto.splice as any).apply(self, args);
      }
      const keys: any[] = [];
      for (let index = 0; index < deleteCount; index += 1) {
        keys.push(removalKey(target, start + index));
      }
      const source = latest(target);
      if (deleteCount === insertCount) {
        // Replacing elements with equal values changes nothing, as through
        // the proxy; the removed elements are still exposed as drafts.
        let same = true;
        for (let index = 0; index < insertCount; index += 1) {
          if (!isEqual(args[index + 2], source[start + index])) {
            same = false;
            break;
          }
        }
        if (same) {
          return keys.map((key, index) =>
            removed(target, source[start + index], key)
          );
        }
      }
      const copy = prepare(target);
      // Primitive arguments have no conversion side effects. Use the
      // normalized indices for both the native call and draft bookkeeping.
      const spliceArgs: any[] = [start, deleteCount];
      for (let index = 2; index < args.length; index += 1) {
        spliceArgs.push(args[index]);
      }
      const values: any[] = (arrayProto.splice as any).apply(copy, spliceArgs);
      relocate(
        target,
        (index) =>
          index < start
            ? index
            : index < start + deleteCount
              ? -1
              : index - deleteCount + insertCount,
        start,
        // Later indices keep their place when as many are inserted as deleted.
        deleteCount === insertCount
          ? start + deleteCount
          : Math.max(length, copy.length)
      );
      for (let index = 0; index < insertCount; index += 1) {
        registerAssigned(target, start + index, args[index + 2]);
      }
      for (let index = 0; index < values.length; index += 1) {
        values[index] = removed(target, values[index], keys[index]);
      }
      return values;
    }),
    // Sorting hands every element to the comparator, so only arrays of
    // primitives are sorted natively; the rest sort through the proxy.
    sort: native(
      'sort',
      (target, self, [compare]) => {
        if (
          (compare !== undefined && typeof compare !== 'function') ||
          !isInert(target)
        ) {
          return arrayProto.sort.call(self, compare);
        }
        const source = latest(target);
        const length = source.length;
        // Like the native method, collect the elements before the comparator
        // runs, then write them back over anything the comparator changed
        // through the draft.
        const sorted = arrayProto.slice.call(source);
        arrayProto.sort.call(sorted, compare);
        let changed = false;
        for (let index = 0; index < length; index += 1) {
          if (!isEqual(sorted[index], source[index])) {
            changed = true;
            break;
          }
        }
        const copy = changed ? prepare(target) : target.copy;
        if (copy !== null) {
          for (let index = 0; index < length; index += 1) {
            copy[index] = sorted[index];
          }
        }
        if (changed) markRange(target, 0, length);
        return self;
      },
      true
    ),
    reverse: native(
      'reverse',
      (target, self) => {
        const source = latest(target);
        const length = source.length;
        // A palindrome by identity stays untouched, as through the proxy.
        let changed = false;
        for (let low = 0, high = length - 1; low < high; low += 1, high -= 1) {
          if (!isEqual(source[low], source[high])) {
            changed = true;
            break;
          }
        }
        if (changed) {
          arrayProto.reverse.call(prepare(target));
          relocate(target, (index) => length - 1 - index, 0, length);
        }
        return self;
      },
      true
    ),
  }
);
