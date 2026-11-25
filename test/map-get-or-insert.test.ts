/* eslint-disable @typescript-eslint/no-explicit-any */
import { apply, create } from '../src';

const hasGetOrInsert = 'getOrInsert' in Map.prototype;

describe.runIf(hasGetOrInsert)('Map.prototype.getOrInsert on drafts', () => {
  test('getOrInsert returns the existing value and keeps the state', () => {
    const base = new Map([['a', 1]]);
    const state = create(base, (draft: any) => {
      expect(draft.getOrInsert('a', 2)).toBe(1);
    });
    expect(state).toBe(base);
  });

  test('getOrInsert inserts a missing key', () => {
    const base = new Map([['a', 1]]);
    const [state, patches, inversePatches] = create(
      base,
      (draft: any) => {
        expect(draft.getOrInsert('b', 2)).toBe(2);
      },
      { enablePatches: true }
    );
    expect(state).toStrictEqual(
      new Map([
        ['a', 1],
        ['b', 2],
      ])
    );
    expect(base).toStrictEqual(new Map([['a', 1]]));
    expect(apply(base, patches)).toStrictEqual(state);
    expect(apply(state, inversePatches)).toStrictEqual(base);
  });

  test('getOrInsert returns a draft of an existing object', () => {
    const base = new Map([['a', { count: 1 }]]);
    const state = create(base, (draft: any) => {
      draft.getOrInsert('a', { count: 0 }).count += 1;
    });
    expect(state.get('a')).toStrictEqual({ count: 2 });
    expect(base.get('a')).toStrictEqual({ count: 1 });
  });

  test('getOrInsertComputed calls the callback only for a missing key', () => {
    const base = new Map([['a', 1]]);
    const callback = vi.fn((key: string) => key.length);
    const state = create(base, (draft: any) => {
      expect(draft.getOrInsertComputed('a', callback)).toBe(1);
      expect(draft.getOrInsertComputed('bb', callback)).toBe(2);
    });
    expect(callback).toHaveBeenCalledOnce();
    expect(callback).toHaveBeenCalledWith('bb');
    expect(state).toStrictEqual(
      new Map([
        ['a', 1],
        ['bb', 2],
      ])
    );
  });

  test('getOrInsertComputed works on a nested Map', () => {
    const base = { groups: new Map<string, Array<number>>() };
    const state = create(base, (draft: any) => {
      draft.groups.getOrInsertComputed('odd', () => []).push(1);
      draft.groups.getOrInsertComputed('odd', () => []).push(3);
    });
    expect(state.groups.get('odd')).toStrictEqual([1, 3]);
    expect(base.groups.size).toBe(0);
  });
});
