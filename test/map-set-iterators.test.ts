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
