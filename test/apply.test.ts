import { create, apply } from '../src';

test('object', () => {
  const data = {
    foo: {
      bar: 'str',
    },
    foobar: {
      baz: 'str',
    },
  };

  const [state, patches, inversePatches] = create(
    data,
    (draft) => {
      draft.foo.bar = 'new str';
    },
    {
      enablePatches: true,
    }
  );
  expect(state).toEqual({
    foo: { bar: 'new str' },
    foobar: { baz: 'str' },
  });
  expect(state).not.toBe(data);
  expect(state.foo).not.toBe(data.foo);
  expect(state.foobar).toBe(data.foobar);
  const prevState = apply(state, inversePatches);
  expect(prevState).toEqual(data);
  const nextState = apply(prevState, patches);
  expect(nextState).toEqual(state);
});

test('object assign ref', () => {
  const data = {
    foo: {
      bar: 'str',
    },
    foobar: {
      baz: 'str',
    },
  };

  const [state, patches, inversePatches] = create(
    data,
    (draft: any) => {
      draft.foobar.foo = draft.foo;
      draft.foo.bar = 'new str';
    },
    {
      enablePatches: true,
    }
  );
  expect(state).toEqual({
    foo: { bar: 'new str' },
    foobar: {
      baz: 'str',
      foo: { bar: 'new str' },
    },
  });
  expect(state).not.toBe(data);
  expect(state.foo).not.toBe(data.foo);
  expect(state.foobar).not.toBe(data.foobar);
  expect(patches).toEqual([
    [['object', 'set'], ['foobar', 'foo'], [['__MUTATIVE__', 'foo']]],
    [['object', 'set'], ['foo', 'bar'], ['new str']],
  ]);
  expect(inversePatches).toEqual([
    [['object', 'set'], ['foo', 'bar'], ['str']],
    [['object', 'delete'], ['foobar', 'foo'], []],
  ]);
  const prevState = apply(state, inversePatches);
  expect(prevState).toEqual(data);
  const nextState = apply(prevState, patches);
  expect(nextState).toEqual(state);
});

