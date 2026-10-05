/* eslint-disable @typescript-eslint/no-explicit-any */
import { apply, create, original } from '../src';

const replay = (base: any, recipe: (draft: any) => void) => {
  const [state, patches, inversePatches] = create(base, recipe, {
    enablePatches: true,
  });
  expect(apply(base, patches)).toStrictEqual(state);
  expect(apply(state, inversePatches)).toStrictEqual(base);
  return [state, patches] as const;
};

test('assigning the original of an edited child back yields no patch', () => {
  const base = { a: { x: 1 } };
  const [state, patches] = replay(base, (draft) => {
    draft.a.x = 2;
    draft.a = original(draft.a);
  });
  expect(state.a).toBe(base.a);
  expect(patches).toStrictEqual([]);
});

test('assigning the original over a draft moved to another key is a change', () => {
  const shared = { s: 1 };
  const [state, patches] = replay({ a: shared, b: 1 }, (draft) => {
    const moved = draft.a;
    draft.a = 1;
    draft.b = moved;
    draft.b = shared;
  });
  expect(state).toStrictEqual({ a: 1, b: { s: 1 } });
  expect(patches).toStrictEqual([
    { op: 'replace', path: ['a'], value: 1 },
    { op: 'replace', path: ['b'], value: { s: 1 } },
  ]);
  const [list] = replay({ list: [shared, 1] }, (draft) => {
    const moved = draft.list[0];
    draft.list[0] = 1;
    draft.list[1] = moved;
    draft.list[1] = shared;
  });
  expect(list).toStrictEqual({ list: [1, { s: 1 }] });
});

test('assigning the original back without an edit keeps the base identity', () => {
  const base = { a: { x: 1 } };
  const state = create(base, (draft) => {
    expect(draft.a.x).toBe(1);
    draft.a = original(draft.a);
  });
  expect(state).toBe(base);
});
