import { dataTypes } from './constant';
import { internal } from './internal';
import { generatePatches } from './patch';
import { checkReadable } from './unsafe';
import {
  ensureShallowCopy,
  getProxyDraft,
  isDraftable,
  isEqual,
  isArrayIndex,
  isAssignedArrayIndex,
  isLazyArrayDraft,
  isOriginalArrayValue,
  markChanged,
  markFinalization,
  setAssignedArrayIndex,
} from './utils';
import type { ProxyDraft } from './interface';

function toInteger(value: any) {
  const number = +value;
  if (Number.isNaN(number) || number === 0) return 0;
  if (!Number.isFinite(number)) return number;
  return number < 0 ? Math.ceil(number) : Math.floor(number);
}

function normalizeStart(value: any, length: number) {
  const start = toInteger(value);
  if (start === -Infinity) return 0;
  if (start < 0) return Math.max(length + start, 0);
  return Math.min(start, length);
}

function isSameArrayValue(value: any, originalValue: any) {
  const proxyDraft = getProxyDraft(value);
  if (proxyDraft) {
    return !proxyDraft.operated && isEqual(proxyDraft.original, originalValue);
  }
  return isEqual(value, originalValue);
}

function markArrayChanged(target: ProxyDraft<any[]>) {
  if (target.operated) return;
  const copy = target.copy!;
  const original = target.original;
  if (copy.length !== original.length) {
    markChanged(target);
    return;
  }
  for (let index = 0; index < copy.length; index += 1) {
    const copyHasValue = index in copy;
    const originalHasValue = index in original;
    if (
      copyHasValue !== originalHasValue ||
      (copyHasValue && !isSameArrayValue(copy[index], original[index]))
    ) {
      markChanged(target);
      return;
    }
  }
}

function getLazyArrayTarget(value: any) {
  const target = getProxyDraft(value);
  return target && isLazyArrayDraft(target)
    ? (target as ProxyDraft<any[]>)
    : null;
}

function applyNativeArrayMethod(
  method: 'shift' | 'unshift' | 'splice' | 'reverse',
  value: any,
  args: any[]
) {
  return Reflect.apply((Array.prototype as any)[method], value, args);
}

function copyArrayValues(source: any[], target: any[]) {
  for (let index = 0; index < source.length; index += 1) {
    if (index in source) {
      target[index] = source[index];
    }
  }
  target.length = source.length;
}

function applyCachedArrayDrafts(target: ProxyDraft<any[]>, copy: any[]) {
  const original = target.original;
  if (target.arrayDrafts?.size) {
    target.arrayDrafts.forEach((draft, index) => {
      if (index in copy && copy[index] === original[index]) {
        copy[index] = draft;
      }
    });
  }
}

function getAssignedFlags(target: ProxyDraft<any[]>, length: number) {
  return Array.from({ length }, (_, index) =>
    isAssignedArrayIndex(target, index)
  );
}

function setAssignedFlags(target: ProxyDraft<any[]>, flags: boolean[]) {
  target.assignedMap?.forEach((_, key) => {
    if (isArrayIndex(key)) {
      target.assignedMap!.delete(key);
    }
  });
  flags.forEach((assigned, index) => {
    setAssignedArrayIndex(target, index, assigned);
  });
}

function isAssignedInsertedValue(
  target: ProxyDraft<any[]>,
  key: number,
  value: any
) {
  const original = target.original;
  return !(key in original) || !isEqual(value, original[key]);
}

function createArrayCopy(target: ProxyDraft<any[]>) {
  const original = target.original;
  const pendingCopy = new Array(original.length);
  copyArrayValues(original, pendingCopy);
  applyCachedArrayDrafts(target, pendingCopy);
  // Species constructors can re-enter the draft while the copy is being built.
  target.copy = pendingCopy as any;

  const copy = arraySpeciesCreate(original, 0);
  copyArrayValues(target.copy as any[], copy);
  return copy;
}

function prepareArrayCopy(target: ProxyDraft<any[]>) {
  if (!target.copy) {
    target.copy = createArrayCopy(target) as any;
  }
  return target.copy!;
}

function draftArrayValue(
  target: ProxyDraft<any[]>,
  key: number,
  value: any,
  options: { cache?: boolean; setCopy?: boolean } = {}
) {
  const valueProxyDraft = getProxyDraft(value);
  if (valueProxyDraft) return value;
  let markResult: any;
  if (target.options.mark) {
    markResult = target.options.mark(value, dataTypes);
    if (markResult === dataTypes.mutable) {
      if (target.options.strict) {
        checkReadable(value, target.options, true);
      }
      return value;
    }
  }
  if (target.options.strict) {
    checkReadable(value, target.options);
  }
  if (
    target.finalized ||
    !isDraftable(value, target.options) ||
    isAssignedArrayIndex(target, key) ||
    !isOriginalArrayValue(target, value)
  ) {
    return value;
  }
  if (options.cache && !target.copy) {
    const cachedDraft = target.arrayDrafts?.get(key);
    if (cachedDraft) return cachedDraft;
  }
  const draft = internal.createDraft({
    original: value,
    parentDraft: target,
    key,
    finalities: target.finalities,
    options: target.options,
  });
  if (options.cache && !target.copy) {
    target.arrayDrafts = target.arrayDrafts ?? new Map();
    target.arrayDrafts.set(key, draft);
  } else if (options.setCopy && target.copy?.[key] === value) {
    target.copy![key] = draft;
  }
  if (typeof markResult === 'function') {
    const proxyDraft = getProxyDraft(draft)!;
    ensureShallowCopy(proxyDraft);
    markChanged(proxyDraft);
    return proxyDraft.copy;
  }
  return draft;
}

