export function has(target: object, property: PropertyKey): boolean {
  return Object.prototype.hasOwnProperty.call(target, property);
}

export function getDescriptor(
  target: object,
  property: PropertyKey
): PropertyDescriptor | undefined {
  if (property in target) {
    let prototype = Reflect.getPrototypeOf(target);
    while (prototype) {
      const descriptor = Reflect.getOwnPropertyDescriptor(prototype, property);
      if (descriptor) return descriptor;
      prototype = Reflect.getPrototypeOf(prototype);
    }
  }
}

const objectConstructorString = Object.prototype.constructor.toString();

export function isPlainObject(target: any): boolean {
  if (!target || typeof target !== 'object') return false;
  const prototype = Object.getPrototypeOf(target);
  if (prototype === null) {
    return true;
  }
  const constructor =
    Object.hasOwnProperty.call(prototype, 'constructor') &&
    prototype.constructor;
  return (
    constructor === Object ||
    (typeof constructor == 'function' &&
      Function.toString.call(constructor) === objectConstructorString)
  );
}
