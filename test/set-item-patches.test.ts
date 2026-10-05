/* eslint-disable @typescript-eslint/no-explicit-any */
import { apply, create } from '../src';

const replay = (base: any, recipe: (draft: any) => void) => {
  const [state, patches, inversePatches] = create(base, recipe, {
    enablePatches: true,
  });
  expect(apply(base, patches)).toStrictEqual(state);
  expect(apply(state, inversePatches)).toStrictEqual(base);
  return [state, patches, inversePatches] as const;
};

describe('items of a Set draft with patches enabled', () => {
  test('every item keeps the changes below its first level', () => {
    const base = {
      set: new Set([
        { id: 'a', x: { v: 0 } },
        { id: 'b', x: { v: 0 } },
        { id: 'c', x: { v: 0 } },
      ]),
    };
    const [state, patches] = replay(base, (draft) => {
      for (const item of draft.set) item.x.v += 1;
    });
    expect([...state.set].map((item) => item.x.v)).toStrictEqual([1, 1, 1]);
    expect(patches).toStrictEqual([
      { op: 'replace', path: ['set', 2, 'x', 'v'], value: 1 },
      { op: 'replace', path: ['set', 1, 'x', 'v'], value: 1 },
      { op: 'replace', path: ['set', 0, 'x', 'v'], value: 1 },
    ]);
  });

  test('Sets and arrays inside a Set keep their changes', () => {
    const base = {
      sets: new Set([new Set([{ v: 0 }]), new Set([{ v: 0 }])]),
      lists: new Set([[{ v: 0 }], [{ v: 0 }]]),
    };
    const [state] = replay(base, (draft) => {
      for (const inner of draft.sets) for (const item of inner) item.v += 1;
      for (const list of draft.lists) list[0].v += 1;
    });
    expect([...state.sets].map((inner) => [...inner][0].v)).toStrictEqual([
      1, 1,
    ]);
    expect([...state.lists].map((list) => list[0].v)).toStrictEqual([1, 1]);
    expect([...base.sets].map((inner) => [...inner][0].v)).toStrictEqual([
      0, 0,
    ]);
  });
});

describe('items of a Set that added or removed items', () => {
  const items = () => [
    { id: 'a', v: 1 },
    { id: 'b', v: 2 },
    { id: 'c', v: 3 },
  ];

  test('a changed item is carried by the remove and add patches of the Set', () => {
    const [a, b, c] = items();
    const [state, patches] = replay(new Set([a, b, c]), (draft) => {
      draft.delete(a);
      for (const item of draft) if (item.id === 'c') item.v = 30;
    });
    expect([...state]).toStrictEqual([
      { id: 'b', v: 2 },
      { id: 'c', v: 30 },
    ]);
    expect(patches).toStrictEqual([
      { op: 'remove', path: [0], value: { id: 'a', v: 1 } },
      { op: 'remove', path: [2], value: { id: 'c', v: 3 } },
      { op: 'add', path: [1], value: { id: 'c', v: 30 } },
    ]);
  });

  test.each([
    [
      'a primitive before the changed item',
      (set: Set<any>, [a]: any[]) => {
        set.delete(a);
        for (const item of set) if (item?.id === 'c') item.v = 30;
      },
    ],
    [
      'an item deleted and added back below the base size',
      (set: Set<any>, [a]: any[]) => {
        const [first] = set;
        set.delete(first);
        set.add(a);
        for (const item of set) if (item?.id === 'a') item.v = 10;
      },
    ],
    [
      'a cleared Set with items added back',
      (set: Set<any>, [a, , c]: any[]) => {
        set.clear();
        set.add(c);
        set.add(a);
        for (const item of set) if (item?.id === 'a') item.v = 10;
      },
    ],
    [
      'every item changed and the first deleted',
      (set: Set<any>) => {
        for (const item of set) if (item?.id) item.v += 1;
        for (const item of set) if (item?.id === 'a') set.delete(item);
      },
    ],
    [
      'a changed item moved to another Set',
      (set: Set<any>, _: any[], draft: any) => {
        for (const item of set) {
          if (item?.id === 'b') {
            item.v = 20;
            set.delete(item);
            draft.other.add(item);
          }
        }
      },
    ],
  ])('replays both ways with %s', (_, change) => {
    const [a, b, c] = items();
    replay(
      { set: new Set<any>([a, 7, b, c]), other: new Set<any>() },
      (draft) => change(draft.set, [a, b, c], draft)
    );
  });

  test('a Set that only changed its items keeps positional patches that undo and redo', () => {
    const base = new Set(items());
    const [state, patches, inversePatches] = replay(base, (draft) => {
      for (const item of draft) if (item.id === 'b') item.v = 20;
    });
    expect(patches).toStrictEqual([
      { op: 'replace', path: [1, 'v'], value: 20 },
    ]);
    const undone = apply(state, inversePatches);
    const redone = apply(undone, patches);
    expect([...redone]).toStrictEqual([...state]);
    expect([...apply(redone, inversePatches)]).toStrictEqual([...base]);
  });
});
