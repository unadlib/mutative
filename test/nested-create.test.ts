import { apply, create } from '../src';

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
    expect(innerState).toEqual({ obj: { a: state.items[0] } });
    expect(innerPatches).toEqual([
      { op: 'replace', path: ['obj', 'a'], value: state.items[0] },
    ]);
    expect(apply(innerBase, innerPatches)).toEqual(innerState);
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
});
