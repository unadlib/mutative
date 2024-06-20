/* eslint-disable no-inner-declarations */
/* eslint-disable symbol-description */
/* eslint-disable no-unused-expressions */
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
  setUseStrictShallowCopy,
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

test('#18 - set: assigning a non-draft with the same key - 1', () => {
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

  {
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
    expect(apply(created[0], created[2])).toEqual(baseState);
  }

  {
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
    expect(() => applyPatches(baseState, produced[1])).toThrowError();
    // @ts-ignore
    expect(applyPatches(produced[0], produced[2])).toEqual(baseState);
  }
});

test('#18 - set: assigning a non-draft with the same key - 2', () => {
  const baseState = { c: [{ a: 1 }, { a: 1 }] };
  {
    enablePatches();
    // @ts-ignore
    const produced = produceWithPatches(baseState, (draft) => {
      const f = draft.c.pop();
      // @ts-ignore
      f.a = 2;
      // @ts-ignore
      draft.c = new Set([draft.c[0], f]);
    });
    //  @ts-ignore
    expect(() => applyPatches(baseState, produced[1])).toThrowError();
    // @ts-ignore
    expect(applyPatches(produced[0], produced[2])).toEqual(baseState);
  }
  {
    const created = create(
      baseState,
      (draft) => {
        const f = draft.c.pop();
        // @ts-ignore
        f.a = 2;
        // @ts-ignore
        draft.c = new Set([draft.c[0], f]);
      },
      {
        enablePatches: true,
      }
    );
    expect(apply(baseState, created[1])).toEqual(created[0]);
    expect(apply(created[0], created[2])).toEqual(baseState);
  }
});

test('enablePatches and assign with ref array', () => {
  const baseState = { a: { b: { c: 1 } }, arr0: [{ a: 1 }], arr1: [{ a: 1 }] };
  const fn = (draft: any) => {
    draft.arr0.push(draft.a.b);
    draft.arr0.push(draft.arr1);
    draft.a.b.c = 2;
    draft.a.b.c = 333;
    delete draft.a.b;
    draft.arr1[0].a = 222;
    draft.arr0[1].a = 333;
    draft.arr0[2][0].a = 444;
  };
  {
    enablePatches();
    const [state, patches, inversePatches] = produceWithPatches(baseState, fn);

    const mutatedResult = JSON.parse(JSON.stringify(baseState));
    fn(mutatedResult);
    expect(state).toEqual(mutatedResult);

    const prevState = applyPatches(state, inversePatches);
    // !!! it should be equal
    expect(prevState).not.toEqual(baseState);
    const nextState = applyPatches(baseState, patches);
    // !!! it should be equal
    expect(nextState).not.toEqual(state);
  }
  {
    const [state, patches, inversePatches] = create(baseState, fn, {
      enablePatches: true,
    });

    const mutatedResult = JSON.parse(JSON.stringify(baseState));
    fn(mutatedResult);
    expect(state).toEqual(mutatedResult);

    const prevState = apply(state, inversePatches);
    expect(prevState).toEqual(baseState);
    const nextState = apply(baseState, patches);
    expect(nextState).toEqual(state);
  }
});

test('produce leaks proxy objects when symbols are present', () => {
  {
    setUseStrictShallowCopy(true);
    const Parent = Symbol();

    const testObject = {
      name: 'Parent',
    };

    // @ts-ignore
    testObject.child = {
      [Parent]: testObject,
      count: 0,
    };

    // https://github.com/immerjs/immer/issues/1106
    // it should not throw error
    expect(() => {
      const result = produce(testObject, (draft) => {
        // @ts-ignore
        draft.child.count++;
      });
    }).toThrowError();
  }
  {
    const Parent = Symbol();

    const testObject = {
      name: 'Parent',
    };

    // @ts-ignore
    testObject.child = {
      [Parent]: testObject,
      count: 0,
    };

    // it should not throw error
    expect(() => {
      const result = create(testObject, (draft) => {
        // @ts-ignore
        draft.child.count++;
      });
    }).not.toThrowError();
  }
});

test('error key setting in array', () => {
  {
    for (const key of [-1, '-1', '1.0', '-1.1']) {
      const data = [1, 2, 3];
      expect(() => {
        produce(data, (draft) => {
          // @ts-ignore
          draft[key] = 'new str';
        });
      }).not.toThrowError();
    }
  }
  {
    for (const key of [-1, '-1', '1.0', '-1.1']) {
      const data = [1, 2, 3];
      expect(() => {
        create(data, (draft) => {
          // @ts-ignore
          draft[key] = 'new str';
        });
      }).toThrowErrorMatchingSnapshot();
    }
  }
});

test(`Object values of a Map are not frozen anymore #1119`, () => {
  {
    enableMapSet();

    interface Fruit {
      key: string;
      name: string;
    }

    const fruits: Fruit[] = [
      { key: 'apple1', name: 'Red Delicious' },
      { key: 'apple2', name: 'Gala' },
    ];

    let products = new Map<string, Fruit>();

    function setFruitMap(fruits: Fruit[]): void {
      products = produce(products, (draft) => {
        draft.clear();
        fruits.forEach((fruit) => draft.set(fruit.key, fruit));
      });
    }

    setFruitMap(fruits);

    const product = products.get('apple1');
    // ! it should be frozen
    expect(Object.isFrozen(product)).not.toBeTruthy();
  }
  {
    interface Fruit {
      key: string;
      name: string;
    }

    const fruits: Fruit[] = [
      { key: 'apple1', name: 'Red Delicious' },
      { key: 'apple2', name: 'Gala' },
    ];

    let products: Immutable<Map<string, Fruit>> = new Map();

    function setFruitMap(fruits: Fruit[]): void {
      products = create(
        products,
        (draft) => {
          draft.clear();
          fruits.forEach((fruit) => draft.set(fruit.key, fruit));
        },
        {
          enableAutoFreeze: true,
        }
      );
    }

    setFruitMap(fruits);

    const product = products.get('apple1');
    expect(Object.isFrozen(product)).toBeTruthy();
  }
});
