/* eslint-disable @typescript-eslint/no-explicit-any */
import { isDeepStrictEqual } from 'node:util';
import { apply, create } from '../src';

// A changed child draft that leaves its key is part of the values its parent
// emits; patches under its old path would no longer apply.
function replay(base: any, recipe: (draft: any) => void) {
  const [state, patches, inversePatches] = create(base, recipe, {
    enablePatches: true,
  });
  expect(apply(base, patches)).toStrictEqual(state);
  expect(apply(state, inversePatches)).toStrictEqual(base);
  return [state, patches, inversePatches] as const;
}

describe('patches of drafts that left their key', () => {
  test('a changed element sorted away from the key a primitive takes', () => {
    const base = [{ v: 3 }, 0, { v: 1 }];
    const [state, patches, inversePatches] = replay(base, (draft) => {
      draft[0].v = 4;
      draft.sort((a: any, b: any) => (a?.v ?? a) - (b?.v ?? b));
    });
    expect(state).toStrictEqual([0, { v: 1 }, { v: 4 }]);
    expect(patches).toStrictEqual([
      { op: 'replace', path: [0], value: 0 },
      { op: 'replace', path: [1], value: { v: 1 } },
      { op: 'replace', path: [2], value: { v: 4 } },
    ]);
    expect(inversePatches[0]).toStrictEqual({
      op: 'replace',
      path: [0],
      value: { v: 3 },
    });
  });

  test.each([5, 'x', false, undefined, null, { fresh: true }])(
    'an object key that holds %s after its draft moved',
    (value) => {
      const base = { a: { x: 1 }, b: { y: 1 } };
      const [state] = replay(base, (draft) => {
        draft.a.x = 2;
        expect(draft.b.y).toBe(1);
        draft.b = draft.a;
        draft.a = value;
      });
      expect(state).toStrictEqual({ a: value, b: { x: 2 } });
    }
  );

  test('a Map key that holds a primitive after its draft moved', () => {
    const base = new Map<string, any>([
      ['a', { x: 1 }],
      ['b', { y: 1 }],
    ]);
    const [state] = replay(base, (draft) => {
      draft.get('a').x = 2;
      expect(draft.get('b').y).toBe(1);
      draft.set('b', draft.get('a'));
      draft.set('a', 5);
    });
    expect(state).toStrictEqual(
      new Map<string, any>([
        ['a', 5],
        ['b', { x: 2 }],
      ])
    );
  });

  test('a changed draft swapped with another draft of the same object', () => {
    const shared = { v: 1 };
    const base = [shared, { w: 1 }, shared];
    const [state, patches] = replay(base, (draft) => {
      draft[0].v = 2;
      expect(draft[2].v).toBe(1);
      const first = draft[0];
      draft[0] = draft[2];
      draft[2] = first;
    });
    expect(state).toStrictEqual([{ v: 1 }, { w: 1 }, { v: 2 }]);
    expect(patches).toStrictEqual([
      { op: 'replace', path: [2], value: { v: 2 } },
    ]);
  });

  test('a Set item added back after additions is carried by the add patch', () => {
    const a = { v: 1 };
    const b = { v: 2 };
    const base = new Set([a, b]);
    const [state, patches] = replay(base, (draft) => {
      draft.add({ v: 3 });
      const [first] = draft;
      expect(first.v).toBe(1);
      draft.delete(first);
      draft.add(a);
      // The item is drafted again at a position past the base Set's size.
      for (const item of draft) if (item.v === 1) item.v = 10;
    });
    expect([...state]).toStrictEqual([{ v: 2 }, { v: 3 }, { v: 10 }]);
    expect(patches).toStrictEqual([
      { op: 'remove', path: [0], value: { v: 1 } },
      { op: 'add', path: [1], value: { v: 3 } },
      { op: 'add', path: [2], value: { v: 10 } },
    ]);
  });

  test('a changed nested draft whose parent moved away', () => {
    const base = { list: [{ inner: { v: 3 } }, 'gap', { inner: { v: 1 } }] };
    const [state] = replay(base, (draft) => {
      draft.list[0].inner.v = 4;
      draft.list.sort((a: any, b: any) =>
        typeof a === 'string' ? -1 : typeof b === 'string' ? 1 : 0
      );
    });
    expect(state.list[0]).toBe('gap');
  });

  test('random edits and moves replay in both directions', () => {
    // Park-Miller generator: the same recipes on every run.
    let seed = 7;
    const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const int = (n: number) => Math.floor(random() * n);
    const keys = ['a', 'b', 'c', 'd'];
    const failures: unknown[] = [];
    for (let run = 0; run < 400; run += 1) {
      const shared = { s: 1, deep: { z: 1 } };
      const list: any[] = [];
      for (let index = 2 + int(5); index > 0; index -= 1) {
        const kind = random();
        list.push(
          kind < 0.2
            ? index
            : kind < 0.3
              ? null
              : kind < 0.45
                ? shared
                : { v: index, deep: { z: index } }
        );
      }
      const base = {
        list,
        record: { a: { x: 1 }, b: { y: 2 }, c: 3, d: shared } as any,
      };
      const steps = Array.from({ length: 1 + int(6) }, () => [
        int(10),
        int(8),
        int(8),
        int(100),
      ]);
      const [state, patches, inversePatches] = create(
        base,
        (draft) => {
          for (const [op, i, j, k] of steps) {
            const items = draft.list;
            const x = i % items.length;
            const y = j % items.length;
            const item = items[x];
            const record = draft.record;
            if (op === 0 && item && typeof item === 'object') item.v = k;
            else if (op === 1 && item && typeof item === 'object')
              item.deep.z = k;
            else if (op === 2) [items[x], items[y]] = [items[y], items[x]];
            else if (op === 3) items[x] = k % 2 ? k : undefined;
            else if (op === 4)
              items.sort(
                (p: any, q: any) =>
                  (p?.v ?? (typeof p === 'number' ? p : -1)) -
                  (q?.v ?? (typeof q === 'number' ? q : -1))
              );
            else if (op === 5) items.reverse();
            else if (op === 6) Array.prototype.reverse.call(items);
            else if (op === 7) items[x] = items[y];
            else if (op === 8) {
              const value = record[keys[i % 4]];
              if (value && typeof value === 'object') value.x = k;
              record[keys[j % 4]] = value;
            } else record[keys[i % 4]] = k % 2 ? k : 'text';
          }
        },
        { enablePatches: true }
      );
      try {
        if (
          !isDeepStrictEqual(apply(base, patches), state) ||
          !isDeepStrictEqual(apply(state, inversePatches), base)
        ) {
          failures.push(steps);
        }
      } catch {
        failures.push(steps);
      }
    }
    expect(failures).toStrictEqual([]);
  });
});

