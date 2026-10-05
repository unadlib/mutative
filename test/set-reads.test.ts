/* eslint-disable @typescript-eslint/no-explicit-any */
import { create, current } from '../src';

// Calls of a spied Set method made on one of the given Sets.
const callsOn = (
  spy: { mock: { contexts: unknown[] } },
  ...sets: Set<unknown>[]
) =>
  spy.mock.contexts.filter((context) => sets.includes(context as any)).length;

test('has and size read a Set draft without indexing or copying it', () => {
  const item = { id: 1 };
  const base = { ids: new Set([1, 2, 3]), items: new Set([item]), item };
  const entries = vi.spyOn(Set.prototype, 'entries');
  const values = vi.spyOn(Set.prototype, 'values');
  try {
    const state = create(base, (draft) => {
      expect(draft.ids.has(2)).toBe(true);
      expect(draft.ids.has(4)).toBe(false);
      expect(draft.ids.size).toBe(3);
      // A draft of an item, read through another path, stands for the item.
      expect(draft.items.has(draft.item)).toBe(true);
      expect(draft.items.has({ id: 1 })).toBe(false);
      expect(draft.items.size).toBe(1);
    });
    expect(state).toBe(base);
    expect(callsOn(entries, base.ids, base.items)).toBe(0);
    expect(callsOn(values, base.ids, base.items)).toBe(0);
  } finally {
    entries.mockRestore();
    values.mockRestore();
  }
});

test('has and size follow changes and iteration of a Set draft', () => {
  const item = { id: 1 };
  const base = { items: new Set<any>([item, 2]), item };
  const state = create(base, (draft) => {
    draft.items.add(3);
    expect(draft.items.has(3)).toBe(true);
    expect(draft.items.size).toBe(3);
    draft.items.delete(2);
    expect(draft.items.has(2)).toBe(false);
    expect(draft.items.size).toBe(2);
    const [first] = draft.items;
    first.id = 2;
    expect(draft.items.has(first)).toBe(true);
    expect(draft.items.has(item)).toBe(true);
    expect(draft.items.has(draft.item)).toBe(true);
  });
  expect([...state.items]).toEqual([{ id: 2 }, 3]);
  expect(base.item).toEqual({ id: 1 });
});

test('a Set draft changed only in its own properties keeps its items', () => {
  const set: Set<number> & { label?: string } = new Set([1, 2]);
  set.label = 'a';
  const state = create({ set }, (draft) => {
    delete (draft.set as any).label;
  });
  expect(state.set).not.toBe(set);
  expect([...state.set]).toEqual([1, 2]);
  expect((state.set as any).label).toBeUndefined();

  create({ set }, (draft) => {
    delete (draft.set as any).label;
    const snapshot = current(draft.set);
    expect(snapshot).not.toBe(set);
    expect([...snapshot]).toEqual([1, 2]);
  });
});
