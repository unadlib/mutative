import { create, current, isDraft } from '../src';
import { arrayHandlerKeys } from '../src/array';

test('only target array mutation methods are lazily intercepted', () => {
  expect(arrayHandlerKeys).toEqual(['shift', 'unshift', 'splice', 'reverse']);
});

test('shift', () => {
  const obj = {
    a: Array.from({ length: 20 }, (_, i) => ({ i })),
    o: { b: { c: 1 } },
  };
  const state = create(obj, (draft) => {
    const a = draft.a.shift()!;
    a.i++;
    draft.a.push(a);
    expect(isDraft(a)).toBeTruthy();
  });
  // !!! check draft proxy array leakage
  expect(obj.a[0] === state.a.slice(-1)[0]).toBe(false);
});

test('splice', () => {
  const obj = {
    a: Array.from({ length: 20 }, (_, i) => ({ i })),
    o: { b: { c: 1 } },
  };
  const state = create(obj, (draft) => {
    const [a] = draft.a.splice(0, 1)!;
    a.i++;
    draft.a.push(a);
    expect(isDraft(a)).toBeTruthy();
  });
  // !!! check draft proxy array leakage
  expect(obj.a[0] === state.a.slice(-1)[0]).toBe(false);
});

test('splice normalizes start and deleteCount once', () => {
  let startCalls = 0;
  let deleteCountCalls = 0;
  const start = {
    valueOf() {
      startCalls += 1;
      return 1;
    },
  };
  const deleteCount = {
    valueOf() {
      deleteCountCalls += 1;
      return 1;
    },
  };
  const obj = {
    a: [{ i: 0 }, { i: 1 }, { i: 2 }],
  };

  const state = create(obj, (draft) => {
    const [item] = draft.a.splice(start as any, deleteCount as any);
    expect(isDraft(item)).toBeTruthy();
  });

  expect(startCalls).toBe(1);
  expect(deleteCountCalls).toBe(1);
  expect(state).toEqual({ a: [{ i: 0 }, { i: 2 }] });
});

test('splice uses length captured before argument coercion', () => {
  const obj = {
    a: [{ i: 0 }, { i: 1 }],
  };
  let draftArray: typeof obj.a;
  const start = {
    valueOf() {
      draftArray.push({ i: 2 });
      return 0;
    },
  };

  const state = create(obj, (draft) => {
    draftArray = draft.a;
    const removed = draft.a.splice(start as any, 10);
    expect(removed).toHaveLength(2);
    expect(removed.map((item) => item.i)).toEqual([0, 1]);
  });

  expect(state).toEqual({ a: [] });
});

test('splice coerces arguments before array species access', () => {
  const events: string[] = [];
  const obj = {
    a: [{ i: 0 }, { i: 1 }],
  };
  Object.defineProperty(obj.a, 'constructor', {
    configurable: true,
    get() {
      events.push('constructor');
      return Array;
    },
  });
  const start = {
    valueOf() {
      events.push('start');
      return 0;
    },
  };

  create(obj, (draft) => {
    draft.a.splice(start as any, 1);
  });

  expect(events[0]).toBe('start');
});

test('splice rejects BigInt start and deleteCount like native arrays', () => {
  expect(() => {
    create([{ i: 0 }, { i: 1 }], (draft) => {
      draft.splice(BigInt(1) as any, 1);
    });
  }).toThrow(TypeError);
  expect(() => {
    create([{ i: 0 }, { i: 1 }], (draft) => {
      draft.splice(0, BigInt(1) as any);
    });
  }).toThrow(TypeError);
});

test('splice removed array follows array species', () => {
  class RemovedItems extends Array {}
  const list = [{ i: 0 }, { i: 1 }, { i: 2 }] as any;
  Object.defineProperty(list, 'constructor', {
    configurable: true,
    value: {
      [Symbol.species]: RemovedItems,
    },
  });

  create({ list }, (draft) => {
    const removed = draft.list.splice(1, 1);
    expect(removed).toBeInstanceOf(RemovedItems);
    expect(isDraft(removed[0])).toBeTruthy();
    expect(removed[0].i).toBe(1);

    const empty = draft.list.splice();
    expect(empty).toBeInstanceOf(RemovedItems);
    expect(empty).toHaveLength(0);
  });
});

test('splice removed non-array species has length', () => {
  class RemovedItems {
    [key: number]: any;
    length?: number;
  }
  const list = [{ i: 0 }, { i: 1 }, { i: 2 }] as any;
  Object.defineProperty(list, 'constructor', {
    configurable: true,
    value: {
      [Symbol.species]: RemovedItems,
    },
  });

  create({ list }, (draft) => {
    const removed = draft.list.splice(1, 1) as any;
    expect(removed).toBeInstanceOf(RemovedItems);
    expect(removed.length).toBe(1);
    expect(Object.keys(removed)).toEqual(['0', 'length']);
    expect(isDraft(removed[0])).toBeTruthy();
    expect(removed[0].i).toBe(1);

    const empty = draft.list.splice() as any;
    expect(Array.isArray(empty)).toBe(true);
    expect(empty.length).toBe(0);
    expect(Object.keys(empty)).toEqual([]);
  });
});

