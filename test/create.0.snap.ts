import { create } from '../index';

const baseState = { foo: { bar: 'str' }, arr: [] };
const state = create(
  baseState,
  (draft) => {
    draft.foo.bar = 'str2';
  },
);

expect(state).toEqual({ foo: { bar: 'str2' }, arr: [] });
expect(state).not.toBe(baseState);
expect(state.foo).not.toBe(baseState.foo);
expect(state.arr).toBe(baseState.arr);
