/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from '../src';

// Locked arrays are copied with a spread only under auto-freeze.
const options = { enableAutoFreeze: true };

test('frozen, sealed and non-extensible arrays are copied with their elements', () => {
  for (const enableAutoFreeze of [true, false]) {
    for (const lock of [Object.freeze, Object.seal, Object.preventExtensions]) {
      const rows: any[] = lock([{ id: 1 }, { id: 2 }, 3]);
      const state = create(
        { rows },
        (draft) => {
          draft.rows.push(4);
          draft.rows[0].id = 0;
        },
        { enableAutoFreeze }
      );
      expect(state.rows).toEqual([{ id: 0 }, { id: 2 }, 3, 4]);
      expect(state.rows[1]).toBe(rows[1]);
      expect(rows).toEqual([{ id: 1 }, { id: 2 }, 3]);
    }
  }
});

test('copies of frozen arrays keep holes and undefined elements', () => {
  const holey: number[] = new Array(3);
  holey[0] = 1;
  holey[2] = 3;
  const state = create(
    { list: Object.freeze(holey) },
    (draft) => {
      draft.list[0] = 0;
    },
    options
  );
  expect(state.list.length).toBe(3);
  expect(1 in state.list).toBe(false);
  expect(state.list[2]).toBe(3);

  const next = create(
    { list: Object.freeze([1, undefined, 3]) },
    (draft) => {
      draft.list[0] = 0;
    },
    options
  );
  expect(1 in next.list).toBe(true);
  expect(next.list).toEqual([0, undefined, 3]);
});

test('copies of frozen arrays do not call their own iterator', () => {
  let calls = 0;
  const list = [1, 2, 3];
  Object.defineProperty(list, Symbol.iterator, {
    *value() {
      calls += 1;
      yield 9;
    },
  });
  Object.freeze(list);
  const state = create(
    { list },
    (draft) => {
      draft.list[0] = 0;
    },
    options
  );
  expect(calls).toBe(0);
  expect(Array.from({ length: 3 }, (_, index) => state.list[index])).toEqual([
    0, 2, 3,
  ]);
});

test('copies of frozen arrays do not call replaced array iterators', () => {
  const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
  const list = Object.freeze([...items]);
  // Only iterations of the frozen array during the recipe count: Mutative
  // destructures arrays of its own, and auto-freeze iterates the result.
  let inRecipe = false;
  let calls = 0;
  const recipe = (draft: { list: { id: number }[] }) => {
    inRecipe = true;
    draft.list.push({ id: 4 });
    inRecipe = false;
  };
  const values = Array.prototype[Symbol.iterator];
  const iterator = Object.getPrototypeOf(values.call([]));
  const next = iterator.next;
  let state: { list: readonly { id: number }[] };
  (Array.prototype as any)[Symbol.iterator] = function (this: unknown[]) {
    if (this === list) calls += 1;
    return values.call(this);
  };
  try {
    state = create({ list }, recipe, options);
  } finally {
    (Array.prototype as any)[Symbol.iterator] = values;
  }
  expect(calls).toBe(0);
  expect(state.list).toEqual([...items, { id: 4 }]);

  iterator.next = function (this: Iterator<unknown>) {
    const result = next.call(this);
    if (inRecipe && items.includes(result.value)) calls += 1;
    return result;
  };
  try {
    state = create({ list }, recipe, options);
  } finally {
    iterator.next = next;
  }
  expect(calls).toBe(0);
  expect(state.list).toEqual([...items, { id: 4 }]);
});

test('copies of frozen arrays keep the class that concat creates', () => {
  class List<T> extends Array<T> {}
  const list = Object.freeze(List.from([1, 2, 3]));
  const state = create(
    { list },
    (draft) => {
      draft.list[0] = 0;
    },
    options
  );
  expect(state.list).toBeInstanceOf(List);
  expect([...state.list]).toEqual([0, 2, 3]);

  const custom: number[] = [1, 2, 3];
  Object.defineProperty(custom, 'constructor', { value: List });
  Object.freeze(custom);
  const next = create(
    { list: custom },
    (draft) => {
      draft.list[0] = 0;
    },
    options
  );
  expect(next.list).toBeInstanceOf(List);
  expect([...next.list]).toEqual([0, 2, 3]);
});

test('auto-frozen arrays are copied from state to state', () => {
  let state = create(
    { list: [1, 2, 3] },
    (draft) => {
      draft.list.push(4);
    },
    options
  );
  state = create(
    state,
    (draft) => {
      draft.list[0] = 0;
      draft.list.push(5);
    },
    options
  );
  expect(state.list).toEqual([0, 2, 3, 4, 5]);
  expect(Object.isFrozen(state.list)).toBe(true);
});
