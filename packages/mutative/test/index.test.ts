import { create } from "../src";

describe("", () => {
  test("", () => {
    const data = {
      foo: {
        bar: "str",
      },
      arr: [
        {
          id: "0",
          text: "text",
        },
      ],
    };

    const state = create(data, (draft) => {
      draft.foo.bar = "new str";
      // draft.arr.push({
      //   id: "1",
      //   text: "new text",
      // });
    });
    console.log(state);
  });
});
