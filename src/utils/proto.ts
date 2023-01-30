/* eslint-disable no-useless-return */
/* eslint-disable consistent-return */
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
