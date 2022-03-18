import { create } from "../src";

describe("", () => {
  test("", () => {
    const data = {
      foo: {
        bar: "str",
      },
      foobar: {},
      // arr: [
      //   {
      //     id: "0",
      //     text: "text",
      //   },
      // ],
    };

    const state = create(data, (draft) => {
      draft.foo.bar = "new str";
      // draft.arr.push({
      //   id: "1",
      //   text: "new text",
      // });
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

  test("", () => {
    const data = {
      foo: {
        bar: {
          baz: "baz",
        },
      },
      foobar: {},
    };

    const state = create(data, (draft) => {
      const foo = draft.foo;
      draft.foobar;
      foo.bar = { baz: "new baz" };
    });
    expect(state).toEqual({ foo: { bar: { baz: "new baz" } }, foobar: {} });
  });
});
