import { dataTypes } from '../constant';

const constructorString = Object.prototype.constructor.toString();
/**
 * Check if the value is a simple object(No prototype chain object or iframe same-origin object),
 * support case: https://github.com/unadlib/mutative/issues/17
 */
const isSimpleObject = (value: unknown) => {
  if (!value || typeof value !== 'object') return false;
  const prototype = Object.getPrototypeOf(value);
  if (prototype === null) {
    return true;
  }
  const constructor =
    Object.hasOwnProperty.call(prototype, 'constructor') &&
    prototype.constructor;

  if (constructor === Object) return true;

  return (
    typeof constructor === 'function' &&
    Function.toString.call(constructor) === constructorString
  );
};

export const markSimpleObject = (value: unknown) => {
  if (isSimpleObject(value)) {
    return dataTypes.immutable;
  }
  return;
};
