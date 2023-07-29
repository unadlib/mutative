import { makeCreator } from '../src';

test('check makeCreator options', () => {
  [
    [],
    null,
    0,
    1,
    '',
    'str',
    true,
    false,
    new Map(),
    new Set(),
    Symbol(''),
    function () {
      //
    },
  ].forEach((arg) => {
    expect(() => {
      // @ts-expect-error
      makeCreator(arg);
    }).toThrowError(`'options' should be an object.`);
  });
});

test('check enableAutoFreeze', () => {
  const create = makeCreator({
    enableAutoFreeze: true,
  });
  const baseState = { foo: { bar: 'str' }, arr: [] };
  const state = create(baseState, (draft) => {
    //
  });
  expect(Object.isFrozen(state)).toBeTruthy();
});
