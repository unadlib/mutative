import { create, current } from '../src';

describe('Currying', () => {
  const getBaseState = () => ({
    foobar: { foo: 'str', bar: 'str' },
    baz: { text: 'str' },
  });
  const expectedResult = {
    foobar: { foo: 'str', bar: 'baz' },
    baz: { text: 'str' },
  };
  test('base Currying', () => {
    const baseState = getBaseState();
    const [draft, finalize] = create(baseState);
    draft.foobar.bar = 'baz';
    const state = finalize();
    expect(state).toEqual(expectedResult);
    expect(state).not.toBe(baseState);
    expect(state.foobar).not.toBe(baseState.foobar);
    expect(state.baz).toBe(baseState.baz);
  });

  test('Currying with enableAutoFreeze', () => {
    const baseState = getBaseState();
    const [draft, finalize] = create(baseState, { enableAutoFreeze: true });
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

  test('Currying with enablePatches', () => {
    const baseState = getBaseState();
    const [draft, finalize] = create(baseState, { enablePatches: true });
    draft.foobar.bar = 'baz';
    const [state, patches, inversePatches] = finalize();
    expect(state).toEqual(expectedResult);
    expect(state).not.toBe(baseState);
    expect(state.foobar).not.toBe(baseState.foobar);
    expect(state.baz).toBe(baseState.baz);
    expect(patches).toEqual([
      {
        op: 'replace',
        path: ['foobar', 'bar'],
        value: 'baz',
      },
    ]);
    expect(inversePatches).toEqual([
      {
        op: 'replace',
        path: ['foobar', 'bar'],
        value: 'str',
      },
    ]);
  });

  test('Currying with enableAutoFreeze and enablePatches', () => {
    const baseState = getBaseState();
    const [draft, finalize] = create(baseState, {
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
      {
        op: 'replace',
        path: ['foobar', 'bar'],
        value: 'baz',
      },
    ]);
    expect(inversePatches).toEqual([
      {
        op: 'replace',
        path: ['foobar', 'bar'],
        value: 'str',
      },
    ]);
    expect(() => {
      // @ts-expect-error
      state.foobar.bar = 'new baz';
    }).toThrowError();
  });

  test('Currying with undraftable state', () => {
    class Foo {
      bar = 'str';
    }
    const baseState = new Foo();
    expect(() => {
      create(baseState);
    }).toThrowErrorMatchingInlineSnapshot(
      `"Invalid base state: create() only supports plain objects, arrays, Set, Map or using mark() to mark the state as immutable."`
    );
  });
  test('Currying with draftable state and hook', () => {
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
    const [draft, finalize] = create(baseState, {
      mark: (target) => {
        if (target instanceof Foo) return 'immutable';
      },
    });
    draft.bar.baz = 'baz';
    const state = finalize();
    expect(state).not.toBe(baseState);
    expect(state).toBeInstanceOf(Foo);
  });

  test('Currying with hook', () => {
    const baseState = getBaseState();
    const [draft, finalize] = create(baseState, {
      mark: (target) => {
        if (target === baseState.baz) return 'mutable';
      },
    });
    draft.baz.text = 'baz';
    const state = finalize();
    expect(state).toBe(baseState);
  });

  test('multiple drafts with Currying', () => {
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

    const [draft, finalize] = create(data);
    const [draft1, finalize1] = create(data1);
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

  test('Currying a draft', () => {
    create({ a: 1 }, (draft) => {
      expect(() => create(draft)).not.toThrowError();
    });
  });

  test('Currying with mutable', () => {
    const baseState = { a: 1 };
    const [draft, finalize] = create(baseState, {
      mark: (target, { mutable }) => {
        if (target === baseState) return mutable;
      },
    });
    draft.a = 2;
    expect(finalize()).toBe(baseState);
  });

  test('Currying with mutable and enablePatches', () => {
    const baseState = { a: 1 };
    const [draft, finalize] = create(baseState, {
      mark: (target, { mutable }) => {
        if (target === baseState) return mutable;
      },
      enablePatches: true,
    });
    draft.a = 2;
    const [state, patches, inversePatches] = finalize();
    expect(state).toBe(baseState);
    expect(patches).toEqual([]);
    expect(inversePatches).toEqual([]);
  });

  test('async create with mutable', async () => {
    const baseState = { a: 1 };
    const state = await create(
      baseState,
      async (draft) => {
        draft.a = 2;
      },
      {
        mark: (target, { mutable }) => {
          if (target === baseState) return mutable;
        },
      }
    );
    expect(state).toBe(baseState);
  });

  test('async create with mutable and enablePatches', async () => {
    const baseState = { a: 1 };
    const [state, patches, inversePatches] = await create(
      baseState,
      async (draft) => {
        draft.a = 2;
      },
      {
        mark: (target, { mutable }) => {
          if (target === baseState) return mutable;
        },
        enablePatches: true,
      }
    );
    expect(state).toBe(baseState);
    expect(patches).toEqual([]);
    expect(inversePatches).toEqual([]);
  });

  test('base producer', async () => {
    const baseState = {
      foo: {
        bar: 'str',
      },
      list: [],
    };
    const producer = create(
      (draft: {
        foo: {
          bar: string;
        };
        list: any[];
      }) => {
        draft.foo.bar = 'baz';
      }
    );
    const state = producer(baseState);
    expect(state).not.toBe(baseState);
    expect(state.foo).not.toBe(baseState.foo);
    expect(state.list).toBe(baseState.list);
    expect(state).toEqual({
      foo: {
        bar: 'baz',
      },
      list: [],
    });
  });

  test(`async producer with 'enableAutoFreeze' option`, async () => {
    const baseState = {
      foo: {
        bar: 'str',
      },
      list: [],
    };
    const producer = create(
      async (draft: {
        foo: {
          bar: string;
        };
        list: any[];
      }) => {
        draft.foo.bar = 'baz';
      },
      {
        enableAutoFreeze: true,
      }
    );
    const state = await producer(baseState);
    expect(Object.isFrozen(state)).toBeTruthy();
    expect(state).not.toBe(baseState);
    expect(state.foo).not.toBe(baseState.foo);
    expect(state.list).toBe(baseState.list);
    expect(state).toEqual({
      foo: {
        bar: 'baz',
      },
      list: [],
    });
  });

  test(`producer with 'enablePatches' option`, async () => {
    const baseState = {
      foo: {
        bar: 'str',
      },
      list: [],
    };
    const producer = create(
      (draft: {
        foo: {
          bar: string;
        };
        list: any[];
      }) => {
        draft.foo.bar = 'baz';
      },
      {
        enablePatches: true,
      }
    );
    const [state, patches, inversePatches] = producer(baseState);
    expect(patches).toMatchInlineSnapshot(`
      [
        {
          "op": "replace",
          "path": [
            "foo",
            "bar",
          ],
          "value": "baz",
        },
      ]
    `);
    expect(inversePatches).toMatchInlineSnapshot(`
      [
        {
          "op": "replace",
          "path": [
            "foo",
            "bar",
          ],
          "value": "str",
        },
      ]
    `);
    expect(state).not.toBe(baseState);
    expect(state.foo).not.toBe(baseState.foo);
    expect(state.list).toBe(baseState.list);
    expect(state).toEqual({
      foo: {
        bar: 'baz',
      },
      list: [],
    });
  });
});

test(`check Primitive type`, () => {
  class Foo {}
  [
    -1,
    1,
    0,
    NaN,
    BigInt(1),
    Infinity,
    '',
    'test',
    null,
    true,
    false,
    undefined,
    Symbol('foo'),
    new Date(),
    new Foo(),
    new WeakMap(),
    new WeakSet(),
  ].forEach((value: any) => {
    expect(() => create(value)).toThrowError();
  });
});

test(`check Primitive type with patches`, () => {
  class Foo {}
  [
    -1,
    1,
    0,
    NaN,
    BigInt(1),
    Infinity,
    '',
    'test',
    null,
    true,
    false,
    undefined,
    Symbol('foo'),
    new Date(),
    new Foo(),
    new WeakMap(),
    new WeakSet(),
  ].forEach((value: any) => {
    expect(() => create(value, { enablePatches: true })).toThrowError();
  });
});
