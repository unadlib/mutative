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

describe('drafts that the recipe of another create() call holds', () => {
  test('the patches of an outer draft at the key of a nested draft stay with the outer producer', () => {
    const base = { items: [{ n: 0, sub: { x: 1 } }] };
    const innerBase = { obj: { a: { x: 1 } as object } };
    let inner: any;
    const [state, patches, inversePatches] = create(
      base,
      (draft) => {
        const item = draft.items[0];
        item.n = 1;
        inner = create(
          innerBase,
          (innerDraft) => {
            // Reading `a` drafts it before the outer draft takes its key.
            expect(innerDraft.obj.a).toEqual({ x: 1 });
            innerDraft.obj.a = item;
          },
          { enablePatches: true }
        );
        // The outer draft still drafts what the recipe reads through it.
        item.sub.x = 2;
      },
      { enablePatches: true }
    );
    expect(base).toEqual({ items: [{ n: 0, sub: { x: 1 } }] });
    expect(state).toEqual({ items: [{ n: 1, sub: { x: 2 } }] });
    expect(apply(base, patches)).toEqual(state);
    expect(apply(state, inversePatches)).toEqual(base);
    const [innerState, innerPatches, innerInversePatches] = inner;
    expect(innerState.obj.a).toBe(state.items[0]);
    // The nested patches carry the value that the outer draft had when the
    // nested producer finished.
    expect(innerPatches).toEqual([
      { op: 'replace', path: ['obj', 'a'], value: { n: 1, sub: { x: 1 } } },
    ]);
    expect(apply(innerState, innerInversePatches)).toEqual(innerBase);
  });

  test('the patches of an outer draft that an array method moved to the index of a nested draft stay with the outer producer', () => {
    const base = { items: [{ n: 0 }] };
    const innerBase = { list: [{ x: 1 }] as object[] };
    let inner: any;
    const [state, patches, inversePatches] = create(
      base,
      (draft) => {
        const item = draft.items[0];
        item.n = 1;
        inner = create(
          innerBase,
          (innerDraft) => {
            expect(innerDraft.list[0]).toEqual({ x: 1 });
            innerDraft.list.unshift(item);
          },
          { enablePatches: true }
        );
      },
      { enablePatches: true }
    );
    expect(patches).toEqual([
      { op: 'replace', path: ['items', 0, 'n'], value: 1 },
    ]);
    expect(apply(state, inversePatches)).toEqual(base);
    const [innerState, innerPatches, innerInversePatches] = inner;
    expect(innerState).toEqual({ list: [{ n: 1 }, { x: 1 }] });
    expect(apply(innerBase, innerPatches)).toEqual(innerState);
    expect(apply(innerState, innerInversePatches)).toEqual(innerBase);
  });

  // A recipe can place a draft of another producer as a property, an array
  // element, a Map value or a Set item.
  const holders = [
    [
      'an object',
      () => ({ value: null as any }),
      (holder: any, item: object) => {
        holder.value = item;
      },
      (state: any) => state.value,
    ],
    [
      'an array',
      () => ({ value: [] as any[] }),
      (holder: any, item: object) => {
        holder.value.push(item);
      },
      (state: any) => state.value[0],
    ],
    [
      'a Map',
      () => ({ value: new Map<string, any>() }),
      (holder: any, item: object) => {
        holder.value.set('key', item);
      },
      (state: any) => state.value.get('key'),
    ],
    [
      'a Set',
      () => ({ value: new Set<any>() }),
      (holder: any, item: object) => {
        holder.value.add(item);
      },
      (state: any) => [...state.value][0],
    ],
  ] as const;

  test.each(holders)(
    '%s of a nested producer holds the original of an outer draft whose recipe changes nothing',
    (_name, makeHolder, place, read) => {
      const base = { item: { v: 1 } };
      let inner: any;
      const state = create(base, (draft) => {
        inner = create(makeHolder(), (innerDraft) => {
          place(innerDraft, draft.item);
        });
      });
      expect(state).toBe(base);
      expect(read(inner)).toBe(base.item);
    }
  );

  test.each(holders)(
    '%s of an outer producer holds the original of a nested draft whose recipe changes nothing',
    (_name, makeHolder, place, read) => {
      const innerBase = { item: { v: 1 } };
      const base = makeHolder();
      const [state, patches, inversePatches] = create(
        base,
        (draft) => {
          create(innerBase, (innerDraft) => {
            place(draft, innerDraft.item);
          });
        },
        { enablePatches: true }
      );
      expect(read(state)).toBe(innerBase.item);
      expect(apply(base, patches)).toEqual(state);
      expect(apply(state, inversePatches)).toEqual(base);
    }
  );

  // The value at a key, the nested draft of which the recipe may read before
  // the outer draft takes the key.
  const slots = [
    [
      'an object',
      () => ({ value: { x: 0 } as object }),
      (holder: any) => holder.value,
      (holder: any, item: object) => {
        holder.value = item;
      },
    ],
    [
      'an array',
      () => ({ value: [{ x: 0 }] as object[] }),
      (holder: any) => holder.value[0],
      (holder: any, item: object) => {
        holder.value[0] = item;
      },
    ],
    [
      'a Map',
      () => ({ value: new Map<string, object>([['key', { x: 0 }]]) }),
      (holder: any) => holder.value.get('key'),
      (holder: any, item: object) => {
        holder.value.set('key', item);
      },
    ],
  ] as const;

  test.each(slots)(
    '%s of a nested producer gets the final value of an outer draft, whether or not the nested draft at its key was read',
    (_name, makeHolder, at, place) => {
      for (const readFirst of [false, true]) {
        const holderBase = makeHolder();
        let inner: any;
        const state = create({ item: { v: 1 } }, (draft) => {
          inner = create(
            holderBase,
            (innerDraft) => {
              if (readFirst) expect(at(innerDraft)).toEqual({ x: 0 });
              place(innerDraft, draft.item);
            },
            { enablePatches: true }
          );
          // The outer recipe changes the draft after the nested producer is
          // done.
          draft.item.v = 2;
        });
        const [innerState, innerPatches, innerInversePatches] = inner;
        expect(at(innerState)).toBe(state.item);
        expect(state.item).toEqual({ v: 2 });
        // The nested patches carry the value that the draft had when the
        // nested producer finished.
        expect(innerPatches[0].value).toEqual({ v: 1 });
        expect(apply(innerState, innerInversePatches)).toEqual(holderBase);
      }
    }
  );
});
