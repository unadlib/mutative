/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-inner-declarations */
/* eslint-disable symbol-description */
/* eslint-disable no-unused-expressions */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-param-reassign */
/* eslint-disable no-lone-blocks */
/* eslint-disable no-extend-native */
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
import { create, apply, current, isDraft } from '../src';
import { deepClone } from '../src/utils';

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
test('does not access unrelated getters with autoFreeze disabled', () => {
  {
    setAutoFreeze(false);

    let isAgeGetterCalled = false;

    const state = {
      data: {
        data: {
          lisa: {
            name: 'lisa',
            get age() {
              isAgeGetterCalled = true;
              return 18;
            },
          },
        },
      },
      other: { a: 9 },
    };

    produce(state, (draft) => {
      draft.other.a = 6;
    });

    expect(isAgeGetterCalled).toBe(false);
  }
  {
    let isAgeGetterCalled = false;

    const state = {
      data: {
        data: {
          lisa: {
            name: 'lisa',
            get age() {
              isAgeGetterCalled = true;
              return 18;
            },
          },
        },
      },
      other: { a: 9 },
    };

    create(state, (draft) => {
      draft.other.a = 6;
    });

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
      `[Error: Forbids circular reference: ~/a/b]`
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

test('replays patches after moving draft references into arrays', () => {
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
    expect(prevState).toEqual(baseState);
    const nextState = applyPatches(baseState, patches);
    expect(nextState).toEqual(state);
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

test('produce handles symbol properties without leaking proxies', () => {
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
    }).not.toThrow();
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

test('assigning inherited undefined creates an own property and an add patch', () => {
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

    expect(patches).toEqual([
      {
        op: 'add',
        path: ['name'],
        value: undefined,
      },
    ]);

    // After immer produce, foo should still not have own property 'name'
    expect(Object.prototype.hasOwnProperty.call(foo, 'name')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(foo_next, 'name')).toBe(true);

    // Manually assigning undefined should create own property
    foo.name = undefined;
    expect(Object.prototype.hasOwnProperty.call(foo, 'name')).toBe(true);
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

test('apply - map with object key', () => {
  {
    enablePatches();
    enableMapSet();
    const key = { id: 1 };
    const base = {
      map: new Map([[key, { value: 1 }]]),
    };
    const [next, patches, inverse] = produceWithPatches(base, (draft) => {
      draft.map.get(key)!.value = 2;
    });
    expect(() => applyPatches(base, patches)).toThrow();
    expect(() => applyPatches(next, inverse)).toThrow();
  }
  {
    const key = { id: 1 };
    const base = {
      map: new Map([[key, { value: 1 }]]),
    };
    const [next, patches, inverse] = create(
      base,
      (draft) => {
        draft.map.get(key)!.value = 2;
      },
      { enablePatches: true }
    );
    expect(apply(base, patches)).toEqual(next);
    expect(apply(next, inverse)).toEqual(base);
  }
});

test('apply - symbol key on object', () => {
  {
    enablePatches();
    const sym = Symbol('key');
    const base = {
      obj: {
        [sym]: { value: 1 },
      },
    };
    const [next, patches, inverse] = produceWithPatches(base, (draft) => {
      draft.obj[sym].value = 2;
    });
    expect(() => applyPatches(base, patches)).toThrow();
    expect(() => applyPatches(next, inverse)).toThrow();
  }
  {
    const sym = Symbol('key');
    const base = {
      obj: {
        [sym]: { value: 1 },
      },
    };
    const [next, patches, inverse] = create(
      base,
      (draft) => {
        draft.obj[sym].value = 2;
      },
      { enablePatches: true }
    );
    expect(apply(base, patches)).toEqual(next);
    expect(apply(next, inverse)).toEqual(base);
  }
});

test('#70 - deep copy patches with Custom Set/Map', () => {
  {
    // immer
    class CustomSet<T> extends Set<T> {
      // @ts-ignore
      [immerable] = true;
    }
    class CustomMap<K, V> extends Map<K, V> {
      // @ts-ignore
      [immerable] = true;
    }
    const baseState = {
      map: new CustomMap<any, any>(),
      set: new CustomSet<any>(),
    };
    setUseStrictShallowCopy(true);
    const [state, patches, inversePatches] = produceWithPatches(
      baseState,
      (draft) => {
        draft.map = new CustomMap<any, any>([[1, 1]]);
        draft.set = new CustomSet<any>([1]);
      }
    );
    const nextState = applyPatches(baseState, patches);
    expect(patches[0].value).toBeInstanceOf(CustomMap);
    expect(patches[1].value).toBeInstanceOf(CustomSet);
    // !!! it should be true, but it's false
    expect(nextState.map instanceof CustomMap).toBe(false);
    expect(nextState.set instanceof CustomSet).toBe(false);
    // expect(nextState).toEqual(state);
    // const prevState = applyPatches(state, inversePatches);
    // expect(inversePatches[0].value).toBeInstanceOf(CustomMap);
    // expect(inversePatches[1].value).toBeInstanceOf(CustomSet);
    // expect(prevState).toEqual(baseState);
  }
  {
    // mutative
    class CustomSet<T> extends Set<T> {}
    class CustomMap<K, V> extends Map<K, V> {}
    const baseState = {
      map: new CustomMap<any, any>(),
      set: new CustomSet<any>(),
    };
    const [state, patches, inversePatches] = create(
      baseState,
      (draft) => {
        draft.map = new CustomMap<any, any>([[1, 1]]);
        draft.set = new CustomSet<any>([1]);
      },
      {
        enablePatches: true,
      }
    );
    const nextState = apply(baseState, patches);
    expect(patches[0].value).toBeInstanceOf(CustomMap);
    expect(patches[1].value).toBeInstanceOf(CustomSet);
    expect(nextState.map instanceof CustomMap).toBe(true);
    expect(nextState.set instanceof CustomSet).toBe(true);
    expect(nextState).toEqual(state);
    const prevState = apply(state, inversePatches);
    expect(inversePatches[0].value).toBeInstanceOf(CustomMap);
    expect(inversePatches[1].value).toBeInstanceOf(CustomSet);
    expect(prevState).toEqual(baseState);
  }
});

test('replays patches for a shared draft array', () => {
  function checkMutativePatches<T>(data: T, fn: (checkPatches: T) => void) {
    const [state, patches, inversePatches] = create(data as any, fn, {
      enablePatches: true,
    }) as any;
    const mutatedResult = deepClone(data);
    fn(mutatedResult);
    expect(state).toEqual(mutatedResult);
    const prevState = apply(state, inversePatches);
    expect(prevState).toEqual(data);
    const nextState = apply(data as any, patches);
    expect(nextState).toEqual(state);
  }

  function checkImmerPatches<T>(data: T, fn: (checkPatches: T) => void) {
    const [state, patches, inversePatches] = produceWithPatches(
      data as any,
      fn
    ) as any;
    const mutatedResult = deepClone(data);
    fn(mutatedResult);
    expect(state).toEqual(mutatedResult);
    const prevState = applyPatches(state, inversePatches);
    expect(prevState).toEqual(data);
    const nextState = applyPatches(data as any, patches);
    expect(nextState).toEqual(state);
  }
  const state = { a: { b: { c: 1 } }, arr0: [{ a: 1 }], arr1: [{ a: 1 }] };
  const fn = (draft: any) => {
    draft.arr0.push(draft.arr1);
    draft.arr1[0].a = 222;
  };
  checkImmerPatches(state, fn);
  checkMutativePatches(state, fn);
});

// Immer's current() copies a plain Set and then iterates the copy while
// set() appends the current value of every element to that same copy, so a
// Set holding drafts or unfrozen draftable objects grows forever. The guard
// below turns that runaway growth into an error instead of a hang.
function withSetAddLimit<T>(limit: number, fn: () => T): T {
  const originalAdd = Set.prototype.add;
  let calls = 0;
  Set.prototype.add = function add(this: Set<unknown>, value: unknown) {
    calls += 1;
    if (calls > limit) {
      throw new Error(`Set.prototype.add was called more than ${limit} times`);
    }
    return originalAdd.call(this, value);
  } as typeof Set.prototype.add;
  try {
    return fn();
  } finally {
    Set.prototype.add = originalAdd;
  }
}

test('current() on a plain Set that holds drafts', () => {
  const makeBase = (): any => ({ a: { child: { x: 1 } } });
  {
    // ! it should return a snapshot; instead current() never finishes
    expect(() =>
      withSetAddLimit(1000, () =>
        produce(makeBase(), (draft: any) => {
          draft.a.child.x = 2;
          draft.a.s = new Set([draft.a.child]);
          immerCurrent(draft.a);
        })
      )
    ).toThrow('Set.prototype.add was called more than 1000 times');
  }
  {
    let snapshot: any;
    create(makeBase(), (draft: any) => {
      draft.a.child.x = 2;
      draft.a.s = new Set([draft.a.child]);
      snapshot = current(draft.a);
    });
    expect(snapshot.s.size).toBe(1);
    const [item] = [...snapshot.s];
    expect(isDraft(item)).toBe(false);
    expect(item).toEqual({ x: 2 });
  }
});

test('current() on a plain Set of unfrozen objects', () => {
  {
    // ! it should return a snapshot; instead current() never finishes
    expect(() =>
      withSetAddLimit(1000, () =>
        produce({ a: { t: 0 } } as any, (draft: any) => {
          draft.a.s = new Set([{ q: 1 }]);
          draft.a.t = 1;
          immerCurrent(draft.a);
        })
      )
    ).toThrow('Set.prototype.add was called more than 1000 times');
  }
  {
    const inner = new Set([{ q: 1 }]);
    let snapshot: any;
    create({ a: { t: 0 } } as any, (draft: any) => {
      draft.a.s = inner;
      draft.a.t = 1;
      snapshot = current(draft.a);
    });
    expect(snapshot.s).toBe(inner);
    expect(snapshot.s.size).toBe(1);
  }
});

const isRevokedProxy = (value: unknown) => {
  try {
    Object.getPrototypeOf(value);
    return false;
  } catch {
    return true;
  }
};

test('a plain Set that holds a draft is finalized', () => {
  type State = { a: { child: { x: number }; s?: Set<unknown> } };
  const makeBase = (): State => ({ a: { child: { x: 1 } } });
  const recipe = (draft: State) => {
    draft.a.child.x = 2;
    draft.a.s = new Set([draft.a.child]);
  };
  {
    enablePatches();
    // Immer adds the finalized child to the Set but leaves the revoked draft
    // proxy in it, and the add patch carries that Set.
    // ! the Set should hold only the finalized child and the patches should replay
    const base = makeBase();
    const [state, patches] = produceWithPatches(base, recipe);
    expect(state.a.s!.size).toBe(2);
    expect(Array.from(state.a.s!).filter(isRevokedProxy)).toHaveLength(1);
    expect(state.a.s!.has(state.a.child)).toBe(true);
    expect(() => applyPatches(base, patches)).toThrow(/revoked/);
  }
  {
    const base = makeBase();
    const [state, patches, inversePatches] = create(base, recipe, {
      enablePatches: true,
    });
    expect(state.a.s!.size).toBe(1);
    expect(state.a.s!.has(state.a.child)).toBe(true);
    expect(state.a.child).toEqual({ x: 2 });
    expect(apply(base, patches)).toEqual(state);
    expect(apply(state, inversePatches)).toEqual(base);
  }
});

test('assigning a draft from an inner scope to an outer draft', () => {
  const makeBases = () => ({
    outerBase: { slot: null as any, k: 0 },
    innerBase: { item: { v: 1 } },
  });
  {
    // The inner produce revokes its proxies when it returns, so the outer
    // draft keeps a revoked proxy in `slot`, with or without patches.
    // ! it should finalize the inner draft into the outer state
    const plain = makeBases();
    expect(() =>
      produce(plain.outerBase, (outer: any) => {
        produce(plain.innerBase, (inner: any) => {
          inner.item.v = 2;
          outer.slot = inner.item;
          outer.k = 1;
        });
      })
    ).toThrow(/revoked/);
    enablePatches();
    const withPatches = makeBases();
    expect(() =>
      produceWithPatches(withPatches.outerBase, (outer: any) => {
        produceWithPatches(withPatches.innerBase, (inner: any) => {
          inner.item.v = 2;
          outer.slot = inner.item;
          outer.k = 1;
        });
      })
    ).toThrow(/revoked/);
  }
  {
    const { outerBase, innerBase } = makeBases();
    let innerResult: any;
    const [outer, outerPatches, outerInversePatches] = create(
      outerBase,
      (o: any) => {
        innerResult = create(
          innerBase,
          (i: any) => {
            i.item.v = 2;
            o.slot = i.item;
            o.k = 1;
          },
          { enablePatches: true }
        );
      },
      { enablePatches: true }
    );
    const [inner, innerPatches, innerInversePatches] = innerResult;
    expect(outer).toEqual({ slot: { v: 2 }, k: 1 });
    expect(inner).toEqual({ item: { v: 2 } });
    expect(isDraft(outer.slot)).toBe(false);
    // Each scope records only its own changes.
    expect(outerPatches.map((patch: any) => patch.path)).toEqual([
      ['slot'],
      ['k'],
    ]);
    expect(innerPatches.map((patch: any) => patch.path)).toEqual([
      ['item', 'v'],
    ]);
    expect(apply(outerBase, outerPatches)).toEqual(outer);
    expect(apply(outer, outerInversePatches)).toEqual(outerBase);
    expect(apply(innerBase, innerPatches)).toEqual(inner);
    expect(apply(inner, innerInversePatches)).toEqual(innerBase);
  }
});
