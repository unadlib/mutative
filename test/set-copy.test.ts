/* eslint-disable @typescript-eslint/no-explicit-any */
import { apply, create } from '../src';

// Calls of a spied Set method made on the given Set.
const callsOn = (spy: { mock: { contexts: unknown[] } }, set: Set<unknown>) =>
  spy.mock.contexts.filter((context) => context === set).length;

describe('Set drafts change their copy', () => {
  test('adding and deleting items neither indexes nor rebuilds the Set', () => {
    const base = { ids: new Set([1, 2, 3]) };
    // A rebuild clears the copy first; the item mapping was built from entries.
    const clear = vi.spyOn(Set.prototype, 'clear');
    const entries = vi.spyOn(Set.prototype, 'entries');
    try {
      const state = create(base, (draft) => {
        draft.ids.add(4);
        draft.ids.delete(1);
        expect(draft.ids.has(4)).toBe(true);
        expect(draft.ids.has(1)).toBe(false);
        expect([...draft.ids]).toEqual([2, 3, 4]);
      });
      expect([...state.ids]).toEqual([2, 3, 4]);
      expect(callsOn(clear, state.ids)).toBe(0);
      expect(entries).not.toHaveBeenCalled();
    } finally {
      clear.mockRestore();
      entries.mockRestore();
    }
    expect([...base.ids]).toEqual([1, 2, 3]);
  });

  test('items read through an iterator rebuild the Set only once one changed', () => {
    const first = { id: 1, value: 0 };
    const second = { id: 2, value: 0 };
    const base = { items: new Set<any>([first, second]) };
    const clear = vi.spyOn(Set.prototype, 'clear');
    try {
      const state = create(base, (draft) => {
        for (const item of draft.items) expect(item.value).toBe(0);
        draft.items.add(3);
      });
      expect([...state.items]).toEqual([first, second, 3]);
      expect([...state.items][0]).toBe(first);
      expect(callsOn(clear, state.items)).toBe(0);

      const changed = create(base, (draft) => {
        for (const item of draft.items) if (item.id === 1) item.value = 1;
        draft.items.add(3);
      });
      expect([...changed.items]).toEqual([{ id: 1, value: 1 }, second, 3]);
      expect([...changed.items][1]).toBe(second);
      expect(callsOn(clear, changed.items)).toBe(1);
    } finally {
      clear.mockRestore();
    }
    expect(first.value).toBe(0);
  });

  test('a changed item keeps its position among added and deleted items', () => {
    const items = [{ id: 1 }, { id: 2 }, { id: 3 }].map((item) => ({
      ...item,
      value: 0,
    }));
    const base = { items: new Set<any>(items) };
    const [state, patches, inversePatches] = create(
      base,
      (draft) => {
        draft.items.add('a');
        const second = [...draft.items].find(
          (item) => typeof item === 'object' && item.id === 2
        );
        second.value = 1;
        // Moved to the end, as a native Set does.
        draft.items.delete(second);
        draft.items.add(second);
        draft.items.delete(items[0]);
        draft.items.add('b');
      },
      { enablePatches: true }
    );
    expect([...state.items]).toEqual([items[2], 'a', { id: 2, value: 1 }, 'b']);
    expect(apply(base, patches)).toEqual(state);
    expect(apply(state, inversePatches)).toEqual(base);
  });

  test('a draft of a Set subclass uses the methods that the subclass overrides', () => {
    class LowerCaseSet extends Set<string> {
      add(value: string) {
        return super.add(value.toLowerCase());
      }
      has(value: string) {
        return super.has(value.toLowerCase());
      }
    }
    const base = { tags: new LowerCaseSet(['a']) };
    const state = create(base, (draft) => {
      draft.tags.add('B');
      expect(draft.tags.has('b')).toBe(true);
      draft.tags.add('A');
      expect([...draft.tags]).toEqual(['a', 'b']);
    });
    expect(state.tags).toBeInstanceOf(LowerCaseSet);
    expect([...state.tags]).toEqual(['a', 'b']);
  });
});