function draftRemovedValues(
  target: ProxyDraft<any[]>,
  start: number,
  speciesSource: any[],
  source: any[],
  count: number
) {
  const result = arraySpeciesCreate(speciesSource, count);
  for (let index = 0; index < count; index += 1) {
    const key = start + index;
    if (key in source) {
      result[index] = draftArrayValue(target, key, source[key]);
    }
  }
  result.length = count;
  return result;
}

function arraySpeciesCreate(original: any, length: number) {
  if (!Array.isArray(original)) {
    return new Array(length);
  }
  let constructor: any = original.constructor;
  if (constructor === undefined) {
    return new Array(length);
  }
  if (
    constructor === null ||
    (typeof constructor !== 'object' && typeof constructor !== 'function')
  ) {
    throw new TypeError(`Array species constructor is not a constructor`);
  }
  constructor = constructor[Symbol.species];
  if (constructor == null) {
    return new Array(length);
  }
  return new constructor(length);
}

function markInsertedValues(
  target: ProxyDraft<any[]>,
  start: number,
  count: number
) {
  for (let index = 0; index < count; index += 1) {
    const key = start + index;
    markFinalization(target, key, target.copy![key], generatePatches);
  }
}

export const arrayHandler = {
  shift() {
    const target = getLazyArrayTarget(this);
    if (!target) return applyNativeArrayMethod('shift', this, []);
    const source = target.copy ?? target.original;
    if (source.length === 0) return undefined;
    const copy = prepareArrayCopy(target);
    const assignedFlags = getAssignedFlags(target, copy.length);
    const result = draftArrayValue(target, 0, copy[0]);
    Array.prototype.shift.call(copy);
    Array.prototype.shift.call(assignedFlags);
    setAssignedFlags(target, assignedFlags);
    markArrayChanged(target);
    return result;
  },
  unshift(...values: any[]) {
    const target = getLazyArrayTarget(this);
    if (!target) return applyNativeArrayMethod('unshift', this, values);
    if (values.length === 0) return (target.copy ?? target.original).length;
    const copy = prepareArrayCopy(target);
    const assignedFlags = getAssignedFlags(target, copy.length);
    const insertedFlags = values.map((value, index) =>
      isAssignedInsertedValue(target, index, value)
    );
    const result = Array.prototype.unshift.apply(copy, values);
    Array.prototype.unshift.apply(assignedFlags, insertedFlags);
    setAssignedFlags(target, assignedFlags);
    markInsertedValues(target, 0, values.length);
    markArrayChanged(target);
    return result;
  },
  splice(...args: any[]) {
    const target = getLazyArrayTarget(this);
    if (!target) return applyNativeArrayMethod('splice', this, args);
    if (args.length === 0) {
      const result = arraySpeciesCreate(target.copy ?? target.original, 0);
      result.length = 0;
      return result;
    }
    const source = target.copy ?? target.original;
    const length = source.length;
    const start = normalizeStart(args[0], length);
    const deleteCount =
      args.length === 1
        ? length - start
        : Math.min(Math.max(toInteger(args[1]), 0), length - start);
    const insertedCount = Math.max(args.length - 2, 0);
    const copy = prepareArrayCopy(target);
    if (copy.length !== length) {
      copy.length = length;
    }
    const assignedFlags = getAssignedFlags(target, length);
    assignedFlags.length = length;
    const insertedFlags = args.slice(2).map((value, index) =>
      isAssignedInsertedValue(target, start + index, value)
    );
    const result = draftRemovedValues(target, start, source, copy, deleteCount);
    if (args.length === 1) {
      Reflect.apply(Array.prototype.splice, copy, [start]);
      Reflect.apply(Array.prototype.splice, assignedFlags, [start]);
    } else {
      Reflect.apply(Array.prototype.splice, copy, [
        start,
        deleteCount,
        ...args.slice(2),
      ]);
      Reflect.apply(Array.prototype.splice, assignedFlags, [
        start,
        deleteCount,
        ...insertedFlags,
      ]);
    }
    setAssignedFlags(target, assignedFlags);
    markInsertedValues(target, start, insertedCount);
    markArrayChanged(target);
    return result;
  },
  reverse() {
    const target = getLazyArrayTarget(this);
    if (!target) return applyNativeArrayMethod('reverse', this, []);
    const source = target.copy ?? target.original;
    if (source.length <= 1) return this;
    const copy = prepareArrayCopy(target);
    const assignedFlags = getAssignedFlags(target, copy.length);
    Array.prototype.reverse.call(copy);
    Array.prototype.reverse.call(assignedFlags);
    setAssignedFlags(target, assignedFlags);
    markArrayChanged(target);
    return this;
  },
};

export const arrayHandlerKeys = Reflect.ownKeys(arrayHandler);

export { draftArrayValue };
