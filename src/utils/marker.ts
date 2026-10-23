import { dataTypes } from '../constant';

const constructorString = /* @__PURE__ */ (() =>
  Object.prototype.constructor.toString())();
// Whether a value is a plain object, an object without a prototype, or a plain
// object of another realm, such as a same-origin iframe, whose constructor is
// that realm's `Object`.
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

/**
 * A `mark` that drafts plain objects, objects without a prototype and plain
 * objects of other realms, such as same-origin iframes.
 */
export const markSimpleObject = (value: unknown) => {
  if (isSimpleObject(value)) {
    return dataTypes.immutable;
  }
  return;
};
