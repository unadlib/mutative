/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from '../src';

const hasIteratorHelpers =
  typeof (globalThis as any).Iterator?.prototype?.toArray === 'function';

describe('iterators of Map and Set drafts', () => {
  test.each(['values', 'entries', 'keys'])(
    'Set %s() continues where it stopped',
    (method) => {
      create(new Set([1, 2, 3]), (draft: any) => {
        const iterator = draft[method]();
        expect(iterator[Symbol.iterator]()).toBe(iterator);
        expect(iterator.next()).toStrictEqual({
          done: false,
          value: method === 'entries' ? [1, 1] : 1,
        });
        expect([...iterator]).toStrictEqual(
          method === 'entries'
            ? [
                [2, 2],
                [3, 3],
              ]
            : [2, 3]
        );
        expect([...iterator]).toStrictEqual([]);
      });
    }
  );

  test.each(['values', 'entries', 'keys'])(
    'Map %s() continues where it stopped',
    (method) => {
      create(
        new Map([
          ['a', 1],
          ['b', 2],
          ['c', 3],
        ]),
        (draft: any) => {
          const iterator = draft[method]();
          expect(iterator[Symbol.iterator]()).toBe(iterator);
          iterator.next();
          expect([...iterator]).toStrictEqual(
            {
              values: [2, 3],
              entries: [
                ['b', 2],
                ['c', 3],
              ],
              keys: ['b', 'c'],
            }[method]
          );
        }
      );
    }
  );

  test('items of a partly consumed iterator are drafts', () => {
    const state = create(
      {
        set: new Set([{ a: 1 }, { a: 2 }]),
        map: new Map([
          ['x', { a: 1 }],
          ['y', { a: 2 }],
        ]),
      },
      (draft) => {
        const items = draft.set.values();
        items.next();
        for (const item of items) item.a += 10;
        const entries = draft.map.entries();
        entries.next();
        for (const [, item] of entries) item.a += 10;
      }
    );
    expect([...state.set]).toStrictEqual([{ a: 1 }, { a: 12 }]);
    expect([...state.map]).toStrictEqual([
      ['x', { a: 1 }],
      ['y', { a: 12 }],
    ]);
  });

  test('Map iteration reads entries as get() does', () => {
    class Mutable {
      value = 1;
    }
    const mutable = new Mutable();
    const base = new Map<string, any>([
      ['a', { v: 1 }],
      ['b', mutable],
      ['c', 1],
    ]);
    const state = create(
      base,
      (draft) => {
        const read: any[] = [];
        draft.forEach((value) => read.push(value));
        expect(read[0]).toBe(draft.get('a'));
        expect(read[1]).toBe(mutable);
        expect([...draft.values()]).toStrictEqual(read);
        expect([...draft.entries()].map(([, value]) => value)).toStrictEqual(
          read
        );
        read[0].v = 2;
        read[1].value = 2;
      },
      {
        mark: (value) => (value instanceof Mutable ? 'mutable' : undefined),
      }
    );
    expect(state.get('a')).toStrictEqual({ v: 2 });
    expect(base.get('a')).toStrictEqual({ v: 1 });
    expect(mutable.value).toBe(2);
    for (const iterate of [
      (map: Map<string, any>) => map.forEach(() => undefined),
      (map: Map<string, any>) => [...map.values()],
      (map: Map<string, any>) => [...map.entries()],
    ]) {
      expect(() =>
        create(
          { map: new Map([['date', new Date(0)]]) },
          (draft) => {
            iterate(draft.map);
          },
          { strict: true }
        )
      ).toThrow('Strict mode');
    }
  });

  // The difference from a Map that the FAQ describes, and its workaround.
  test('an iteration that starts before a Map draft changes walks the base Map', () => {
    const base = new Map([
      ['a', 1],
      ['b', 2],
    ]);
    const seen: any[] = [];
    create(base, (draft) => {
      draft.forEach((value, key) => {
        seen.push([key, value]);
        if (key === 'a') {
          draft.delete('b');
          draft.set('c', 3);
        }
      });
    });
    expect(seen).toStrictEqual([
      ['a', 1],
      ['b', undefined],
    ]);
    const visited: any[] = [];
    const state = create(base, (draft) => {
      for (const key of Array.from(draft.keys())) {
        if (draft.has(key)) {
          visited.push([key, draft.get(key)]);
          if (key === 'a') draft.delete('b');
        }
      }
    });
    expect(visited).toStrictEqual([['a', 1]]);
    expect([...state]).toStrictEqual([['a', 1]]);
  });

  test('Set drafts iterate like Sets while they change', () => {
    const seen: any[] = [];
    create(new Set([1, 2]), (draft) => {
      for (const value of draft) {
        seen.push(value);
        if (value === 1) {
          draft.delete(2);
          draft.add(3);
        }
      }
    });
    expect(seen).toStrictEqual([1, 3]);
  });

  test.runIf(hasIteratorHelpers)('iterator helpers are available', () => {
    create(
      {
        set: new Set([1, 2, 3]),
        map: new Map([
          ['a', 1],
          ['b', 2],
        ]),
      },
      (draft) => {
        expect((draft.set.values() as any).toArray()).toStrictEqual([1, 2, 3]);
        expect((draft.set.entries() as any).drop(2).toArray()).toStrictEqual([
          [3, 3],
        ]);
        expect((draft.map.values() as any).drop(1).toArray()).toStrictEqual([
          2,
        ]);
        expect(
          (draft.map.entries() as any).map(([key]: any) => key).toArray()
        ).toStrictEqual(['a', 'b']);
        expect((draft.map[Symbol.iterator]() as any).toArray()).toStrictEqual([
          ['a', 1],
          ['b', 2],
        ]);
      }
    );
  });
});
