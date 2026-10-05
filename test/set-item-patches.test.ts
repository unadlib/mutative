/* eslint-disable @typescript-eslint/no-explicit-any */
import { apply, create } from '../src';

const replay = (base: any, recipe: (draft: any) => void) => {
  const [state, patches, inversePatches] = create(base, recipe, {
    enablePatches: true,
  });
  expect(apply(base, patches)).toStrictEqual(state);
  expect(apply(state, inversePatches)).toStrictEqual(base);
  return [state, patches, inversePatches] as const;
};

describe('items of a Set draft with patches enabled', () => {
  test('every item keeps the changes below its first level', () => {
    const base = {
      set: new Set([
        { id: 'a', x: { v: 0 } },
        { id: 'b', x: { v: 0 } },
        { id: 'c', x: { v: 0 } },
      ]),
    };
    const [state, patches] = replay(base, (draft) => {
      for (const item of draft.set) item.x.v += 1;
    });
    expect([...state.set].map((item) => item.x.v)).toStrictEqual([1, 1, 1]);
    expect(patches).toStrictEqual([
      { op: 'replace', path: ['set', 2, 'x', 'v'], value: 1 },
      { op: 'replace', path: ['set', 1, 'x', 'v'], value: 1 },
      { op: 'replace', path: ['set', 0, 'x', 'v'], value: 1 },
    ]);
  });

  test('Sets and arrays inside a Set keep their changes', () => {
    const base = {
      sets: new Set([new Set([{ v: 0 }]), new Set([{ v: 0 }])]),
      lists: new Set([[{ v: 0 }], [{ v: 0 }]]),
    };
    const [state] = replay(base, (draft) => {
      for (const inner of draft.sets) for (const item of inner) item.v += 1;
      for (const list of draft.lists) list[0].v += 1;
    });
    expect([...state.sets].map((inner) => [...inner][0].v)).toStrictEqual([
      1, 1,
    ]);
    expect([...state.lists].map((list) => list[0].v)).toStrictEqual([1, 1]);
    expect([...base.sets].map((inner) => [...inner][0].v)).toStrictEqual([
      0, 0,
    ]);
  });
});