test('splice removed values are read after array species creation', () => {
  let draftArray: any[];
  class RemovedItems {
    [key: number]: any;
    length?: number;

    constructor(length: number) {
      draftArray[0] = { i: 99 };
      this.length = length;
    }
  }
  const list = [{ i: 0 }, { i: 1 }] as any;
  Object.defineProperty(list, 'constructor', {
    configurable: true,
    value: {
      [Symbol.species]: RemovedItems,
    },
  });

  const state = create({ list }, (draft) => {
    draftArray = draft.list;
    const removed = draft.list.splice(0, 1) as any;
    expect(removed).toBeInstanceOf(RemovedItems);
    expect(removed[0].i).toBe(99);
  });

  expect(list[0].i).toBe(0);
  expect(state.list).toBeInstanceOf(RemovedItems);
  expect((state.list as any).length).toBe(1);
  expect((state.list as any)[0]).toEqual({ i: 1 });
});

test('array own mutation method is not overridden by lazy handler', () => {
  const list = [{ i: 0 }, { i: 1 }] as any;
  Object.defineProperty(list, 'splice', {
    configurable: true,
    value(this: any[]) {
      this[0].i = 99;
      return 'custom splice';
    },
  });

  const state = create({ list }, (draft) => {
    expect((draft.list as any).splice()).toBe('custom splice');
  });

  expect(state.list).toEqual([{ i: 99 }, { i: 1 }]);
});

test('array own mutation method is still used after lazy array copy', () => {
  const list = [{ i: 0 }, { i: 1 }] as any;
  Object.defineProperty(list, 'splice', {
    configurable: true,
    value(this: any[]) {
      this[0].i = 99;
      return 'custom splice';
    },
  });

  const state = create({ list }, (draft) => {
    draft.list.shift();
    expect((draft.list as any).splice()).toBe('custom splice');
  });

  expect(state.list).toEqual([{ i: 99 }]);
});

test('lazy array mutation methods keep native receiver semantics', () => {
  const other = [1, 2, 3];
  const state = create({ list: [{ i: 0 }, { i: 1 }] }, (draft) => {
    expect(draft.list.splice).toBe(draft.list.splice);
    const removed = draft.list.splice.call(other, 1, 1);
    expect(removed).toEqual([2]);
    expect(other).toEqual([1, 3]);
  });

  expect(state).toEqual({ list: [{ i: 0 }, { i: 1 }] });
});

test('lazy inserted original array value is not drafted', () => {
  const obj0 = { i: 0 };
  const obj1 = { i: 1 };
  const base = { list: [obj0, obj1] };

  const state = create(base, (draft) => {
    draft.list.unshift(obj1);
    draft.list[0].i = 9;
  });

  expect(base.list[1].i).toBe(9);
  expect(state.list[0]).toBe(obj1);
});

test('lazy spliced original array value is not drafted', () => {
  const obj0 = { i: 0 };
  const obj1 = { i: 1 };
  const base = { list: [obj0, obj1] };

  const state = create(base, (draft) => {
    draft.list.splice(0, 0, obj1);
    draft.list[0].i = 9;
  });

  expect(base.list[1].i).toBe(9);
  expect(state.list[0]).toBe(obj1);
});

test('lazy inserted assignment flags move with array mutations', () => {
  const inserted = { i: -1 };
  const base = { list: [{ i: 0 }] };

  const state = create(base, (draft) => {
    draft.list.unshift(inserted);
    draft.list.shift();
    draft.list[0].i = 9;
  });

  expect(base.list[0].i).toBe(0);
  expect(state.list[0]).not.toBe(base.list[0]);
  expect(state.list[0].i).toBe(9);
});

test('array subclass prototype mutation method is not overridden by lazy handler', () => {
  class Items extends Array<{ i: number }> {}
  Object.defineProperty(Items.prototype, 'splice', {
    configurable: true,
    value(this: Items) {
      this[0].i = 99;
      return 'custom prototype splice';
    },
  });
  const list = new Items({ i: 0 }, { i: 1 });

  const state = create({ list }, (draft) => {
    expect((draft.list as any).splice()).toBe('custom prototype splice');
  });

  expect(state.list[0].i).toBe(99);
  expect(state.list).toBeInstanceOf(Items);
});

