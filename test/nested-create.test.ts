import { apply, create, type Patches } from '../src';

describe('drafts whose original is a draft of an outer create() call', () => {
  test('a Set draft is copied through the outer draft', () => {
    const base = { set: new Set([1, 2]) };
    const state = create(base, (draft) => {
      const result = create({ set: draft.set }, (innerDraft) => {
        innerDraft.set.add(3);
        innerDraft.set.delete(1);
      });
      expect([...result.set]).toEqual([2, 3]);
      expect([...draft.set]).toEqual([1, 2]);
    });
    expect(state).toBe(base);
  });

  test('a draft of a Set subclass is copied through the outer draft', () => {
    class TagSet extends Set<string> {}
    const base = { tags: new TagSet(['a', 'b']) };
    const state = create(base, (draft) => {
      const result = create({ tags: draft.tags }, (innerDraft) => {
        innerDraft.tags.add('c');
        innerDraft.tags.delete('a');
      });
      expect(result.tags).toBeInstanceOf(TagSet);
      expect([...result.tags]).toEqual(['b', 'c']);
      expect([...draft.tags]).toEqual(['a', 'b']);
    });
    expect(state).toBe(base);
  });

  test('a Map draft is copied through the outer draft', () => {
    const base = { map: new Map([['a', 1]]) };
    const state = create(base, (draft) => {
      const result = create({ map: draft.map }, (innerDraft) => {
        innerDraft.map.set('b', 2);
        innerDraft.map.delete('a');
      });
      expect([...result.map]).toEqual([['b', 2]]);
      expect([...draft.map]).toEqual([['a', 1]]);
    });
    expect(state).toBe(base);
  });
});

// The inner call finalizes the value it drafted at the key it read, where it
// finds the outer draft instead; that draft is left to the outer call.
describe('a draft of an outer create() call placed where an inner one read', () => {
  const makeBase = () => ({ item: { value: 0, nested: { value: 0 } } });
  const placements: [string, (innerDraft: any, item: any) => void][] = [
    [
      'at a key',
      (innerDraft, item) => {
        expect(innerDraft.slot).toEqual({});
        innerDraft.slot = item;
      },
    ],
    [
      'at a key and at a new key',
      (innerDraft, item) => {
        expect(innerDraft.slot).toEqual({});
        innerDraft.slot = item;
        innerDraft.extra = item;
      },
    ],
    [
      'at an index and at a new key',
      (innerDraft, item) => {
        expect(innerDraft.list[0]).toEqual({});
        innerDraft.list[0] = item;
        innerDraft.extra = item;
      },
    ],
  ];

  test.each(placements)('%s', (_, place) => {
    const base = makeBase();
    let innerPatches: Patches = [];
    const [state, patches, inversePatches] = create(
      base,
      (draft) => {
        draft.item.value = 1;
        [, innerPatches] = create(
          { slot: {}, list: [{}] },
          (innerDraft) => place(innerDraft, draft.item),
          { enablePatches: true }
        );
        // The outer recipe still changes the draft after the inner call.
        draft.item.nested.value = 2;
      },
      { enablePatches: true }
    );
    expect(base).toStrictEqual(makeBase());
    expect(state).toStrictEqual({ item: { value: 1, nested: { value: 2 } } });
    expect(apply(makeBase(), patches)).toStrictEqual(state);
    expect(apply(state, inversePatches)).toStrictEqual(makeBase());
    // The inner patches address the inner state only.
    expect(innerPatches.some((patch) => patch.path[0] === 'item')).toBe(false);
    expect(() => apply({ slot: {}, list: [{}] }, innerPatches)).not.toThrow();
  });

  // An inner call that finalized the outer draft would mark it done whether
  // or not either call makes patches, and the outer recipe would then change
  // the base through it.
  const patchOptions: [boolean, boolean][] = [
    [false, false],
    [true, false],
    [false, true],
  ];
  test.each(
    placements.flatMap(([name, place]) =>
      patchOptions.map(
        ([outer, inner]): [string, boolean, boolean, typeof place] => [
          name,
          outer,
          inner,
          place,
        ]
      )
    )
  )(
    '%s, with outer patches %s and inner patches %s',
    (_, outer, inner, place) => {
      const base = makeBase();
      const recipe = (draft: ReturnType<typeof makeBase>) => {
        draft.item.value = 1;
        create(
          { slot: {}, list: [{}] },
          (innerDraft) => place(innerDraft, draft.item),
          { enablePatches: inner }
        );
        draft.item.nested.value = 2;
      };
      const state = outer
        ? create(base, recipe, { enablePatches: true })[0]
        : create(base, recipe);
      expect(base).toStrictEqual(makeBase());
      expect(state).toStrictEqual({ item: { value: 1, nested: { value: 2 } } });
    }
  );
});
