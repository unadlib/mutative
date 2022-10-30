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
