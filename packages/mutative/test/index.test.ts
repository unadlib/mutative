import { create } from "../src";

describe("base", () => {
  test("object", () => {
    const data = {
      foo: {
        bar: "str",
      },
      foobar: {},
    };

    const { state } = create(data, (draft) => {
      draft.foo.bar = "new str";
    });
    expect(state).toEqual({ foo: { bar: "new str" }, foobar: {} });
    expect(
      state !==
        {
          foo: {
            bar: "str",
          },
          foobar: {},
        }
    ).toBeTruthy();
    expect(state !== data).toBeTruthy();
    expect(state.foo !== data.foo).toBeTruthy();
    expect(state.foobar === data.foobar).toBeTruthy();
  });

  test("object case1", () => {
    const data = {
      foo: {
        bar: {
          baz: "baz",
        },
      },
      foobar: {},
    };

    const {state} = create(data, (draft) => {
      const foo = draft.foo;
      draft.foobar;
      foo.bar = { baz: "new baz" };
    });
    expect(state).toEqual({ foo: { bar: { baz: "new baz" } }, foobar: {} });
  });

  test("object case2", () => {
    const d = { e: 1 };
    const baseState = { a: { b: { c: { d } } }, f: { d } };
    const { state } = create(baseState, (draft) => {
      const a = draft.a;
      // @ts-ignore
      draft.x = a;
    });
    expect(state).toEqual({
      a: {
        b: {
          c: {
            d: {
              e: 1,
            },
          },
        },
      },
      f: {
        d: {
          e: 1,
        },
      },
      x: {
        b: {
          c: {
            d: {
              e: 1,
            },
          },
        },
      },
    });
    // @ts-ignore
    expect(state.x === state.a).toBeTruthy();
  });

  test("object case3", () => {
    const d = { e: 1 };
    const baseState = { a: { b: { c: { d } } }, f: { d } };
    const { state } = create(baseState, (draft) => {
      const a = draft.a;
      // @ts-ignore
      draft.x = a;
      const c = draft.a.b;
      // @ts-ignore
      c.d = 2;
    });
    expect(state).toEqual({
      a: {
        b: {
          c: {
            d: {
              e: 1,
            },
          },
          d: 2,
        },
      },
      f: {
        d: {
          e: 1,
        },
      },
      x: {
        b: {
          c: {
            d: {
              e: 1,
            },
          },
          d: 2,
        },
      },
    });
    // @ts-ignore
    expect(state.x === state.a).toBeTruthy();
  });
});
