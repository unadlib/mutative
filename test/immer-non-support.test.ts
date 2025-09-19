/* eslint-disable @typescript-eslint/no-unused-vars */
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
  current as immerCurrent,
  createDraft,
  finishDraft,
  immerable,
} from 'immer';
import { create, apply, current } from '../src';

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
    }).not.toThrow();
  }
  {
    const data = new Set([1]);
    expect(() => {
      create(data, (draft) => {
        // @ts-ignore
        draft.x = 1;
      });
    }).toThrow(`Map/Set draft does not support any property assignment.`);
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
    }).not.toThrow();
  }

  {
    const data = new Map([[1, 'a']]);
    expect(() => {
      create(data, (draft) => {
        // @ts-ignore
        draft.x = 1;
      });
    }).toThrow(`Map/Set draft does not support any property assignment.`);
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
    }).not.toThrow();
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
    }).toThrow();
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
    }).toThrow();
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
    }).not.toThrow();
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
    }).not.toThrow();
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
    }).toThrow();

    //  @ts-ignore
    expect(() => applyPatches(baseState, produced[1])).toThrow();
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
    expect(() => applyPatches(baseState, produced[1])).toThrow();
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
    }).toThrow();
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
    }).not.toThrow();
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
      }).not.toThrow();
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

test('#47 Avoid deep copies', () => {
  {
    const obj = { k: 42 };
    const base = { x: { y: { z: obj } } };
    produce(base, (draft) => {
      draft.x = { y: { z: obj } };
      const c = immerCurrent(draft);
      // ! it should be equal
      expect(c.x.y.z).not.toBe(obj);
    });
  }
  {
    const obj = { k: 42 };
    const base = { x: { y: { z: obj } } };
    create(base, (draft) => {
      draft.x = { y: { z: obj } };
      const c = current(draft);
      expect(c.x.y.z).toBe(obj);
    });
  }
});

test('#61 - type issue: current of Draft<T> type should return T type', () => {
  {
    function test<T extends { x: { y: ReadonlySet<string> } }>(base: T): T {
      const draft = createDraft(base);
      // @ts-ignore
      const currentValue: T = immerCurrent(draft); // !!! Type Draft<T> is not assignable to type T
      // @ts-expect-error
      return finishDraft(draft);
    }
    expect(test({ x: { y: new Set(['a', 'b']) } })).toEqual({
      x: { y: new Set(['a', 'b']) },
    });
  }
  {
    function test<T extends { x: { y: ReadonlySet<string> } }>(base: T): T {
      const [draft, f] = create(base);
      const currentValue: T = current(draft);
      return f();
    }
    expect(test({ x: { y: new Set(['a', 'b']) } })).toEqual({
      x: { y: new Set(['a', 'b']) },
    });
  }
});

test('set - new Set API', () => {
  // @ts-ignore
  if (!Set.prototype.difference) {
    console.warn('Set.prototype.difference is not supported');
    return;
  }
  {
    enableMapSet();
    const odds = new Set([1, 3, 5, 7, 9]);
    const squares = new Set([1, 4, 9]);
    const state = produce(odds, (draft) => {
      // @ts-ignore
      expect(draft.intersection(squares)).toEqual(new Set([])); // it should be `new Set([1, 9])`
    });
  }
  {
    const odds = new Set([1, 3, 5, 7, 9]);
    const squares = new Set([1, 4, 9]);
    const state = create(odds, (draft) => {
      // @ts-ignore
      expect(draft.intersection(squares)).toEqual(new Set([1, 9]));
    });
  }
});

