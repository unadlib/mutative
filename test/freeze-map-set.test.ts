/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from '../src';

describe('auto-freeze of Map and Set instances', () => {
  test('Maps and Sets are frozen along with their guarded mutators', () => {
    const state = create(
      { map: new Map([['a', 1]]), set: new Set([1]) },
      (draft) => {
        draft.map.set('b', 2);
        draft.set.add(2);
      },
      { enableAutoFreeze: true }
    );
    const map: any = state.map;
    const set: any = state.set;
    expect(Object.isFrozen(map)).toBe(true);
    expect(Object.isFrozen(set)).toBe(true);
    expect(() => {
      map.set = Map.prototype.set;
    }).toThrow(TypeError);
    expect(() => map.set('c', 3)).toThrow('Cannot modify frozen object');
    expect(() => {
      set.extra = 1;
    }).toThrow(TypeError);
    expect(() => set.add(3)).toThrow('Cannot modify frozen object');
    expect([...map]).toStrictEqual([
      ['a', 1],
      ['b', 2],
    ]);
    expect([...set]).toStrictEqual([1, 2]);
  });

  test('a frozen Map is not walked again by later producers', () => {
    let walks = 0;
    class WalkedMap<K, V> extends Map<K, V> {
      [Symbol.iterator]() {
        walks += 1;
        return super[Symbol.iterator]();
      }
    }
    const base = { map: new WalkedMap([[1, { a: 1 }]]), count: 0 };
    let state = create(
      base,
      (draft) => {
        draft.count += 1;
      },
      { enableAutoFreeze: true }
    );
    expect(walks).toBe(1);
    expect(Object.isFrozen(state.map.get(1))).toBe(true);
    state = create(
      state,
      (draft) => {
        draft.count += 1;
      },
      { enableAutoFreeze: true }
    );
    expect(walks).toBe(1);
    expect(state.count).toBe(2);
    expect(state.map).toBe(base.map);
  });

  test('a changed Map or Set from a frozen state can be drafted again', () => {
    const options = { enableAutoFreeze: true };
    const first = create(
      { map: new Map([['a', { v: 1 }]]), set: new Set([1]) },
      (draft) => {
        draft.map.get('a')!.v = 2;
        draft.set.add(2);
      },
      options
    );
    const second = create(
      first,
      (draft) => {
        draft.map.get('a')!.v = 3;
        draft.map.delete('a');
        draft.map.set('b', { v: 4 });
        draft.set.delete(1);
      },
      options
    );
    expect([...second.map]).toStrictEqual([['b', { v: 4 }]]);
    expect([...second.set]).toStrictEqual([2]);
    expect([...first.map]).toStrictEqual([['a', { v: 2 }]]);
    expect([...first.set]).toStrictEqual([1, 2]);
    expect(Object.isFrozen(second.map)).toBe(true);
    expect(Object.isFrozen(second.set)).toBe(true);
  });
});
