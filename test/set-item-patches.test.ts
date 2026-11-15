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

describe('inverse patches of Set drafts', () => {
  test('come first, those of the Set draft finalized last first', () => {
    const base = {
      a: new Set([1, 2, 3]),
      o: { v: 0 },
      b: new Set(['x', 'y']),
      l: [0],
    };
    const [, patches, inversePatches] = replay(base, (draft) => {
      draft.a.delete(1);
      draft.a.add(4);
      draft.o.v = 1;
      draft.b.add('z');
      draft.b.delete('x');
      draft.l.push(1);
    });
    // Drafts are finalized in reverse order of creation: l, b, o, then a.
    expect(patches).toStrictEqual([
      { op: 'add', path: ['l', 1], value: 1 },
      { op: 'remove', path: ['b', 0], value: 'x' },
      { op: 'add', path: ['b', 1], value: 'z' },
      { op: 'replace', path: ['o', 'v'], value: 1 },
      { op: 'remove', path: ['a', 0], value: 1 },
      { op: 'add', path: ['a', 2], value: 4 },
    ]);
    expect(inversePatches).toStrictEqual([
      { op: 'remove', path: ['a', 2], value: 4 },
      { op: 'add', path: ['a', 0], value: 1 },
      { op: 'remove', path: ['b', 1], value: 'z' },
      { op: 'add', path: ['b', 0], value: 'x' },
      { op: 'replace', path: ['l', 'length'], value: 1 },
      { op: 'replace', path: ['o', 'v'], value: 0 },
    ]);
  });

  test('are not prepended one at a time', () => {
    const items = Array.from({ length: 1000 }, (_, index) => index);
    const base = {
      list: [{ v: 0 }],
      set: new Set(items),
      sets: items.map((item) => new Set([item])),
    };
    const unshift = vi.spyOn(Array.prototype, 'unshift');
    try {
      const [, , inversePatches] = replay(base, (draft) => {
        draft.list[0].v = 1;
        draft.set.clear();
        for (const set of draft.sets) set.add(-1);
      });
      // Prepending each would move every inverse patch generated before it.
      expect(
        unshift.mock.contexts.filter((context) => context === inversePatches)
      ).toHaveLength(0);
      expect(inversePatches).toStrictEqual([
        ...items.map((_, index) => ({
          op: 'add',
          path: ['set', 999 - index],
          value: 999 - index,
        })),
        ...items.map((index) => ({
          op: 'remove',
          path: ['sets', index, 1],
          value: -1,
        })),
        { op: 'replace', path: ['list', 0, 'v'], value: 0 },
      ]);
    } finally {
      unshift.mockRestore();
    }
  });
});

describe('positions of the items of a Set draft in patch paths', () => {
  test('are those of the base Set, in whatever order the recipe drafts and changes the items', () => {
    const base = {
      other: { v: 0 },
      set: new Set<any>([
        { id: 0, child: { v: 0 } },
        'a',
        { id: 2, child: { v: 0 }, tags: new Set([{ t: 0 }, { t: 1 }]) },
        3,
        { id: 4, child: { v: 0 } },
        { id: 5, child: { v: 0 } },
      ]),
    };
    const [, patches, inversePatches] = replay(base, (draft) => {
      // The first iteration stops at the first item.
      for (const item of draft.set) {
        item.id = 'first';
        break;
      }
      // Adding and deleting a draft leaves the Set unchanged, so patches
      // still name its items by position.
      draft.set.add(draft.other);
      draft.set.delete(draft.other);
      // A later iteration drafts the other items. Their children are drafted
      // from the last item to the first, so they are finalized from the first
      // item to the last.
      const items = [...draft.set].filter((item) => typeof item === 'object');
      for (const item of items.reverse()) item.child.v += 1;
      items[1].id = 'fifth';
      // An item of a Set that an item holds has a position at either level.
      for (const tag of items[2].tags) tag.t += 10;
    });
    expect(patches).toStrictEqual([
      { op: 'replace', path: ['set', 2, 'tags', 1, 't'], value: 11 },
      { op: 'replace', path: ['set', 2, 'tags', 0, 't'], value: 10 },
      { op: 'replace', path: ['set', 0, 'child', 'v'], value: 1 },
      { op: 'replace', path: ['set', 2, 'child', 'v'], value: 1 },
      { op: 'replace', path: ['set', 4, 'child', 'v'], value: 1 },
      { op: 'replace', path: ['set', 5, 'child', 'v'], value: 1 },
      { op: 'replace', path: ['set', 4, 'id'], value: 'fifth' },
      { op: 'replace', path: ['set', 0, 'id'], value: 'first' },
    ]);
    expect(inversePatches).toStrictEqual([
      { op: 'replace', path: ['set', 2, 'tags', 1, 't'], value: 1 },
      { op: 'replace', path: ['set', 2, 'tags', 0, 't'], value: 0 },
      { op: 'replace', path: ['set', 0, 'child', 'v'], value: 0 },
      { op: 'replace', path: ['set', 2, 'child', 'v'], value: 0 },
      { op: 'replace', path: ['set', 4, 'child', 'v'], value: 0 },
      { op: 'replace', path: ['set', 5, 'child', 'v'], value: 0 },
      { op: 'replace', path: ['set', 4, 'id'], value: 4 },
      { op: 'replace', path: ['set', 0, 'id'], value: 0 },
    ]);
  });

  test('are not searched for in the Set for each changed item', () => {
    const size = 200;
    const base = {
      set: new Set(Array.from({ length: size }, (_, id) => ({ id, v: 0 }))),
    };
    // Every step of an iterator over a Set, of the library's among them.
    const next = vi.spyOn(Object.getPrototypeOf(new Set().values()), 'next');
    let steps = 0;
    let result: ReturnType<typeof replay> | undefined;
    try {
      result = create(
        base,
        (draft) => {
          for (const item of draft.set) item.v += 1;
        },
        { enablePatches: true }
      );
      steps = next.mock.calls.length;
    } finally {
      next.mockRestore();
    }
    // The recipe iterates the Set once, and finalization rebuilds it once.
    // Counting the items before each changed item to find its position would
    // take size * (size + 1) / 2 more steps, 20,100 here.
    expect(steps).toBeLessThan(4 * size);
    const [state, patches, inversePatches] = result!;
    expect(patches).toStrictEqual(
      Array.from({ length: size }, (_, index) => ({
        op: 'replace',
        path: ['set', size - 1 - index, 'v'],
        value: 1,
      }))
    );
    expect(apply(base, patches)).toStrictEqual(state);
    expect(apply(state, inversePatches)).toStrictEqual(base);
  });
});
