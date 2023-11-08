/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-param-reassign */
/* eslint-disable no-lone-blocks */
import {
  produce,
  enableMapSet,
  setAutoFreeze,
  Immutable,
  produceWithPatches,
  enablePatches,
  applyPatches,
} from 'immer';
import { create, apply } from '../src';

enableMapSet();

beforeEach(() => {
  setAutoFreeze(true);
});

test('Set draft constructor is not equal to Set', () => {
  {
    const data = new Set([1, 2, 3]);

    produce(data, (draft) => {
      expect(draft.constructor).not.toBe(Set);
    });
  }

  {
    const data = new Set([1, 2, 3]);
    create(data, (draft) => {
      expect(draft.constructor).toBe(Set);
    });
  }
});

test('Map draft constructor is not equal to Map', () => {
  {
    const data = new Map([[1, 'a']]);
    produce(data, (draft) => {
      expect(draft.constructor).not.toBe(Map);
    });
  }

  {
    const data = new Map([[1, 'a']]);
    create(data, (draft) => {
      expect(draft.constructor).toBe(Map);
    });
  }
});

test('Unexpected operation check of Set draft', () => {
  {
    const data = new Set([1]);

    // ! it should throw an error
    expect(() => {
      produce(data, (draft) => {
        // @ts-ignore
        draft.x = 1;
      });
    }).not.toThrowError();
  }
  {
    const data = new Set([1]);
    expect(() => {
      create(data, (draft) => {
        // @ts-ignore
        draft.x = 1;
      });
    }).toThrowError(`Map/Set draft does not support any property assignment.`);
  }
});

test('Unexpected operation check of Map draft', () => {
  {
    const data = new Map([[1, 'a']]);

    // ! it should throw an error
    expect(() => {
      produce(data, (draft) => {
        // @ts-ignore
        draft.x = 1;
      });
    }).not.toThrowError();
  }

  {
    const data = new Map([[1, 'a']]);
    expect(() => {
      create(data, (draft) => {
        // @ts-ignore
        draft.x = 1;
      });
    }).toThrowError(`Map/Set draft does not support any property assignment.`);
  }
});

test('immer failed case - freeze Map key', () => {
  {
    setAutoFreeze(true);
    const base = new Map<{ a: number }, number>([[{ a: 1 }, 1]]);
    const state: Immutable<Map<{ a: number }, number>> = produce(
      base,
      (draft) => {
        draft.values().next().value = 2;
      }
    );

    // ! it should throw error about freeze
    expect(() => {
      // @ts-ignore
      Array.from(state.keys())[0].a = 2;
    }).not.toThrowError();
  }

  {
    const base = new Map<{ a: number }, number>([[{ a: 1 }, 1]]);
    const state = create(
      base,
      (draft) => {
        draft.values().next().value = 2;
      },
      {
        enableAutoFreeze: true,
      }
    );

    expect(() => {
      // @ts-ignore
      Array.from(state.keys())[0].a = 2;
    }).toThrowError();
  }
});

test('immer failed case - escaped draft', () => {
  {
    setAutoFreeze(false);
    const dataSet = [{}, {}, {}] as any;
    const data = {
      data: null,
      a: {
        b: 1,
      },
    };
    const state = produce(data, (draft) => {
      draft.data = dataSet;
      const a = draft.a;
      dataSet[0] = a;
      dataSet[1].a = { b: 1, c: [a] };
      draft.a.b = 2;
    });

    expect(() => {
      JSON.stringify(state);
    }).toThrowError();
  }

  {
    const dataSet = [{}, {}, {}] as any;
    const data = {
      data: null,
      a: {
        b: 1,
      },
    };
    const state = create(data, (draft) => {
      draft.data = dataSet;
      const a = draft.a;
      dataSet[0] = a;
      dataSet[1].a = { b: 1, c: [a] };
      draft.a.b = 2;
    });

    expect(() => {
      JSON.stringify(state);
    }).not.toThrowError();
  }
});