test('lazy array mutation method is not added for arrays without it', () => {
  const list = [{ i: 0 }, { i: 1 }] as any;
  Object.setPrototypeOf(list, null);

  const state = create({ list }, (draft) => {
    expect((draft.list as any).splice).toBeUndefined();
  });

  expect(state.list).toBe(list);
});

test('lazy array mutation methods preserve array subclass copies', () => {
  class Items extends Array<{ i: number }> {}
  const mutations = [
    (draft: { list: Items }) => {
      draft.list.shift();
    },
    (draft: { list: Items }) => {
      draft.list.unshift({ i: -1 });
    },
    (draft: { list: Items }) => {
      draft.list.splice(1, 1);
    },
    (draft: { list: Items }) => {
      draft.list.reverse();
    },
  ];

  mutations.forEach((mutate) => {
    const list = new Items({ i: 0 }, { i: 1 });
    const state = create({ list }, mutate);

    expect(Array.isArray(state.list)).toBe(true);
    expect(state.list).toBeInstanceOf(Items);
  });
});

test('lazy array mutation methods respect array subclass species', () => {
  class Items extends Array<{ i: number }> {
    static get [Symbol.species]() {
      return Array;
    }
  }
  const list = new Items({ i: 0 }, { i: 1 });

  const state = create({ list }, (draft) => {
    draft.list.shift();
  });

  expect(Array.isArray(state.list)).toBe(true);
  expect(state.list).not.toBeInstanceOf(Items);
});

test('lazy array mutation copy keeps array subclass constructor effects', () => {
  class Items extends Array<{ i: number }> {
    created?: boolean;

    constructor(...items: { i: number }[]) {
      super(...items);
      this.created = true;
    }
  }
  const list = new Items({ i: 0 }, { i: 1 });

  const state = create({ list }, (draft) => {
    draft.list.shift();
  });

  expect(state.list).toBeInstanceOf(Items);
  expect(state.list.created).toBe(true);
});

test('lazy array mutation copy follows own array species', () => {
  class Copy extends Array<{ i: number }> {}
  const list = [{ i: 0 }, { i: 1 }] as any;
  Object.defineProperty(list, 'constructor', {
    configurable: true,
    value: {
      [Symbol.species]: Copy,
    },
  });

  const state = create({ list }, (draft) => {
    draft.list.shift();
  });

  expect(Array.isArray(state.list)).toBe(true);
  expect(state.list).toBeInstanceOf(Copy);
});

test('lazy array mutation uses copy prototype method after copy exists', () => {
  class Copy extends Array<{ i: number }> {}
  Object.defineProperty(Copy.prototype, 'splice', {
    configurable: true,
    value(this: Copy) {
      this[0].i = 77;
      return 'copy splice';
    },
  });
  const list = [{ i: 0 }, { i: 1 }] as any;
  Object.defineProperty(list, 'constructor', {
    configurable: true,
    value: {
      [Symbol.species]: Copy,
    },
  });

  const state = create({ list }, (draft) => {
    draft.list.shift();
    expect((draft.list as any).splice()).toBe('copy splice');
  });

  expect(state.list).toBeInstanceOf(Copy);
  expect(state.list[0].i).toBe(77);
});

test('lazy splice removed array follows copy species after copy exists', () => {
  class RemovedItems extends Array<{ i: number }> {}
  class Copy extends Array<{ i: number }> {
    static get [Symbol.species](): any {
      return RemovedItems;
    }
  }
  const list = [{ i: 0 }, { i: 1 }, { i: 2 }] as any;
  Object.defineProperty(list, 'constructor', {
    configurable: true,
    value: {
      [Symbol.species]: Copy,
    },
  });

  create({ list }, (draft) => {
    draft.list.shift();
    const removed = draft.list.splice(0, 1);
    expect(removed).toBeInstanceOf(RemovedItems);
    expect(removed[0].i).toBe(1);
  });
});

test('lazy array mutation copy follows non-array species', () => {
  class Copy {
    [key: number]: any;
    length: number;
    created = true;

    constructor(length: number) {
      this.length = length;
    }
  }
  const list = [{ i: 0 }, { i: 1 }] as any;
  Object.defineProperty(list, 'constructor', {
    configurable: true,
    value: {
      [Symbol.species]: Copy,
    },
  });

  const state = create({ list }, (draft) => {
    draft.list.shift();
  }) as any;

  expect(Array.isArray(state.list)).toBe(false);
  expect(state.list).toBeInstanceOf(Copy);
  expect(state.list.created).toBe(true);
  expect(state.list.length).toBe(1);
  expect(state.list[0]).toEqual({ i: 1 });
});

