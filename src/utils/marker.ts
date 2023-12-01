const isSimpleObject = (value: unknown) => {
  const prototype = Object.getPrototypeOf(value);
  if (prototype === null) {
    return true;
  }
  const constructor =
    Object.hasOwnProperty.call(prototype, 'constructor') &&
    prototype.constructor;
  return (
    typeof constructor === 'function' &&
    Function.toString.call(constructor) ===
      Object.prototype.constructor.toString()
  );
};

export const markSimpleObject = (value: unknown) => {
  if (isSimpleObject(value)) {
    return 'immutable';
  }
};
