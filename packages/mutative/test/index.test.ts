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
});