// A parent that a recipe placed at a key read after the drafts it holds is
// found at that key before they are finalized. Their patches assume its
// original layout, so they still come before its own.
describe('patches of a parent placed at a key read after the drafts it holds', () => {
  const optionSets = [
    { enablePatches: { arrayLengthAssignment: true }, strict: false },
    { enablePatches: { arrayLengthAssignment: false }, strict: false },
    // Strict mode moves the elements of these arrays through the proxy.
    { enablePatches: { arrayLengthAssignment: true }, strict: true },
  ];
  const recipes: [string, (list: any[]) => void][] = [
    [
      'unshift() of a changed element',
      (list) => {
        list[0].push(9);
        list.unshift(list[0]);
      },
    ],
    [
      'splice() that inserts a changed element at its index',
      (list) => {
        list[0].push(9);
        list.splice(0, 0, list[0]);
      },
    ],
    [
      'unshift() then shift()',
      (list) => {
        list[0].push(9);
        list.unshift([1]);
        list.shift();
      },
    ],
    [
      'shift() then unshift() of the shifted element',
      (list) => {
        list[0].push(9);
        list.unshift(list.shift());
      },
    ],
    [
      'reverse() twice',
      (list) => {
        list[0].push(9);
        list.reverse();
        list.reverse();
      },
    ],
    [
      'an element assigned back to its index',
      (list) => {
        const item = list[0];
        item.push(9);
        list[0] = [1];
        list[0] = item;
      },
    ],
  ];

  // `recipe` reads the parent and the drafts it holds, then calls `place`,
  // which reads record.key only then and places the parent there.
  function replayEarly(
    makeBase: () => any,
    recipe: (draft: any, place: (parent: any) => void) => void,
    options: (typeof optionSets)[number]
  ) {
    const base = makeBase();
    const [state, patches, inversePatches] = create(
      base,
      (draft: any) =>
        recipe(draft, (parent) => {
          expect(draft.record.key).toEqual({});
          draft.record.key = parent;
        }),
      options
    );
    expect(apply(makeBase(), patches)).toStrictEqual(state);
    expect(apply(state, inversePatches)).toStrictEqual(makeBase());
    expect(base).toStrictEqual(makeBase());
    return patches;
  }

  describe.each(optionSets)('with options %j', (options) => {
    test.each(recipes)('%s', (_, recipe) => {
      replayEarly(
        () => ({ record: { key: {} }, list: [[7, 4], [5]] }),
        (draft, place) => {
          const list = draft.list;
          expect(list[0]).toEqual([7, 4]);
          place(list);
          recipe(list);
        },
        options
      );
    });

    test('an object key assigned its draft again', () => {
      replayEarly(
        () => ({ record: { key: {} }, item: { list: [7, 4] } }),
        (draft, place) => {
          const item = draft.item;
          const list = item.list;
          place(item);
          list.push(9);
          item.list = [1];
          item.list = list;
        },
        options
      );
    });

    test('a Map key set to its draft again', () => {
      replayEarly(
        () => ({ record: { key: {} }, map: new Map([['list', [7, 4]]]) }),
        (draft, place) => {
          const map = draft.map;
          const list = map.get('list');
          place(map);
          list.push(9);
          map.set('list', [1]);
          map.set('list', list);
        },
        options
      );
    });

    test('an element whose own draft changed, moved and moved back', () => {
      replayEarly(
        () => ({
          record: { key: {} },
          list: [{ inner: [7, 4] }, { inner: [5] }],
        }),
        (draft, place) => {
          const list = draft.list;
          const inner = list[0].inner;
          place(list);
          inner.push(9);
          list.unshift({ inner: [] });
          list.shift();
        },
        options
      );
    });
  });

  test("an element's patches precede its list's", () => {
    const patches = replayEarly(
      () => ({ record: { key: {} }, list: [[7, 4]] }),
      (draft, place) => {
        const list = draft.list;
        const item = list[0];
        place(list);
        item.push(9);
        list.unshift(item);
      },
      optionSets[0]
    );
    const element = patches.findIndex((patch) => patch.path.length === 3);
    const list = patches.findIndex(
      (patch) => patch.path.length === 2 && patch.path[0] === 'list'
    );
    expect(element).toBeGreaterThan(-1);
    expect(element).toBeLessThan(list);
  });

  test('random edits and moves of a placed list replay in both directions', () => {
    // Park-Miller generator: the same recipes on every run.
    let seed = 7;
    const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const int = (n: number) => Math.floor(random() * n);
    // Reads only create drafts, so that later keys' nodes come after theirs.
    const read = (value: unknown) => value;
    const keys = ['a', 'b', 'c'];
    const failures: unknown[] = [];
    for (let run = 0; run < 1000; run += 1) {
      const list: any[] = [];
      for (let index = 2 + int(4); index > 0; index -= 1) {
        const kind = random();
        list.push(
          kind < 0.15
            ? index
            : kind < 0.55
              ? [index, index + 1]
              : { v: index, deep: [index] }
        );
      }
      const base = {
        record: { a: {}, b: {}, c: {} } as Record<string, any>,
        list,
      };
      const steps = Array.from({ length: 2 + int(7) }, () => [
        int(11),
        int(8),
        int(8),
        int(100),
      ]);
      const options = optionSets[int(3)];
      try {
        const [state, patches, inversePatches] = create(
          base,
          (draft) => {
            for (const [op, i, j, k] of steps) {
              const items = draft.list;
              const n = items.length;
              const x = n ? i % n : 0;
              const y = n ? j % n : 0;
              const record = draft.record;
              const key = keys[i % 3];
              if (op === 0 && n) read(items[x]);
              else if (op === 1 && n) {
                const item = items[x];
                if (Array.isArray(item)) item.push(k);
                else if (item && typeof item === 'object') {
                  if (k % 2) item.v = k;
                  else item.deep.push(k);
                }
              } else if (op === 2) {
                // The list is placed at a key read after its drafts.
                read(record[key]);
                record[key] = items;
              } else if (op === 3) items.unshift(n && k % 2 ? items[y] : [k]);
              else if (op === 4) items.shift();
              else if (op === 5) {
                if (k % 3 === 0) items.splice(x, 1);
                else if (k % 3 === 1 && n) items.splice(x, 0, items[y]);
                else items.splice(x, 1, [k]);
              } else if (op === 6) items.reverse();
              else if (op === 7 && n) items[x] = items[y];
              else if (op === 8 && n) {
                const item = items[x];
                items[x] = [k];
                items[x] = item;
              } else if (op === 9 && n) {
                const item = items[x];
                if (item && typeof item === 'object') record[key] = item;
              } else if (op === 10 && n) items[x] = k;
            }
          },
          options
        );
        if (
          !isDeepStrictEqual(apply(base, patches), state) ||
          !isDeepStrictEqual(apply(state, inversePatches), base)
        ) {
          failures.push(steps);
        }
      } catch {
        failures.push(steps);
      }
    }
    expect(failures).toStrictEqual([]);
  });
});
