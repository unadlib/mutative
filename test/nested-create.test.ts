/* eslint-disable @typescript-eslint/no-explicit-any */
import { apply, create } from '../src';

describe('auto-freeze of create() calls inside a recipe', () => {
  test('a create() call inside a recipe does not freeze its result', () => {
    let inner: any;
    const state = create(
      { value: 1 },
      (draft) => {
        inner = create(
          { child: { value: 1 } },
          (innerDraft) => {
            innerDraft.child.value = 2;
          },
          { enableAutoFreeze: true }
        );
        draft.value = 2;
      },
      { enableAutoFreeze: true }
    );
    expect(Object.isFrozen(inner)).toBe(false);
    expect(Object.isFrozen(inner.child)).toBe(false);
    expect(Object.isFrozen(state)).toBe(true);
  });

  test('the outer producer finalizes and freezes its drafts held by such a result', () => {
    // Freezing the result would hide the outer draft from the outer producer,
    // which does not search frozen objects, and leave it revoked in the state.
    const state = create(
      { child: { value: 1 } } as any,
      (draft) => {
        const result = create({ child: draft.child }, () => {}, {
          enableAutoFreeze: true,
        });
        draft.child.value = 2;
        draft.copy = result;
      },
      { enableAutoFreeze: true }
    );
    expect(state).toEqual({
      child: { value: 2 },
      copy: { child: { value: 2 } },
    });
    expect(state.copy.child).toBe(state.child);
    expect(Object.isFrozen(state.copy)).toBe(true);
    expect(Object.isFrozen(state.copy.child)).toBe(true);
  });

  test('manual drafts and apply() inside a recipe are not frozen either', () => {
    let manual: any;
    let applied: any;
    create(
      {},
      () => {
        const [draft, finalize] = create(
          { child: { value: 1 } },
          { enableAutoFreeze: true }
        );
        draft.child.value = 2;
        manual = finalize();
        applied = apply<{ child: { value: number } }, true>(
          { child: { value: 1 } },
          [{ op: 'replace', path: ['child', 'value'], value: 2 }],
          { enableAutoFreeze: true }
        );
      },
      { enableAutoFreeze: true }
    );
    expect(manual).toEqual({ child: { value: 2 } });
    expect(Object.isFrozen(manual)).toBe(false);
    expect(applied).toEqual({ child: { value: 2 } });
    expect(Object.isFrozen(applied)).toBe(false);
  });

  test('create() freezes again once the recipe returns or throws', () => {
    create({}, () => {
      create({}, () => {});
    });
    expect(() =>
      create({}, () => {
        throw new Error('recipe');
      })
    ).toThrow('recipe');
    expect(() =>
      create({}, () => {
        create({}, () => {
          throw new Error('inner recipe');
        });
      })
    ).toThrow('inner recipe');
    const state = create(
      { child: { value: 1 } },
      (draft) => {
        draft.child.value = 2;
      },
      { enableAutoFreeze: true }
    );
    expect(Object.isFrozen(state)).toBe(true);
    expect(Object.isFrozen(state.child)).toBe(true);
  });

  test('a result that holds a draft of an unfinished manual create() call is not frozen', () => {
    const [manual, finalize] = create({ child: { value: 1 } });
    const state = create(
      {} as any,
      (draft) => {
        draft.child = manual.child;
      },
      { enableAutoFreeze: true }
    );
    expect(Object.isFrozen(state)).toBe(false);
    manual.child.value = 2;
    const result = finalize();
    expect(state.child).toBe(result.child);
    expect(state.child).toEqual({ value: 2 });
  });

  test('only the synchronous part of an async recipe counts', async () => {
    let before: any;
    let after: any;
    await create({}, async () => {
      before = create({ value: 1 }, () => {}, { enableAutoFreeze: true });
      await Promise.resolve();
      after = create({ value: 1 }, () => {}, { enableAutoFreeze: true });
    });
    expect(Object.isFrozen(before)).toBe(false);
    expect(Object.isFrozen(after)).toBe(true);
  });
});

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
