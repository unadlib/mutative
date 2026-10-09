import { create } from '../src';

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
