import { makeCreator } from '../src';

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
