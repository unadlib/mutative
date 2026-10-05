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