test('immer failed case - escaped draft about return value', () => {
  {
    setAutoFreeze(false);
    const dataSet = [{}, {}, {}] as any;
    const data = {
      data: null,
      a: {
        b: 1,
        c: 1,
      },
    };
    const producer = produce((draft: any) => {
      const a = draft.a;
      dataSet[0] = a;
      dataSet[1].a = { b: 1, c: [a] };
      draft.a.b = 2;
      draft.a.c = 2;
      return {
        ...dataSet,
      };
    });

    expect(() => {
      JSON.stringify(producer(data));
    }).toThrowError();
  }
});

// https://github.com/immerjs/immer/issues/1012
test('Unexpected access to getter property in irrelevant plain objects', () => {
  {
    setAutoFreeze(false);

    let isAgeGetterCalled = false;

    const state = {
      data: {
        data: {
          lisa: {
            name: 'lisa',
            get age() {
              console.log('age getter called');
              isAgeGetterCalled = true;
              return 18;
            },
          },
        },
      },
      other: { a: 9 },
    };

    const value = produce(state, (draft) => {
      console.log('immer produce enter');
      draft.other.a = 6;
      console.log('immer produce exit');
    });

    console.log('immer + isAgeGetterCalled', isAgeGetterCalled);
    expect(isAgeGetterCalled).toBe(true);
    // Expect: false
    // output: true
    //         ↑  Error here, in this case,
    //            the getter should not called, when `setAutoFreeze(false)`
  }
  {
    let isAgeGetterCalled = false;

    const state = {
      data: {
        data: {
          lisa: {
            name: 'lisa',
            get age() {
              console.log('age getter called');
              isAgeGetterCalled = true;
              return 18;
            },
          },
        },
      },
      other: { a: 9 },
    };

    const value = create(state, (draft) => {
      console.log('mutative create enter');
      draft.other.a = 6;
      console.log('mutative create exit');
    });

    console.log();

    console.log('mutative + isAgeGetterCalled', isAgeGetterCalled);
    expect(isAgeGetterCalled).toBe(false);
  }
});

test('circular reference', () => {
  {
    const data = { a: { b: { c: 1 } } };
    // @ts-expect-error
    data.a.b.c1 = data.a.b;

    setAutoFreeze(true);

    expect(() => {
      produce(data, () => {
        //
      });
    }).not.toThrowError();
  }

  {
    const data = { a: { b: { c: 1 } } };
    // @ts-expect-error
    data.a.b.c1 = data.a.b;
    expect(() => {
      create(
        data,
        (draft) => {
          //
        },
        {
          enableAutoFreeze: true,
        }
      );
    }).toThrowErrorMatchingInlineSnapshot(
      `"Forbids circular reference: ~/a/b"`
    );
  }
});

test('#18 - set: assigning a non-draft with the same key', () => {
  const baseState = {
    array: [
      {
        one: {
          two: {
            three: 3,
          },
        },
      },
    ],
  };

  const created = create(
    baseState,
    (draft) => {
      draft.array[0].one.two.three = 2;
      const two = draft.array[0].one.two;
      const one = new Set();
      // @ts-ignore
      draft.array = [{ one }];
      // @ts-ignore
      one.add(two);
      // @ts-ignore
      expect(Array.from(draft.array[0].one)[0].three).toBe(2);
    },
    {
      enablePatches: true,
    }
  );
  // @ts-ignore
  expect(Array.from(created[0].array[0].one)[0].three).toBe(2);
  expect(apply(baseState, created[1])).toEqual(created[0]);
  // expect(apply(created[0], created[2])).toEqual(baseState);

  enablePatches();
  // @ts-ignore
  const produced = produceWithPatches(baseState, (draft: any) => {
    draft.array[0].one.two.three = 2;
    const two = draft.array[0].one.two;
    const one = new Set();
    // @ts-ignore
    draft.array = [{ one }];
    // @ts-ignore
    one.add(two);
    // @ts-ignore
    expect(Array.from(draft.array[0].one)[0].three).toBe(2);
  });

  // @ts-ignore
  expect(() => {
    // @ts-ignore
    // eslint-disable-next-line no-unused-expressions
    Array.from(produced[0].array[0].one)[0].three;
  }).toThrowError();

  //  @ts-ignore
  // expect(applyPatches(baseState, produced[1])).toEqual(produced[0]);
  // @ts-ignore
  // expect(applyPatches(produced[0], produced[2])).toEqual(baseState);
});
