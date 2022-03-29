const readonlyDescriptors = {
  writable: false,
  enumerable: false,
  configurable: false,
};

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
    Object.getOwnPropertyNames(target).forEach((name) => {
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
  Object.freeze(target);
}
