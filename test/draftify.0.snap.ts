import { draftify } from '../index';

const baseState = { foo: { bar: 'str' }, arr: [] };
const [draft, finalize] = draftify(baseState);
draft.foo.bar = 'str2';
const state = finalize();

expect(state).toEqual({ foo: { bar: 'str2' }, arr: [] });
expect(state).not.toBe(baseState);
expect(state.foo).not.toBe(baseState.foo);
expect(state.arr).toBe(baseState.arr);
