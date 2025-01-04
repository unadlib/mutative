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
  // !!! Draft proxy array leakage
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
  // !!! Draft proxy array leakage
  expect(obj.a[0] === state.a.slice(-1)[0]).toBe(false);
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
  // !!! Draft proxy array leakage
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
  // !!! Draft proxy array leakage
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
//   // !!! Draft proxy array leakage
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
//   // !!! Draft proxy array leakage
//   expect(obj.a[0] === state.a.slice(-1)[0]).toBe(false);
// });
