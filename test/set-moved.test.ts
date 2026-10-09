/* eslint-disable @typescript-eslint/no-explicit-any */
import { apply, create } from '../src';

describe('a Set draft that left its key keeps its changes', () => {
  const makeBase = () => ({
    a: { set: new Set<any>([{ value: 1 }, 2]) },
    list: [] as any[],
    map: new Map<string, any>(),
    other: new Set<any>([0]),
  });
  const change = (set: Set<any>) => {
    for (const item of set) if (typeof item === 'object') item.value = 2;
    set.add(3);
    set.delete(2);
  };
  const expected = [{ value: 2 }, 3];

  test.each([
    [
      'another key',
      (draft: any) => {
        draft.b = draft.a.set;
      },
      (state: any) => state.b,
    ],
    [
      'an array',
      (draft: any) => {
        draft.list.push(draft.a.set);
      },
      (state: any) => state.list[0],
    ],
    [
      'a Map',
      (draft: any) => {
        draft.map.set('set', draft.a.set);
      },
      (state: any) => state.map.get('set'),
    ],
    [
      'another Set',
      (draft: any) => {
        draft.other.add(draft.a.set);
      },
      (state: any) => [...state.other][1],
    ],
    [
      'a new object',
      (draft: any) => {
        draft.b = { set: draft.a.set };
      },
      (state: any) => state.b.set,
    ],
    [
      'a new Set',
      (draft: any) => {
        draft.b = new Set([draft.a.set]);
      },
      (state: any) => [...state.b][0],
    ],
  ])('moved to %s', (_, move, read) => {
    for (const enablePatches of [false, true]) {
      const base = makeBase();
      const result: any = create(
        base,
        (draft) => {
          change(draft.a.set);
          move(draft);
          draft.a.set = new Set();
        },
        { enablePatches }
      );
      const state = enablePatches ? result[0] : result;
      expect([...read(state)]).toEqual(expected);
      expect([...state.a.set]).toEqual([]);
      expect([...base.a.set]).toEqual([{ value: 1 }, 2]);
      if (enablePatches) {
        expect(apply(base, result[1])).toEqual(state);
      }
    }
  });

  test('removed from its parent Set and added to another', () => {
    const base = {
      outer: new Set<any>([new Set<any>([{ value: 1 }])]),
      target: new Set<any>(),
    };
    const state = create(base, (draft) => {
      const [inner] = draft.outer;
      for (const item of inner) item.value = 2;
      inner.add(3);
      draft.outer.clear();
      draft.target.add(inner);
    });
    expect([...state.outer]).toEqual([]);
    expect([...[...state.target][0]]).toEqual([{ value: 2 }, 3]);
  });
});
