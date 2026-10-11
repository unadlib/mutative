/* eslint-disable @typescript-eslint/no-explicit-any */
import { apply, create } from '../src';

const rows = (length: number) =>
  Array.from({ length }, (_, id) => ({ id, value: 0 }));

// Each move runs natively through the draft's method and on the proxy path
// through the borrowed method.
const moves: Record<string, (list: any[], native: boolean) => void> = {
  shift: (list, native) =>
    native ? list.shift() : Array.prototype.shift.call(list),
  unshift: (list, native) =>
    native
      ? list.unshift({ id: -1, value: 0 })
      : Array.prototype.unshift.call(list, { id: -1, value: 0 }),
  splice: (list, native) =>
    native ? list.splice(2, 1) : Array.prototype.splice.call(list, 2, 1),
  reverse: (list, native) =>
    native ? list.reverse() : Array.prototype.reverse.call(list),
};

// A repeated element is drafted under its last original index.
const layouts: Record<string, () => { id: number; value: number }[]> = {
  'one repeated element': () => {
    const list = rows(40);
    list[30] = list[5];
    return list;
  },
  'two alternating elements': () => {
    const [a, b] = rows(2);
    return Array.from({ length: 40 }, (_, index) => (index % 2 ? b : a));
  },
};

describe.each(
  Object.keys(moves).flatMap((name) =>
    Object.keys(layouts).flatMap((layout) => [
      [name, layout, false],
      [name, layout, true],
    ])
  )
)(
  '%s of %s, then edits of moved elements, frozen: %s',
  (name, layout, frozen) => {
    test.each([1, 8, 9, 40])('%i edits', (edits) => {
      const list = layouts[layout as string]();
      const base = { list };
      if (frozen) {
        list.forEach((item) => Object.freeze(item));
        Object.freeze(list);
        Object.freeze(base);
      }
      const before = JSON.stringify(base);
      const run = (native: boolean) =>
        create(
          base,
          (draft) => {
            moves[name as string](draft.list, native);
            for (let index = 0; index < edits; index += 1) {
              draft.list[(index * 7) % draft.list.length].value += 1;
            }
          },
          { enablePatches: true, enableAutoFreeze: frozen as boolean }
        );
      const [state, patches, inversePatches] = run(true);
      const [expected] = run(false);
      expect(state).toEqual(expected);
      expect(apply(base, patches)).toEqual(state);
      expect(apply(state, inversePatches)).toEqual(base);
      expect(JSON.stringify(base)).toBe(before);
    });
  }
);

test('an edit after a move does not index the original array', () => {
  const base = { list: rows(1000) };
  const set = vi.spyOn(Map.prototype, 'set');
  try {
    const state = create(base, (draft) => {
      draft.list.shift();
      draft.list[0].value = 1;
    });
    expect(state.list[0]).toEqual({ id: 1, value: 1 });
    expect(set.mock.calls.length).toBeLessThan(100);
  } finally {
    set.mockRestore();
  }
});

test.each([
  ['shift', 501],
  ['unshift', 499],
  ['splice', 501],
])(
  'an element that %s moved is found where it came from, without a backward search',
  (name, id) => {
    const list = Object.freeze(rows(1000));
    const base = Object.freeze({ list });
    const lastIndexOf = vi.spyOn(Array.prototype, 'lastIndexOf');
    try {
      const state = create(base, (draft) => {
        moves[name](draft.list, true);
        draft.list[500].value = 1;
      });
      expect(state.list[500]).toEqual({ id, value: 1 });
      expect(lastIndexOf).not.toHaveBeenCalled();
    } finally {
      lastIndexOf.mockRestore();
    }
  }
);

test('a moved element repeated many times is not searched for once per copy', () => {
  const [a, b] = rows(2);
  const list = Array.from({ length: 1000 }, (_, index) => (index % 2 ? b : a));
  const base = { list };
  const indexOf = vi.spyOn(Array.prototype, 'indexOf');
  const lastIndexOf = vi.spyOn(Array.prototype, 'lastIndexOf');
  const searches = (spy: typeof indexOf | typeof lastIndexOf) =>
    spy.mock.contexts.filter((context) => context === list).length;
  try {
    const state = create(base, (draft) => {
      draft.list.shift();
      for (let index = 0; index < 8; index += 1) {
        draft.list[index].value = index + 1;
      }
    });
    expect(state.list.slice(0, 9).map((item) => item.value)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 0,
    ]);
    // Each of the eight reads searches forward at most 17 times instead of
    // once per later copy, up to 499 of them, then backward once.
    expect(searches(indexOf)).toBe(8 * 17);
    expect(searches(lastIndexOf)).toBe(8);
  } finally {
    indexOf.mockRestore();
    lastIndexOf.mockRestore();
  }
});