test('array original value check ignores custom indexOf', () => {
  const obj = {
    a: [{ i: 0 }, { i: 1 }],
  };
  Object.defineProperty(obj.a, 'indexOf', {
    configurable: true,
    value() {
      return -1;
    },
  });

  const state = create(obj, (draft) => {
    draft.a.reverse();
    expect(isDraft(draft.a[0])).toBeTruthy();
    draft.a[0].i = 42;
  });

  expect(obj.a[1].i).toBe(1);
  expect(state).toEqual({ a: [{ i: 42 }, { i: 0 }] });
});

test('shift with mark', () => {
  class Test {
    constructor(public i: number) {}
  }
  const obj = {
    a: Array.from({ length: 20 }, (_, i) => new Test(i)),
    o: { b: { c: 1 } },
  };
  const state = create(
    obj,
    (draft) => {
      const a = draft.a.shift()!;
      a.i++;
      draft.a.push(a);
      expect(isDraft(a)).toBeTruthy();
    },
    {
      mark: (value) => (value instanceof Test ? 'immutable' : undefined),
    }
  );
  // !!! check draft proxy array leakage
  expect(obj.a[0] === state.a.slice(-1)[0]).toBe(false);
});

test('splice with mark', () => {
  class Test {
    constructor(public i: number) {}
  }
  const obj = {
    a: Array.from({ length: 20 }, (_, i) => new Test(i)),
    o: { b: { c: 1 } },
  };
  const state = create(
    obj,
    (draft) => {
      const [a] = draft.a.splice(0, 1)!;
      a.i++;
      draft.a.push(a);
      expect(isDraft(a)).toBeTruthy();
    },
    {
      mark: (value) => (value instanceof Test ? 'immutable' : undefined),
    }
  );
  // !!! check draft proxy array leakage
  expect(obj.a[0] === state.a.slice(-1)[0]).toBe(false);
});

test('reverse drafts moved original item on later access', () => {
  const obj = {
    a: [{ i: 0 }, { i: 1 }],
  };
  const state = create(obj, (draft) => {
    draft.a.reverse();
    draft.a[0].i = 42;
  });
  expect(obj.a[1].i).toBe(1);
  expect(state).toEqual({ a: [{ i: 42 }, { i: 0 }] });
  expect(state.a[0]).not.toBe(obj.a[1]);
});

test('copyWithin no-op after lazy read does not mark array changed', () => {
  const obj = {
    a: [{ i: 0 }, { i: 1 }, { i: 2 }],
  };
  const state = create(obj, (draft) => {
    expect(isDraft(draft.a[0])).toBeTruthy();
    draft.a.copyWithin(-3, -3);
  });
  expect(state).toBe(obj);
});

test('current sees lazy array item changes', () => {
  create({ a: [{ i: 0 }, { i: 1 }] }, (draft) => {
    draft.a[0].i = 42;
    expect(current(draft.a)).toEqual([{ i: 42 }, { i: 1 }]);
  });
});

test('sort comparator still receives drafts', () => {
  const obj = {
    a: [{ i: 2 }, { i: 1 }],
  };
  const state = create(obj, (draft) => {
    draft.a.sort((a, b) => {
      expect(isDraft(a)).toBeTruthy();
      a.i += 10;
      return a.i - b.i;
    });
  });
  expect(obj).toEqual({ a: [{ i: 2 }, { i: 1 }] });
  expect(state.a.some((item) => item.i > 10)).toBeTruthy();
});

// test('shift with custom copy', () => {
//   const obj = {
//     a: Array.from({ length: 20 }, (_, i) => new Date(i)),
//     o: { b: { c: 1 } },
//   };
//   const state = create(
//     obj,
//     (draft) => {
//       const a = draft.a.shift()!;
//       a.setMilliseconds(42);
//       draft.a.push(a);
//       expect(isDraft(a)).toBeTruthy();
//     },
//     {
//       mark: (target) => {
//         if (target instanceof Date) return () => new Date(target.getTime());
//       },
//     }
//   );
//   // !!! check draft proxy array leakage
//   expect(obj.a[0] === state.a.slice(-1)[0]).toBe(false);
// });

// test('splice with custom copy', () => {
//   const obj = {
//     a: Array.from({ length: 20 }, (_, i) => new Date(i)),
//     o: { b: { c: 1 } },
//   };
//   const state = create(
//     obj,
//     (draft) => {
//       const [a] = draft.a.splice(0, 1)!;
//       a.setMilliseconds(42);
//       draft.a.push(a);
//       expect(isDraft(a)).toBeTruthy();
//     },
//     {
//       mark: (target) => {
//         if (target instanceof Date) return () => new Date(target.getTime());
//       },
//     }
//   );
//   // !!! check draft proxy array leakage
//   expect(obj.a[0] === state.a.slice(-1)[0]).toBe(false);
// });
