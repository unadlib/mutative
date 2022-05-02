const readonlyDescriptors = {
  writable: false,
  enumerable: false,
  configurable: false,
};

function isFrozenOrPrimitive(target: any) {
  return (
    typeof target !== 'object' ||
    target === null ||
    target === undefined ||
    Object.isFrozen(target)
  );
}

export function deepFreeze(target: any) {
  if (Object.isFrozen(target)) return;
  if (target instanceof Map) {
    for (const [key, value] of target) {
      if (!isFrozenOrPrimitive(key)) {
        deepFreeze(key);
      }
      if (isFrozenOrPrimitive(value)) {
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
      if (isFrozenOrPrimitive(value)) {
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
      if (isFrozenOrPrimitive(value)) return;
      deepFreeze(value);
    }
  } else {
    Object.getOwnPropertyNames(target).forEach((name) => {
      const value = target[name];
      if (isFrozenOrPrimitive(value)) return;
      deepFreeze(value);
    });
  }
  Object.freeze(target);
}
