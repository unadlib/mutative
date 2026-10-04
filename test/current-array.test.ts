import { isDeepStrictEqual } from 'node:util';
import { create, current, isDraft, unsafe, type Options } from '../src';
import {
  arrayMethodOperations,
  makeArrayState,
  type ArrayMethodCase,
  type ArrayState,
} from './immer-array-methods-cases';

// current() copies a changed array draft from its current array, and leaves
// elements of the base state as they are, even after a native method moved
// them. Its snapshot at the end of a recipe must equal the state the recipe
// produces, hold no drafts, and share every unchanged element.

const containsDraft = (value: unknown, seen = new Set<unknown>()): boolean => {
  if (typeof value !== 'object' || value === null || seen.has(value)) {
    return false;
  }
  if (isDraft(value)) return true;
  seen.add(value);
  return Object.values(value).some((child) => containsDraft(child, seen));
};

// Values assigned in the recipe that hold drafts, which current() resolves.
const assignedDraftOperations: ArrayMethodCase[] = [
  {
    name: 'push draft holder',
    recipe: (draft) => {
      draft.source!.count++;
      draft.items.push({ id: 'y', value: 7, nested: draft.source! });
    },
  },
  {
    name: 'push first again',
    recipe: (draft) => {
      if (draft.items.length) draft.items.push(draft.items[0]);
    },
  },
];

const operations = [...arrayMethodOperations, ...assignedDraftOperations];

describe.each([
  { mode: 'native methods', options: {} },
  {
    mode: 'array methods on the proxy path',
    options: { mark: () => undefined },
  },
  { mode: 'strict mode', options: { strict: true } },
  { mode: 'auto-freeze', options: { enableAutoFreeze: true } },
])('current() with $mode', ({ options }) => {
  test(`matches the produced array after all ${operations.length ** 3} three-operation sequences`, () => {
    const failures: string[] = [];
    for (const first of operations) {
      for (const second of operations) {
        for (const third of operations) {
          const base = makeArrayState();
          let snapshot: ArrayState['items'] | undefined;
          let passed = false;
          try {
            const state = create(
              base,
              (draft) => {
                first.recipe(draft);
                second.recipe(draft);
                third.recipe(draft);
                snapshot = current(draft.items);
              },
              options as Options<false, boolean>
            );
            const baseItems = new Set<unknown>(base.items);
            passed =
              isDeepStrictEqual(snapshot, state.items) &&
              !containsDraft(snapshot) &&
              state.items.every(
                (item, index) =>
                  !baseItems.has(item) || snapshot![index] === item
              );
          } catch {
            // A sequence that throws fails like one with a wrong snapshot.
          }
          if (!passed) {
            failures.push(`${first.name} -> ${second.name} -> ${third.name}`);
          }
        }
      }
    }
    expect(failures).toEqual([]);
  });
});

test('an unchanged array is returned as is and a changed one is copied', () => {
  const base = { list: [{ id: 0 }, { id: 1 }] };
  create(base, (draft) => {
    draft.list.forEach((item) => item.id);
    expect(current(draft.list)).toBe(base.list);
    draft.list[0].id = 2;
    const snapshot = current(draft.list);
    expect(snapshot).not.toBe(base.list);
    expect(current(draft.list)).not.toBe(snapshot);
    expect(snapshot).toEqual([{ id: 2 }, { id: 1 }]);
    expect(snapshot[1]).toBe(base.list[1]);
  });
});

test('moved base elements are returned without being walked', () => {
  let ownKeys = 0;
  const element = (id: number) =>
    new Proxy(
      { id, nested: { id } },
      {
        ownKeys(target) {
          ownKeys += 1;
          return Reflect.ownKeys(target);
        },
      }
    );
  const base = { list: [element(0), element(1), element(2), element(3)] };
  create(base, (draft) => {
    draft.list.shift();
    draft.list.reverse();
    ownKeys = 0;
    const snapshot = current(draft.list);
    expect(ownKeys).toBe(0);
    expect(snapshot).toHaveLength(3);
    expect(snapshot[0]).toBe(base.list[3]);
    expect(snapshot[1]).toBe(base.list[2]);
    expect(snapshot[2]).toBe(base.list[1]);
  });
});

