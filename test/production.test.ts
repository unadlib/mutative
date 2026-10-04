/* eslint-disable @typescript-eslint/no-explicit-any */
// Production builds evaluate the library with `__DEV__` false, module
// initialization included, so the library is imported after the flag is set.
let mutative: typeof import('../src');

beforeAll(async () => {
  globalThis.__DEV__ = false;
  mutative = await import('../src');
});

const minified = (code: number) =>
  `Minified Mutative error #${code}; visit https://mutative.js.org/docs/extra-topics/errors`;

test('errors carry their minified code', () => {
  const { create, current } = mutative;
  expect(() => create(new Date() as any, () => {})).toThrow(minified(0));
  expect(() =>
    create({ map: new Map() }, (draft: any) => {
      draft.map.size2 = 1;
    })
  ).toThrow(minified(1));
  expect(() =>
    create({ list: [] as number[] }, (draft: any) => {
      draft.list.key = 1;
    })
  ).toThrow(minified(2));
  expect(() => current({} as any)).toThrow(minified(7));
});

test('auto-freeze passes over primitives in Maps, Sets, and arrays', () => {
  const { create } = mutative;
  const state = create(
    {
      map: new Map<number, string>([[1, 'a']]),
      set: new Set([1]),
      list: [1, 'b'] as (number | string)[],
    },
    (draft) => {
      draft.map.set(2, 'b');
      draft.set.add(2);
      draft.list.push(3);
    },
    { enableAutoFreeze: true }
  );
  expect([...state.map]).toStrictEqual([
    [1, 'a'],
    [2, 'b'],
  ]);
  expect([...state.set]).toStrictEqual([1, 2]);
  expect(state.list).toStrictEqual([1, 'b', 3]);
  expect(Object.isFrozen(state)).toBe(true);
  expect(Object.isFrozen(state.list)).toBe(true);
  // Frozen results reject the mutators their types already omit.
  expect(() => (state.map as any).set(3, 'c')).toThrow(minified(11));
  expect(() => (state.set as any).add(3)).toThrow(minified(11));
});

test('strict mode does not warn about unchanged drafts', () => {
  const { create } = mutative;
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  create(
    Array.from({ length: 2000 }, (_, id) => ({ id })),
    (draft) => {
      draft.find((row) => row.id === -1);
    },
    { strict: true }
  );
  expect(warn).not.toHaveBeenCalled();
  warn.mockRestore();
});
