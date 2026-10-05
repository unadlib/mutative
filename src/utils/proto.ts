export function has(target: object, key: PropertyKey) {
  return target instanceof Map
    ? target.has(key)
    : Object.prototype.hasOwnProperty.call(target, key);
}

export function getDescriptor(target: object, key: PropertyKey) {
  if (key in target) {
    let prototype = Reflect.getPrototypeOf(target);
    while (prototype) {
      const descriptor = Reflect.getOwnPropertyDescriptor(prototype, key);
      if (descriptor) return descriptor;
      prototype = Reflect.getPrototypeOf(prototype);
    }
  }
  return;
}

/**
 * Whether `concat` and the array methods treat `array` like any array: no
 * subclass, and no own `constructor` or `Symbol.isConcatSpreadable` that
 * changes what `concat` creates.
 */
export function isPlainArray(array: any[]) {
  return (
    !Object.prototype.hasOwnProperty.call(array, 'constructor') &&
    !Object.prototype.hasOwnProperty.call(array, Symbol.isConcatSpreadable) &&
    Object.getPrototypeOf(array) === Array.prototype
  );
}

export function isBaseSetInstance(obj: any) {
  return Object.getPrototypeOf(obj) === Set.prototype;
}

export function isBaseMapInstance(obj: any) {
  return Object.getPrototypeOf(obj) === Map.prototype;
}
