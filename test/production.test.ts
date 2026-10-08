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
  expect(() =>
    create({ list: [] as number[] }, (draft: any) => {
      draft.list[Symbol('tag')] = 1;
    })
  ).toThrow(minified(2));
  expect(() => current({} as any)).toThrow(minified(7));
});

test('patch, original() and rawReturn() errors carry their minified code', () => {
  const { apply, create, original, rawReturn } = mutative;
  expect(() =>
    apply({ a: 1 }, [{ op: 'replace', path: ['__proto__', 'x'], value: 1 }])
  ).toThrow(minified(13));
  expect(() =>
    apply({ a: 1 }, [{ op: 'add', path: ['a', 'b', 'c'], value: 1 }])
  ).toThrow(minified(14));
  expect(() =>
    apply({ set: new Set([1]) }, [
      { op: 'replace', path: ['set', 0], value: 2 },
    ])
  ).toThrow(minified(15));
  expect(() =>
    apply({ a: 1 }, [{ op: 'copy' as any, path: ['a'], value: 1 }])
  ).toThrow(minified(16));
  create({ a: 1 }, (draft) => {
    expect(() => apply(draft, [], {})).toThrow(minified(17));
  });
  expect(() => original({})).toThrow(minified(18));
  expect(() => (rawReturn as any)()).toThrow(minified(19));
  expect(() => (rawReturn as any)({}, {})).toThrow(minified(20));
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

test('auto-freeze freezes a Map or Set that holds itself', () => {
  const { create } = mutative;
  const state = create(
    {} as { map?: Map<string, any>; set?: Set<any> },
    (draft) => {
      const map = new Map<string, any>();
      map.set('self', map);
      const set = new Set<any>();
      set.add(set);
      draft.map = map;
      draft.set = set;
    },
    { enableAutoFreeze: true }
  );
  expect(Object.isFrozen(state.map)).toBe(true);
  expect(state.map!.get('self')).toBe(state.map);
  expect(Object.isFrozen(state.set)).toBe(true);
  expect(state.set!.has(state.set)).toBe(true);
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

test('option and return value warnings are not printed', () => {
  const { apply, create, rawReturn } = mutative;
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  apply({ count: 1 }, [{ op: 'replace', path: ['count'], value: 2 }], {
    mutable: true,
    enableAutoFreeze: true,
  });
  create({ a: { b: 1 } }, () => ({ a: { b: 2 } }));
  create({ a: { b: 1 } }, (draft) => rawReturn({ a: draft.a }), {
    strict: true,
  });
  rawReturn(1 as any);
  expect(warn).not.toHaveBeenCalled();
  warn.mockRestore();
});

test('string patch paths skip the check of Map keys that are not strings', () => {
  const { create } = mutative;
  const [, patches] = create(
    {
      map: new Map<number, any>([
        [1, { v: 1 }],
        [2, 1],
      ]),
    },
    (draft) => {
      draft.map.get(1).v = 2;
      draft.map.set(2, 3);
    },
    { enablePatches: { pathAsArray: false } }
  );
  expect(patches).toStrictEqual([
    { op: 'replace', path: '/map/1/v', value: 2 },
    { op: 'replace', path: '/map/2', value: 3 },
  ]);
});

test('with auto-freeze, returned values are not searched inside frozen objects', () => {
  const { create, isDraft } = mutative;
  let reads = 0;
  const payload = Object.freeze({
    get rows() {
      reads += 1;
      return [] as number[];
    },
  });
  const baseState = { a: { value: 1 }, payload, nested: { a: { value: 2 } } };
  const recipe = (draft: any) => ({
    a: draft.a,
    payload,
    nested: { a: draft.a },
  });
  const state = create(baseState, recipe, { enableAutoFreeze: true });
  expect(reads).toBe(0);
  expect(state.payload).toBe(payload);
  expect(state.nested.a).toBe(baseState.a);
  expect(isDraft(state.nested.a)).toBe(false);
  // Without auto-freeze, frozen objects are searched as before.
  create(baseState, recipe);
  expect(reads).toBe(1);
});

test('with auto-freeze, drafts that frozen returned values hold stay unresolved', () => {
  const { create } = mutative;
  const options = { enableAutoFreeze: true };
  const baseState = { a: { value: 1 }, held: {} as any };
  const state = create(
    baseState,
    (draft) => ({ a: draft.a, held: Object.freeze({ a: draft.a }) }),
    options
  );
  expect(state.a).toBe(baseState.a);
  expect(() => state.held.a.value).toThrow(TypeError);

  const holdInFrozen = (draft: any) => {
    const inner: Record<string, any> = {};
    const held = Object.freeze({ inner });
    inner.a = draft.a;
    return { a: draft.a, held };
  };
  const next = create(baseState, holdInFrozen, options);
  expect(() => next.held.inner.a.value).toThrow(TypeError);
  // Without auto-freeze, frozen objects are searched as before.
  expect(create(baseState, holdInFrozen).held.inner.a).toBe(baseState.a);
});

test('with auto-freeze, a frozen returned value is not searched', () => {
  const { create } = mutative;
  const options = { enableAutoFreeze: true };
  const baseState = { a: { value: 1 }, held: {} as any };
  let reads = 0;
  const previous = Object.freeze({
    a: baseState.a,
    get held() {
      reads += 1;
      return {};
    },
  });
  // An earlier state is returned as it is.
  expect(create(baseState, () => previous, options)).toBe(previous);
  expect(reads).toBe(0);
  // A draft in an unfrozen object that the frozen returned value holds stays
  // unresolved.
  const holdUnderFrozenRoot = (draft: typeof baseState) =>
    Object.freeze({ a: baseState.a, held: { a: draft.a } });
  const state = create(baseState, holdUnderFrozenRoot, options);
  expect(() => state.held.a.value).toThrow(TypeError);
  // Without auto-freeze, the returned value is searched as before.
  expect(create(baseState, holdUnderFrozenRoot).held.a).toBe(baseState.a);
  expect(create(baseState, () => previous).held).toEqual({});
  expect(reads).toBe(2);
});