test('values assigned in the recipe are resolved after native moves', () => {
  type Item = { id: number; ref?: { count: number } };
  const base = {
    list: [{ id: 0 }, { id: 1 }, { id: 2 }] as Item[],
    other: { count: 0 },
  };
  create(base, (draft) => {
    draft.other.count += 1;
    draft.list.unshift({ id: 3, ref: draft.other });
    draft.list.splice(2, 0, { id: 4, ref: draft.other });
    draft.list.reverse();
    draft.list.shift();
    const snapshot = current(draft.list);
    expect(containsDraft(snapshot)).toBe(false);
    expect(snapshot).toEqual([
      { id: 1 },
      { id: 4, ref: { count: 1 } },
      { id: 0 },
      { id: 3, ref: { count: 1 } },
    ]);
    expect(snapshot[0]).toBe(base.list[1]);
    expect(snapshot[2]).toBe(base.list[0]);
  });
});

test('holes stay holes', () => {
  const list: ({ id: number } | undefined)[] = new Array(3);
  list[0] = { id: 0 };
  list[2] = { id: 2 };
  const base = { list };
  create(base, (draft) => {
    draft.list[0]!.id = 1;
    draft.list.length = 5;
    const snapshot = current(draft.list);
    expect(snapshot).toHaveLength(5);
    expect(1 in snapshot).toBe(false);
    expect(3 in snapshot).toBe(false);
    expect(4 in snapshot).toBe(false);
    expect(snapshot[0]).toEqual({ id: 1 });
    expect(snapshot[2]).toBe(base.list[2]);
  });
});

test('array subclasses keep their class', () => {
  class List<T> extends Array<T> {}
  const list = List.from([{ id: 0 }, { id: 1 }]) as List<{ id: number }>;
  create({ list }, (draft) => {
    draft.list[0].id = 2;
    const snapshot = current(draft.list);
    expect(snapshot).toBeInstanceOf(List);
    expect([...snapshot]).toEqual([{ id: 2 }, { id: 1 }]);
    expect(snapshot[1]).toBe(list[1]);
  });
});

test('strict mode still checks the elements of a changed array', () => {
  const date = new Date(0);
  const base = { list: [date, { id: 1 }] as [Date, { id: number }] };
  create(
    base,
    (draft) => {
      draft.list[1].id = 2;
      expect(() => current(draft.list)).toThrow(
        `Strict mode: Mutable data cannot be accessed directly, please use 'unsafe(callback)' wrap.`
      );
      const snapshot = unsafe(() => current(draft.list));
      expect(snapshot[0]).toBe(date);
      expect(snapshot[1]).toEqual({ id: 2 });
    },
    { strict: true }
  );
});

test('arrays under a mark hold the elements the recipe assigned or moved', () => {
  class Foo {
    n: number;
    constructor(n: number) {
      this.n = n;
    }
  }
  const base = { list: [new Foo(0), new Foo(1), new Foo(2)] };
  const next = new Foo(3);
  let snapshot: Foo[] | undefined;
  const state = create(
    base,
    (draft) => {
      draft.list[0] = next;
      draft.list.reverse();
      snapshot = current(draft.list);
    },
    {
      mark: (value, { mutable }) =>
        value instanceof Foo ? mutable : undefined,
    }
  );
  expect(snapshot).toHaveLength(3);
  expect(snapshot![0]).toBe(base.list[2]);
  expect(snapshot![1]).toBe(base.list[1]);
  expect(snapshot![2]).toBe(next);
  expect(state.list).toEqual(snapshot);
});
