/* eslint-disable @typescript-eslint/no-explicit-any */
import { apply, create, current, isDraft } from '../src';

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

  test('a Set keeps the drafts of an outer create() call that it holds', () => {
    const item = { value: 1 };
    const base = { set: new Set([item]) };
    const state = create(base, (draft) => {
      const result = create({ set: draft.set }, (innerDraft) => {
        innerDraft.set.add({ value: 2 });
      });
      const [first] = result.set;
      expect(isDraft(first)).toBe(true);
      first.value = 3;
      draft.set = result.set;
    });
    expect(item).toEqual({ value: 1 });
    expect([...state.set]).toEqual([{ value: 3 }, { value: 2 }]);
  });

  test('a value assigned in the recipe keeps the drafts of an outer create() call', () => {
    const base = { node: { child: { value: 0 } }, other: { value: 0 } };
    const state = create(base as any, (draft) => {
      const result: any = create({ node: draft.node }, (innerDraft: any) => {
        innerDraft.node.child.value = 1;
        innerDraft.list = [draft.other];
      });
      expect(isDraft(result.list[0])).toBe(true);
      result.list[0].value = 1;
      draft.list = result.list;
    });
    expect(base.other).toEqual({ value: 0 });
    expect(state.list[0]).toBe(state.other);
    expect(state.other).toEqual({ value: 1 });
  });

  test('current() returns the current state of the drafts of an outer create() call', () => {
    let changed: any;
    let unchanged: any;
    create({ node: { a: { value: 1 }, b: { value: 1 } } }, (draft) => {
      draft.node.b.value = 2;
      create({ node: draft.node }, (innerDraft) => {
        innerDraft.node.a.value = 2;
        changed = current(innerDraft);
        unchanged = current(innerDraft.node.b);
      });
    });
    // Both producers have ended, so a draft left in a snapshot would throw.
    expect(changed).toEqual({ node: { a: { value: 2 }, b: { value: 2 } } });
    expect(unchanged).toEqual({ value: 2 });
  });

  test('patch values hold no drafts of an outer create() call', () => {
    const base = {
      node: { child: { value: 1 }, other: { value: 1 } },
      set: new Set([{ id: 1 }, { id: 2 }]),
    };
    let patches: any;
    let inversePatches: any;
    create(base, (draft) => {
      draft.node.other.value = 2;
      [, patches, inversePatches] = create(
        { node: draft.node, set: draft.set } as any,
        (innerDraft) => {
          delete innerDraft.node.child;
          innerDraft.node.moved = innerDraft.node.other;
          for (const item of innerDraft.set) {
            if (item.id === 1) innerDraft.set.delete(item);
          }
          innerDraft.set.add({ id: 3 });
        },
        { enablePatches: true }
      );
    });
    // Both producers have ended, so a draft left in a patch would throw.
    expect(patches).toEqual([
      { op: 'remove', path: ['set', 0], value: { id: 1 } },
      { op: 'add', path: ['set', 1], value: { id: 3 } },
      { op: 'remove', path: ['node', 'child'] },
      { op: 'add', path: ['node', 'moved'], value: { value: 2 } },
    ]);
    expect(inversePatches).toEqual([
      { op: 'remove', path: ['set', 1], value: { id: 3 } },
      { op: 'add', path: ['set', 0], value: { id: 1 } },
      { op: 'add', path: ['node', 'child'], value: { value: 1 } },
      { op: 'remove', path: ['node', 'moved'] },
    ]);
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

  test('changes through the items of such a Set draft stay in its result', () => {
    const base = { set: new Set([{ value: 1 }]) };
    const state = create(base, (draft) => {
      const result = create({ set: draft.set }, (innerDraft) => {
        for (const item of innerDraft.set) item.value += 1;
      });
      expect([...result.set]).toEqual([{ value: 2 }]);
      expect([...draft.set]).toEqual([{ value: 1 }]);
    });
    expect(state).toBe(base);
  });

  test('an array draft that moves drafts of an outer create() call leaves them to that call', () => {
    const base = { list: [{ value: 0 }, { value: 1 }, { value: 2 }] };
    const state = create(base, (draft) => {
      const result = create({ list: draft.list }, (innerDraft) => {
        innerDraft.list.reverse();
        innerDraft.list[0].value = 3;
      });
      expect(isDraft(result.list[2])).toBe(true);
      result.list[2].value = 4;
      draft.list = result.list;
    });
    expect(base.list).toEqual([{ value: 0 }, { value: 1 }, { value: 2 }]);
    expect(state.list).toEqual([{ value: 3 }, { value: 1 }, { value: 4 }]);
  });
});
