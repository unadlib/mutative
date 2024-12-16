/**
 * inlined Object.is polyfill to avoid requiring consumers ship their own
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
 * (copied from React)
 */
function is(x: any, y: any) {
  return (
    (x === y && (x !== 0 || 1 / x === 1 / y)) || (x !== x && y !== y) // eslint-disable-line no-self-compare
  );
}

/**
 * Object.is but with implicit polyfill if necessary
 * (copied from React)
 */
export const objectIs = typeof Object.is === 'function' ? Object.is : is;
