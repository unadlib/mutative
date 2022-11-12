import { DraftType } from '../constant';
import { getType } from './draft';

export function forEach(target: any, iterator: any, enumerableOnly = false) {
  if (getType(target) === DraftType.Object) {
    const keys = (enumerableOnly ? Object.keys : Reflect.ownKeys)(target);
    keys.forEach((key) => {
      iterator(key, target[key], target);
    });
  } else {
    target.forEach((value: any, key: any) => iterator(key, value, target));
  }
}

const readonlyDescriptors = {
  writable: false,
  enumerable: false,
  configurable: false,
};

// TODO: refactor for better performance
export function deepFreeze(target: any) {
  if (Object.isFrozen(target)) return;
  if (target instanceof Map) {
    for (const [key, value] of target) {
      if (
        !(
          typeof key !== 'object' ||
          key === null ||
          key === undefined ||
          Object.isFrozen(key)
        )
      ) {
        deepFreeze(key);
      }
      if (
        typeof value !== 'object' ||
        value === null ||
        value === undefined ||
        Object.isFrozen(value)
      ) {
        continue;
      }
      deepFreeze(value);
    }
    Object.defineProperties(target, {
      set: {
        ...readonlyDescriptors,
        value(key: any) {
          throw new Error(`Cannot set property ${key}, map is not extensible`);
        },
      },
      clear: {
        ...readonlyDescriptors,
        value() {
          throw new Error(`Cannot clear map, map is frozen`);
        },
      },
      delete: {
        ...readonlyDescriptors,
        value(key: any) {
          throw new Error(`Cannot delete property ${key}, map is frozen`);
        },
      },
    });
  } else if (target instanceof Set) {
    for (const value of target) {
      if (
        typeof value !== 'object' ||
        value === null ||
        value === undefined ||
        Object.isFrozen(value)
      ) {
        continue;
      }
      deepFreeze(value);
    }
    Object.defineProperties(target, {
      add: {
        ...readonlyDescriptors,
        value(value: any) {
          throw new Error(`Cannot add ${value}, set is not extensible`);
        },
      },
      clear: {
        ...readonlyDescriptors,
        value() {
          throw new Error(`Cannot clear set, set is frozen`);
        },
      },
      delete: {
        ...readonlyDescriptors,
        value(key: any) {
          throw new Error(`Cannot delete property ${key}, set is frozen`);
        },
      },
    });
  } else if (Array.isArray(target)) {
    Object.freeze(target);
    for (const value of target) {
      if (
        typeof value !== 'object' ||
        value === null ||
        value === undefined ||
        Object.isFrozen(value)
      )
        return;
      deepFreeze(value);
    }
  } else {
    Object.freeze(target);
    // ignore non-enumerable or symbol properties
    Object.keys(target).forEach((name) => {
      const value = target[name];
      if (
        typeof value !== 'object' ||
        value === null ||
        value === undefined ||
        Object.isFrozen(value)
      )
        return;
      deepFreeze(value);
    });
  }
}
