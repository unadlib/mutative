import { create, isDraft } from '../src';

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

test('unshift', () => {
  const obj = {
    a: Array.from({ length: 20 }, (_, i) => ({ i })),
    o: { b: { c: 1 } },
  };
  const state = create(obj, (draft) => {
    draft.a.unshift({ i: 42 });
  });
  expect(obj.a.slice(-1)[0] === state.a.slice(-1)[0]).toBe(true);
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

test('reverse', () => {
  const obj = {
    a: Array.from({ length: 20 }, (_, i) => ({ i })),
    o: { b: { c: 1 } },
  };
  const state = create(obj, (draft) => {
    const arr = draft.a.reverse();
    expect(isDraft(draft.a)).toBeTruthy();
    expect(isDraft(arr)).toBeTruthy();
  });
  // !!! check draft proxy array leakage
  expect(obj.a[0] === state.a.slice(-1)[0]).toBe(true);
});

test('sort', () => {
  const obj = {
    a: Array.from({ length: 20 }, (_, i) => ({ i })),
    o: { b: { c: 1 } },
  };
  const state = create(obj, (draft) => {
    draft.a.sort((a, b) => b.i - a.i);
  });
  expect(obj.a[0] === state.a.slice(-1)[0]).toBe(true);
});

test('sort - 1', () => {
  const obj = {
    a: Array.from({ length: 20 }, (_, i) => ({ i })),
    o: { b: { c: 1 } },
  };
  const state = create(obj, (draft) => {
    draft.a.sort((a, b) => {
      // @ts-ignore
      a._i = 1;
      // @ts-ignore
      b._i = 1;
      return b.i - a.i;
    });
  });
  expect(obj.a[0].i).toBe(state.a.slice(-1)[0].i);
  expect(obj.a[0] !== state.a.slice(-1)[0]).toBe(true);
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
