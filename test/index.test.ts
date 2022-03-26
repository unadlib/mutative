import { create } from '../src';

describe('base', () => {
  test('object', () => {
    const data = {
      foo: {
        bar: 'str',
      },
      foobar: {},
    };

    const { state } = create(data, (draft) => {
      draft.foo.bar = 'new str';
    });
    expect(state).toEqual({ foo: { bar: 'new str' }, foobar: {} });
    expect(
      state !==
        {
          foo: {
            bar: 'str',
          },
          foobar: {},
        }
    ).toBeTruthy();
    expect(state).not.toBe(data);
    expect(state.foo).not.toBe(data.foo);
    expect(state.foobar).toBe(data.foobar);
  });

  test('delete key in object', () => {
    const data = {
      foo: {
        bar: {
          b: 'str',
        },
      },
      foobar: {
        bar: 'str',
      },
    };

    const { state, inversePatches, patches } = create(
      data,
      (draft) => {
        draft.foo.bar.b = 'new str';
        // @ts-ignore
        delete draft.foo.bar;
      },
      {
        enablePatches: true,
      }
    );
    expect(state).toEqual({ foo: {}, foobar: { bar: 'str' } });
    expect(
      state !==
        ({
          foo: {},
          foobar: { bar: 'str' },
        } as any)
    ).toBeTruthy();
    expect(state !== data).toBeTruthy();
    expect(state.foo !== data.foo).toBeTruthy();
    expect(state.foobar === data.foobar).toBeTruthy();
  });

  test('object case1', () => {
    const data = {
      foo: {
        bar: {
          baz: 'baz',
        },
      },
      foobar: {},
    };

    const { state } = create(data, (draft) => {
      const foo = draft.foo;
      draft.foobar;
      foo.bar = { baz: 'new baz' };
    });
    expect(state).toEqual({ foo: { bar: { baz: 'new baz' } }, foobar: {} });
  });

  test('object case2', () => {
    const d = { e: 1 };
    const baseState = { a: { b: { c: { d } } }, f: { d } };
    const { state } = create(baseState, (draft) => {
      const a = draft.a.b;
      // @ts-ignore
      draft.x = a;
      a.c.d.e = 2;
    });
    // @ts-ignore
    expect(state.x === state.a.b).toBeTruthy();
  });

  test('object case3', () => {
    const d = { e: 1 };
    const baseState = { a: { c: { e: 2 }, b: { c: { d } } }, f: { d } };
    const { state } = create(baseState, (draft) => {
      const a = draft.a.c;
      // @ts-ignore
      draft.x = a;
      const c = draft.a.b;
      // @ts-ignore
      c.c.d.e = 2;
    });
    expect(state).toEqual({
      a: { c: { e: 2 }, b: { c: { d: { e: 2 } } } },
      f: { d: { e: 1 } },
      x: { e: 2 },
    });
    // @ts-ignore
    expect(state.x === state.a.c).toBeTruthy();
  });

  test('performance', () => {
    const baseState: any = {};
    Array(10 ** 5)
      .fill(1)
      .forEach((_, i) => {
        baseState[i] = { i };
      });
    console.time();
    const state = create(baseState, (draft) => {
      draft[0].c = { i: 0 };
    });
    console.timeEnd();
  });

  test('base array', () => {
    const data = {
      list: ['foo'],
      bar: {},
    };

    const { state, patches, inversePatches } = create(
      data,
      (draft) => {
        draft.list.push('bar');
        // Array.prototype.push.call(draft.list, 'bar');
      },
      {
        enablePatches: false,
      }
    );
    expect(state).toEqual({ list: ['foo', 'bar'], bar: {} });
    expect(
      state !==
        {
          list: ['foo', 'bar'],
          bar: {},
        }
    ).toBeTruthy();
    expect(state !== data).toBeTruthy();
    expect(state.list !== data.list).toBeTruthy();
    expect(state.bar === data.bar).toBeTruthy();
  });

  test('base array set', () => {
    const data = {
      list: ['foo'],
      bar: {},
    };

    const { state, patches, inversePatches } = create(
      data,
      (draft) => {
        draft.list[1] = 'bar';
      },
      {
        enablePatches: true,
      }
    );
    expect(state).toEqual({ list: ['foo', 'bar'], bar: {} });
    expect(
      state !==
        {
          list: ['foo', 'bar'],
          bar: {},
        }
    ).toBeTruthy();
    expect(state !== data).toBeTruthy();
    expect(state.list !== data.list).toBeTruthy();
    expect(state.bar === data.bar).toBeTruthy();
  });

  test('base array set with object', () => {
    const data = {
      list: [{ a: 1 }, { a: 2 }, { a: 3 }],
      bar: {},
    };

    const { state, patches, inversePatches } = create(
      data,
      (draft) => {
        draft.list[1].a = 4;
      },
      {
        enablePatches: false,
      }
    );
    expect(state).toEqual({ list: [{ a: 1 }, { a: 4 }, { a: 3 }], bar: {} });
    expect(
      state !==
        {
          list: [{ a: 1 }, { a: 4 }, { a: 3 }],
          bar: {},
        }
    ).toBeTruthy();
    expect(state !== data).toBeTruthy();
    expect(state.list !== data.list).toBeTruthy();
    expect(state.bar === data.bar).toBeTruthy();
    expect(state.list[0] === data.list[0]).toBeTruthy();
  });
});