test('a Set holds the final value of a draft that an outer producer finalizes later', () => {
  const outerBase = { item: { value: 1 } };
  const innerBase = { set: new Set<any>([{ value: 0 }]) };
  let inner: typeof innerBase | undefined;
  const outer = create(outerBase, (draft) => {
    inner = create(innerBase, (innerDraft) => {
      for (const item of innerDraft.set) item.value = 1;
      innerDraft.set.add(draft.item);
    });
    draft.item.value = 2;
  });
  expect([...inner!.set]).toEqual([{ value: 1 }, { value: 2 }]);
  expect([...inner!.set][1]).toBe(outer.item);
});

test('patches of a Set item keep its position after another draft rebuilt the Set', () => {
  const base = { list: [new Set<any>([{ value: 1 }, 'x']), new Set<any>([2])] };
  const [state, patches, inversePatches] = create(
    base,
    (draft) => {
      const [item] = draft.list[0];
      item.value = 2;
      expect(draft.list[1].size).toBe(1);
      draft.list[1] = draft.list[0];
    },
    { enablePatches: true }
  );
  expect([...state.list[0]]).toEqual([{ value: 2 }, 'x']);
  expect(state.list[1]).toBe(state.list[0]);
  expect(patches).toContainEqual({
    op: 'replace',
    path: ['list', 0, 0, 'value'],
    value: 2,
  });
  expect(apply(base, patches)).toEqual(state);
  expect(apply(state, inversePatches)).toEqual(base);
});

describe('a Set draft and drafts of a nested producer', () => {
  test('keeps the changes made after a nested producer finalized a draft that the Set holds', () => {
    const first = { value: 0 };
    const base = { set: new Set<any>([first, 7]) };
    const innerBase = { item: { value: 1 } };
    const state = create(base, (draft) => {
      for (const item of draft.set)
        if (typeof item === 'object') item.value = 1;
      create(innerBase, (innerDraft) => {
        innerDraft.item.value = 2;
        draft.set.add(innerDraft.item);
      });
      expect(draft.set.has(first)).toBe(true);
      draft.set.delete(7);
      draft.set.add(5);
    });
    expect([...state.set]).toEqual([{ value: 1 }, { value: 2 }, 5]);
  });

  test('keeps the changes made after a nested producer held the Set draft', () => {
    const base = { set: new Set<any>([{ value: 0 }]) };
    const innerBase = { holder: { set: new Set<any>([1]) } };
    const state = create(base, (draft) => {
      for (const item of draft.set) item.value = 1;
      create(innerBase, (innerDraft) => {
        innerDraft.holder.set.add(2);
        innerDraft.holder.set = draft.set;
      });
      draft.set.add(5);
    });
    expect([...state.set]).toEqual([{ value: 1 }, 5]);
  });
});

test('drafts added to a Set rebuild it once', () => {
  const base = {
    ids: new Set<any>([1, 2]),
    list: [{ value: 0 }, { value: 1 }, { value: 2 }],
  };
  // Drafts are finalized in reverse order of creation, so the Set draft is
  // finalized after the drafts it holds in the first recipe and before them
  // in the second.
  const recipes = [
    (draft: typeof base) => {
      const { ids } = draft;
      for (const item of draft.list) {
        item.value += 1;
        ids.add(item);
      }
    },
    (draft: typeof base) => {
      for (const item of draft.list) item.value += 1;
      for (const item of draft.list) draft.ids.add(item);
    },
  ];
  const clear = vi.spyOn(Set.prototype, 'clear');
  try {
    for (const recipe of recipes) {
      const state = create(base, recipe);
      expect([...state.ids]).toEqual([1, 2, ...state.list]);
      expect([...state.ids][2]).toBe(state.list[0]);
      expect(state.list).toEqual([{ value: 1 }, { value: 2 }, { value: 3 }]);
      expect(callsOn(clear, state.ids)).toBe(1);
    }
  } finally {
    clear.mockRestore();
  }
});

test('a Set draft finds an item that is a draft of a finished nested producer', () => {
  const state = create(new Set<any>(), (draft) => {
    let item: any;
    create({ item: { value: 1 } }, (innerDraft) => {
      item = innerDraft.item;
      innerDraft.item.value = 2;
      draft.add(item);
    });
    expect(draft.has(item)).toBe(true);
    draft.add(item);
    expect(draft.size).toBe(1);
  });
  expect([...state]).toEqual([{ value: 2 }]);
});
