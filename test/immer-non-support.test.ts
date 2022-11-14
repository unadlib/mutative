import { produce, enableMapSet, setAutoFreeze, Immutable } from 'immer';
import { create } from '../src';

enableMapSet();

test('Set draft constructor is not equal to Set', () => {
  const data = new Set([1, 2, 3]);

  produce(data, (draft) => {
    expect(draft.constructor).not.toBe(Set);
  });

  create(data, (draft) => {
    expect(draft.constructor).toBe(Set);
  });
});

test('Map draft constructor is not equal to Map', () => {
  const data = new Map([[1, 'a']]);

  produce(data, (draft) => {
    expect(draft.constructor).not.toBe(Map);
  });

  create(data, (draft) => {
    expect(draft.constructor).toBe(Map);
  });
});

test('Unexpected operation check of Set draft', () => {
  const data = new Set([1]);

  // ! it should throw an error
  expect(() => {
    produce(data, (draft) => {
      // @ts-ignore
      draft.x = 1;
    });
  }).not.toThrowError();
  expect(() => {
    create(data, (draft) => {
      // @ts-ignore
      draft.x = 1;
    });
  }).toThrowError(`'set' draft does not support any property assignment.`);
});

test('Unexpected operation check of Map draft', () => {
  const data = new Map([[1, 'a']]);

  // ! it should throw an error
  expect(() => {
    produce(data, (draft) => {
      // @ts-ignore
      draft.x = 1;
    });
  }).not.toThrowError();

  expect(() => {
    create(data, (draft) => {
      // @ts-ignore
      draft.x = 1;
    });
  }).toThrowError(`'map' draft does not support any property assignment.`);
});

// https://github.com/immerjs/immer/issues/819
test('immer failed case - maintains order when adding', () => {
  const objs = [
    {
      id: 'a',
    },
    'b',
  ];

  const set = new Set([objs[0]]);
  const newSet = produce(set, (draft) => {
    draft.add(objs[1]);
  });
// ! it should keep the order
  expect(Array.from(newSet)).not.toEqual([objs[0], objs[1]]);
});

test('mutative case - maintains order when adding', () => {
  const objs = [
    {
      id: 'a',
    },
    'b',
  ];

  const set = new Set([objs[0]]);
  const newSet = create(set, (draft) => {
    draft.add(objs[1]);
  });

  // does not pass
  expect(Array.from(newSet)).toEqual([objs[0], objs[1]]);
});

// https://github.com/immerjs/immer/issues/819
test('immer failed case - maintains order when adding2', () => {
  const objs = [
    {
      id: 'a',
    },
    {
      id: 'b',
    },
  ];

  const set = new Set([objs[0]]);
  const newSet = produce(set, (draft) => {
    draft.add(objs[1]);
  });

  // ! it should keep the order
  expect(Array.from(newSet)).not.toEqual([objs[0], objs[1]]);
});

test('mutative case - maintains order when adding2', () => {
  const objs = [
    {
      id: 'a',
    },
    {
      id: 'b',
    },
  ];

  const set = new Set([objs[0]]);
  const newSet = create(set, (draft) => {
    draft.add(objs[1]);
  });

  expect(Array.from(newSet)).toEqual([objs[0], objs[1]]);
});

// test.only("", () => {
//   const state = {
//     foo: {
//       bar: {
//         baz: 1
//       }
//     }
//   }
//   const newState = create(state, draft => {
//     draft.foo = create(draft.foo, fooDraft => {
//       // @ts-ignore
//       fooDraft.baz = fooDraft.bar.baz
//     })
//     // draft.foo = create(draft.foo, fooDraft => {
//     //   /* another produce call makes this fail */
//     //   /* no actual mutation necessary to make this happen */
//     // })
//   })

//   JSON.stringify(newState);
// })

test('immer failed case - freeze Map key', () => {
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
});

test('mutative case - freeze Map key', () => {
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
});
