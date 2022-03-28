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
