import { draftify } from '../src';

describe('draftify', () => {
  const getBaseState = () => ({
    foobar: { foo: 'str', bar: 'str' },
    baz: { text: 'str' },
  });
  const expectedResult = {
    foobar: { foo: 'str', bar: 'baz' },
    baz: { text: 'str' },
  };
  test('base draftify', () => {
    const baseState = getBaseState();
    const [draft, finalize] = draftify(baseState);
    draft.foobar.bar = 'baz';
    const state = finalize();
    expect(state).toEqual(expectedResult);
    expect(state).not.toBe(baseState);
    expect(state.foobar).not.toBe(baseState.foobar);
    expect(state.baz).toBe(baseState.baz);
  });

  test('draftify with enableAutoFreeze', () => {
    const baseState = getBaseState();
    const [draft, finalize] = draftify(baseState, { enableAutoFreeze: true });
    draft.foobar.bar = 'baz';
    const state = finalize();
    expect(state).toEqual(expectedResult);
    expect(state).not.toBe(baseState);
    expect(state.foobar).not.toBe(baseState.foobar);
    expect(state.baz).toBe(baseState.baz);
    expect(() => {
      // @ts-expect-error
      state.foobar.bar = 'new baz';
    }).toThrowError();
  });

  test('draftify with enablePatches', () => {
    const baseState = getBaseState();
    const [draft, finalize] = draftify(baseState, { enablePatches: true });
    draft.foobar.bar = 'baz';
    const [state, patches, inversePatches] = finalize();
    expect(state).toEqual(expectedResult);
    expect(state).not.toBe(baseState);
    expect(state.foobar).not.toBe(baseState.foobar);
    expect(state.baz).toBe(baseState.baz);
    expect(patches).toEqual([
      [['object', 'set'], [['foobar', 'bar']], ['baz']],
    ]);
    expect(inversePatches).toEqual([
      [['object', 'set'], [['foobar', 'bar']], ['str']],
    ]);
  });

  test('draftify with enableAutoFreeze and enablePatches', () => {
    const baseState = getBaseState();
    const [draft, finalize] = draftify(baseState, {
      enablePatches: true,
      enableAutoFreeze: true,
    });
    draft.foobar.bar = 'baz';
    const [state, patches, inversePatches] = finalize();
    expect(state).toEqual(expectedResult);
    expect(state).not.toBe(baseState);
    expect(state.foobar).not.toBe(baseState.foobar);
    expect(state.baz).toBe(baseState.baz);
    expect(patches).toEqual([
      [['object', 'set'], [['foobar', 'bar']], ['baz']],
    ]);
    expect(inversePatches).toEqual([
      [['object', 'set'], [['foobar', 'bar']], ['str']],
    ]);
    expect(() => {
      // @ts-expect-error
      state.foobar.bar = 'new baz';
    }).toThrowError();
  });

  test('draftify with undraftable state', () => {
    class Foo {
      bar = 'str';
    }
    const baseState = new Foo();
    expect(() => {
      draftify(baseState);
    }).toThrowError(
      `create() only supports plain object, array, set, and map.`
    );
  });

  test('draftify with draftable state and hook', () => {
    class Foo {
      bar = {
        baz: 'str',
      };
    }
    const baseState = new Foo();
    const [draft, finalize] = draftify(baseState, {
      hook: (target) => {
        if (target instanceof Foo) return 'immutable';
      },
    });
    draft.bar.baz = 'baz';
    const state = finalize();
    expect(state).not.toBe(baseState);
    expect(state).toBeInstanceOf(Foo);
  });

  test('draftify with hook', () => {
    const baseState = getBaseState();
    const [draft, finalize] = draftify(baseState, {
      hook: (target) => {
        if (target === baseState.baz) return 'mutable';
      },
    });
    draft.baz.text = 'baz';
    const state = finalize();
    expect(state).toBe(baseState);
  });
});
