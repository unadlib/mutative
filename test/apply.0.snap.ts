import { create, apply } from '../index';

const baseState = { foo: { bar: 'str' }, arr: [] };
const [state, patches] = create(
  baseState,
  (draft) => {
    draft.foo.bar = 'str2';
  },
  { enablePatches: true }
);

expect(state).toEqual({ foo: { bar: 'str2' }, arr: [] });
expect(state).toEqual(apply(baseState, patches));

expect(state).toEqual({ foo: { bar: 'str2' }, arr: [] });
expect(state).toEqual(apply(baseState, patches));
