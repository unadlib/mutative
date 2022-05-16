import { current, draftify } from '../src';

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
  // todo: fix
  test.skip('draftify with draftable state and hook', () => {
    class BaseFoo {
      _bar = {
        baz: 'str',
      };

      get bar() {
        return this._bar;
      }

      set bar(value) {
        this._bar = value;
      }
    }

    class Foo extends BaseFoo {}
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

  test('multiple drafts with draftify', () => {
    const data = {
      foo: {
        bar: 'str',
      } as any,
      foobar: {},
    };
    const data1 = {
      foo1: {
        bar1: 'str1',
      },
      foobar1: {},
    };

    const [draft, finalize] = draftify(data);
    const [draft1, finalize1] = draftify(data1);
    draft.foo.bar = 'new str';
    draft1.foo1.bar1 = 'new str1';
    draft.foo.b = current(draft1.foo1);
    const state = finalize();
    draft1.foo1.bar1 = 'new str2';
    const state1 = finalize1();
    expect(state).toEqual({
      foo: { bar: 'new str', b: { bar1: 'new str1' } },
      foobar: {},
    });
    expect(state.foo.b).not.toBe(state1.foo1);
    expect(state1).toEqual({
      foo1: {
        bar1: 'new str2',
      },
      foobar1: {},
    });
    expect(state).not.toBe(data);
    expect(state.foo).not.toBe(data.foo);
    expect(state.foobar).toBe(data.foobar);

    expect(state1).not.toBe(data1);
    expect(state1.foo1).not.toBe(data1.foo1);
    expect(state1.foobar1).toBe(data1.foobar1);
  });
});