test('CustomSet', () => {
  {
    enableMapSet();
    class CustomSet extends Set {
      [immerable] = true;

      getIdentity() {
        return 'CustomSet';
      }
    }

    const s = new CustomSet();
    const newS = produce(s, (draft) => {
      draft.add(1);
      // @ts-ignore
      expect(typeof draft.getIdentity === 'function').toBeFalsy(); // it should be `true`
    });
    // @ts-ignore
    expect(typeof newS.getIdentity === 'function').toBeFalsy(); // it should be `true`
  }
  {
    class CustomSet extends Set {
      getIdentity() {
        return 'CustomSet';
      }
    }

    const state = new CustomSet();
    const newState = create(state, (draft) => {
      draft.add(1);
      // @ts-ignore
      expect(draft.getIdentity()).toBe('CustomSet');
    });
    expect(newState instanceof CustomSet).toBeTruthy();
    // @ts-ignore
    expect(newState.getIdentity()).toBe('CustomSet');
  }
});

test('CustomMap', () => {
  {
    enableMapSet();
    class CustomMap extends Map {
      [immerable] = true;

      getIdentity() {
        return 'CustomMap';
      }
    }

    const state = new CustomMap();
    const newState = produce(state, (draft) => {
      draft.set(1, 1);
      // @ts-ignore
      expect(typeof draft.getIdentity === 'function').toBeFalsy(); // it should be `true`
    });
    // @ts-ignore
    expect(typeof newState.getIdentity === 'function').toBeFalsy(); // it should be `true`
  }
  {
    class CustomMap extends Map {
      getIdentity() {
        return 'CustomMap';
      }
    }

    const state = new CustomMap();
    const newState = create(state, (draft) => {
      draft.set(1, 1);
      // @ts-ignore
      expect(draft.getIdentity()).toBe('CustomMap');
    });
    expect(newState instanceof CustomMap).toBeTruthy();
    // @ts-ignore
    expect(newState.getIdentity()).toBe('CustomMap');
  }
});

test('Unexpected undefined not assigned', () => {
  {
    // #1160 https://github.com/immerjs/immer/issues/1160
    const proto = { [immerable]: true, name: undefined };
    const foo = Object.create(proto);

    // Initial state: foo should not have own property 'name'
    expect(Object.prototype.hasOwnProperty.call(foo, 'name')).toBe(false);

    enablePatches();
    // @ts-ignore
    const [foo_next, patches, _] = produceWithPatches(foo, (x) => {
      x.name = undefined;
    });

    // Immer should produce empty patches when setting undefined
    expect(patches).toEqual([]);

    // After immer produce, foo should still not have own property 'name'
    expect(Object.prototype.hasOwnProperty.call(foo, 'name')).toBe(false);
    // foo_next should also not have own property 'name'
    expect(Object.prototype.hasOwnProperty.call(foo_next, 'name')).toBe(false);

    // Manually assigning undefined should create own property
    foo.name = undefined;
    expect(Object.prototype.hasOwnProperty.call(foo, 'name')).toBe(true);

    // [hasOwnProp] foo: false
    // [immer] produce foo_next from immer
    // [immer] foo_next patches: [
    //   {
    //     op: "add",
    //     path: [ "name" ],
    //     value: undefined,
    //   }
    // ]
    // [hasOwnProp] foo: false
    // [hasOwnProp] foo_next: true
    // [vanilla] assign name manually
    // [hasOwnProp] foo: true
  }
  {
    const immerable = Symbol();
    const proto = { [immerable]: true, name: undefined };
    const foo = Object.create(proto);

    const [foo_next, patches, _] = create(
      foo,
      (x) => {
        x.name = undefined;
      },
      {
        enablePatches: true,
        mark: (target) => {
          if (target && target[immerable]) {
            return 'immutable';
          }
        },
      }
    );

    expect(patches).toEqual([
      {
        op: 'add',
        path: ['name'],
        value: undefined,
      },
    ]);
    expect(Object.prototype.hasOwnProperty.call(foo, 'name')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(foo_next, 'name')).toBe(true);

    foo.name = undefined;
    expect(Object.prototype.hasOwnProperty.call(foo, 'name')).toBe(true);
  }
});
