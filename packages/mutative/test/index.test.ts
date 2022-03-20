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

  test("delete key in object", () => {
    const data = {
      foo: {
        bar: "str",
      },
      foobar: {
        bar: "str",
      },
    };

    const { state } = create(data, (draft) => {
      // @ts-ignore
      delete draft.foo.bar;
    });
    expect(state).toEqual({ foo: {}, foobar: { bar: "str" } });
    expect(
      state !==
        ({
          foo: {},
          foobar: { bar: "str" },
        } as any)
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

    const { state } = create(data, (draft) => {
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
      const a = draft.a.b;
      // @ts-ignore
      draft.x = a;
      a.c.d.e = 2;
    });
    // @ts-ignore
    expect(state.x === state.a.b).toBeTruthy();
  });

  test("object case3", () => {
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

  test("performance", () => {
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
});
