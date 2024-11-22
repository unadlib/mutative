import type { Options, ProxyDraft } from '../interface';
import { dataTypes } from '../constant';
import { getValue, isDraft, isDraftable } from './draft';
import { isBaseMapInstance, isBaseSetInstance } from './proto';

function strictCopy(target: any) {
  const copy = Object.create(Object.getPrototypeOf(target));
  Reflect.ownKeys(target).forEach((key: any) => {
    let desc = Reflect.getOwnPropertyDescriptor(target, key)!;
    if (desc.enumerable && desc.configurable && desc.writable) {
      copy[key] = target[key];
      return;
    }
    // for freeze
    if (!desc.writable) {
      desc.writable = true;
      desc.configurable = true;
    }
    if (desc.get || desc.set)
      desc = {
        configurable: true,
        writable: true,
        enumerable: desc.enumerable,
        value: target[key],
      };
    Reflect.defineProperty(copy, key, desc);
  });
  return copy;
}

const propIsEnum = Object.prototype.propertyIsEnumerable;

export function shallowCopy(original: any, options?: Options<any, any>) {
  let markResult: any;
  if (Array.isArray(original)) {
    return Array.prototype.concat.call(original);
  } else if (original instanceof Set) {
    if (!isBaseSetInstance(original)) {
      const SubClass = Object.getPrototypeOf(original).constructor;
      return new SubClass(original.values());
    }
    return Set.prototype.difference
      ? Set.prototype.difference.call(original, new Set())
      : new Set(original.values());
  } else if (original instanceof Map) {
    if (!isBaseMapInstance(original)) {
      const SubClass = Object.getPrototypeOf(original).constructor;
      return new SubClass(original);
    }
    return new Map(original);
  } else if (
    options?.mark &&
    ((markResult = options.mark(original, dataTypes)),
    markResult !== undefined) &&
    markResult !== dataTypes.mutable
  ) {
    if (markResult === dataTypes.immutable) {
      return strictCopy(original);
    } else if (typeof markResult === 'function') {
      if (__DEV__ && (options.enablePatches || options.enableAutoFreeze)) {
        throw new Error(
          `You can't use mark and patches or auto freeze together.`
        );
      }
      return markResult();
    }
    throw new Error(`Unsupported mark result: ${markResult}`);
  } else if (
    typeof original === 'object' &&
    Object.getPrototypeOf(original) === Object.prototype
  ) {
    // For best performance with shallow copies,
    // don't use `Object.create(Object.getPrototypeOf(obj), Object.getOwnPropertyDescriptors(obj));` by default.
    const copy: Record<string | symbol, any> = {};
    Object.keys(original).forEach((key) => {
      copy[key] = original[key];
    });
    Object.getOwnPropertySymbols(original).forEach((key) => {
      if (propIsEnum.call(original, key)) {
        copy[key] = original[key];
      }
    });
    return copy;
  } else {
    throw new Error(
      `Please check mark() to ensure that it is a stable marker draftable function.`
    );
  }
}

export function ensureShallowCopy(target: ProxyDraft) {
  if (target.copy) return;
  target.copy = shallowCopy(target.original, target.options)!;
}

function deepClone<T>(target: T): T;
function deepClone(target: any) {
  if (!isDraftable(target)) return getValue(target);
  if (Array.isArray(target)) return target.map(deepClone);
  if (target instanceof Map) {
    const iterable = Array.from(target.entries()).map(([k, v]) => [
      k,
      deepClone(v),
    ]) as Iterable<readonly [any, any]>;
    if (!isBaseMapInstance(target)) {
      const SubClass = Object.getPrototypeOf(target).constructor;
      return new SubClass(iterable);
    }
    return new Map(iterable);
  }
  if (target instanceof Set) {
    const iterable = Array.from(target).map(deepClone);
    if (!isBaseSetInstance(target)) {
      const SubClass = Object.getPrototypeOf(target).constructor;
      return new SubClass(iterable);
    }
    return new Set(iterable);
  }
  const copy = Object.create(Object.getPrototypeOf(target));
  for (const key in target) copy[key] = deepClone(target[key]);
  return copy;
}

export function cloneIfNeeded<T>(target: T): T {
  return isDraft(target) ? deepClone(target) : target;
}

export { deepClone };
