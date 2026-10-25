/* eslint-disable no-bitwise */
import { isDeepStrictEqual } from 'node:util';
import jsonPatch, {
  type Operation as JsonPatchOperation,
} from 'fast-json-patch';
import { apply, create, makeCreator, rawReturn } from '../src';

const compactOptions = (
  patches: Record<string, unknown> = {},
  options: Record<string, unknown> = {}
) => ({
  enableAutoFreeze: false,
  ...options,
  enablePatches: {
    arrayPatchStrategy: 'compact' as const,
    ...patches,
  },
});

function roundtrip(
  base: any,
  recipe: (draft: any) => any,
  options: any = compactOptions()
) {
  const [state, patches, inverse] = create(base, recipe, options) as any;
  expect(isDeepStrictEqual(apply(base, patches), state)).toBe(true);
  expect(isDeepStrictEqual(apply(state, inverse), base)).toBe(true);
  return { state, patches, inverse };
}

function expectFallback(
  base: any,
  recipe: (draft: any) => any,
  options: any = compactOptions()
) {
  const { enablePatches, ...createOptions } = options;
  const { arrayPatchStrategy: _, ...patchOptions } = enablePatches;
  const expected = create(base, recipe, {
    ...createOptions,
    enablePatches: patchOptions,
  }) as any;
  const [state, patches, inverse] = create(base, recipe, options) as any;
  // Sparse-array patches retain the existing value semantics, which do not
  // promise to distinguish every hole from an explicit undefined element.
  expect(apply(base, patches)).toEqual(state);
  expect(apply(state, inverse)).toEqual(base);
  expect(patches).toEqual(expected[1]);
  expect(inverse).toEqual(expected[2]);
  return { state, patches, inverse };
}

describe('compact array patches', () => {
  test('the issue example becomes one remove and one inverse add', () => {
    const base = { arr: [1, 2, 3, 4] };
    const { state, patches, inverse } = roundtrip(base, (draft) => {
      draft.arr.splice(1, 1);
    });
    expect(state).toEqual({ arr: [1, 3, 4] });
    expect(patches).toEqual([{ op: 'remove', path: ['arr', 1] }]);
    expect(inverse).toEqual([{ op: 'add', path: ['arr', 1], value: 2 }]);
  });

  test('single head and middle edits retain untouched base references', () => {
    const makeBase = () => Array.from({ length: 6 }, (_, id) => ({ id }));
    const cases = [
      {
        recipe: (draft: any[]) => {
          draft.shift();
        },
        path: [0],
        op: 'remove',
        retained: [0, 1] as const,
      },
      {
        recipe: (draft: any[]) => {
          draft.unshift({ id: -1 });
        },
        path: [0],
        op: 'add',
        retained: [1, 0] as const,
      },
      {
        recipe: (draft: any[]) => {
          draft.splice(2, 1);
        },
        path: [2],
        op: 'remove',
        retained: [2, 3] as const,
      },
      {
        recipe: (draft: any[]) => {
          draft.splice(2, 0, { id: -1 });
        },
        path: [2],
        op: 'add',
        retained: [3, 2] as const,
      },
    ];
    for (const { recipe, path, op, retained } of cases) {
      const base = makeBase();
      const { patches } = roundtrip(base, recipe);
      expect(patches).toHaveLength(1);
      expect(patches[0]).toMatchObject({ op, path });
      const replayed = apply(base, patches);
      expect(replayed[retained[0]]).toBe(base[retained[1]]);
    }
  });

  test('contiguous edits have deterministic forward and inverse order', () => {
    const removed = roundtrip([0, 1, 2, 3, 4, 5], (draft) => {
      draft.splice(1, 3);
    });
    expect(removed.patches).toEqual([
      { op: 'remove', path: [3] },
      { op: 'remove', path: [2] },
      { op: 'remove', path: [1] },
    ]);
    expect(removed.inverse).toEqual([
      { op: 'add', path: [1], value: 1 },
      { op: 'add', path: [2], value: 2 },
      { op: 'add', path: [3], value: 3 },
    ]);

    const inserted = roundtrip([0, 1, 2, 3], (draft) => {
      draft.splice(2, 0, 7, 8, 9);
    });
    expect(inserted.patches).toEqual([
      { op: 'add', path: [2], value: 7 },
      { op: 'add', path: [3], value: 8 },
      { op: 'add', path: [4], value: 9 },
    ]);
    expect(inserted.inverse).toEqual([
      { op: 'remove', path: [4] },
      { op: 'remove', path: [3] },
      { op: 'remove', path: [2] },
    ]);
  });

  test('tail edits keep the existing efficient patch forms', () => {
    expectFallback([1, 2, 3], (draft) => {
      draft.push(4);
    });
    expectFallback([1, 2, 3], (draft) => {
      draft.splice(3, 0, 4, 5);
    });
    expectFallback([1, 2, 3], (draft) => {
      draft.pop();
    });
    expectFallback([1, 2, 3], (draft) => {
      draft.splice(1, 2);
    });
    expectFallback([1, 2, 3], (draft) => {
      draft.length = 1;
    });
  });

  test('reorders and multi-segment changes fall back without a diff', () => {
    expectFallback([1, 2, 3, 4], (draft) => {
      draft.reverse();
    });
    expectFallback([3, 1, 2], (draft) => {
      draft.sort();
    });
    expectFallback([0, 1, 2, 3, 4], (draft) => {
      const [item] = draft.splice(1, 1);
      draft.splice(3, 0, item);
    });
    expectFallback([0, 1, 2, 3], (draft) => {
      draft[1] = 9;
      draft.shift();
    });
    expectFallback([0, 1, 2, 3], (draft) => {
      draft.length = 3;
      draft.unshift(-1);
    });
  });

  test('nested edits are handled without blocking on sibling patches', () => {
    const nested = {
      rows: [{ x: 0 }, { x: 0 }, { x: 0 }],
    };
    expectFallback(nested, (draft) => {
      draft.rows.shift();
      draft.rows[0].x = 1;
    });
    const inserted = roundtrip(nested, (draft) => {
      draft.rows.unshift({ x: -1 });
      draft.rows[0].x = 1;
    });
    expect(inserted.patches).toEqual([
      { op: 'add', path: ['rows', 0], value: { x: 1 } },
    ]);
    expectFallback(
      {
        rows: [
          [1, 2],
          [3, 4],
        ],
      },
      (draft) => {
        draft.rows[1].unshift(2);
        draft.rows.shift();
      }
    );

    for (const pathAsArray of [true, false]) {
      const base = {
        rows: [{ id: 0 }, { id: 1 }],
        rows2: [{ id: 2 }],
        meta: { count: 0 },
      };
      const { patches } = roundtrip(
        base,
        (draft) => {
          draft.rows.shift();
          draft.rows2[0].id = 3;
          draft.meta.count = 1;
        },
        compactOptions({ pathAsArray })
      );
      expect(patches).toContainEqual({
        op: 'remove',
        path: pathAsArray ? ['rows', 0] : '/rows/0',
      });
    }
  });

  test('sibling arrays produce compact patches independently', () => {
    const length = 100;
    const base = { rows: Array.from({ length }, () => [0, 1, 2]) };
    const { patches, inverse } = roundtrip(base, (draft) => {
      for (const row of draft.rows) row.shift();
    });
    expect(patches).toHaveLength(length);
    expect(inverse).toHaveLength(length);
    expect(patches).toContainEqual({ op: 'remove', path: ['rows', 0, 0] });
    expect(patches).toContainEqual({
      op: 'remove',
      path: ['rows', length - 1, 0],
    });
  });

  test('cross-array moved drafts replay in either finalization order', () => {
    for (const targetFirst of [false, true]) {
      const base = {
        a: [
          { id: 'a0', n: 0 },
          { id: 'a1', n: 0 },
        ],
        b: [{ id: 'b0', n: 0 }],
      };
      const { state, patches } = roundtrip(base, (draft) => {
        const target = targetFirst ? draft.b : null;
        const item = draft.a.shift()!;
        item.n += 1;
        (target ?? draft.b).unshift(item);
      });
      expect(state).toEqual({
        a: [{ id: 'a1', n: 0 }],
        b: [
          { id: 'a0', n: 1 },
          { id: 'b0', n: 0 },
        ],
      });
      expect(() => JSON.stringify(patches)).not.toThrow();
    }
  });

  test('compact arrays retain their Map and Set parent paths', () => {
    const bases = [
      new Map([
        ['a', [0, 1, 2]],
        ['b', [3]],
      ]),
      new Set([[0, 1, 2], [3]]),
    ];
    for (const base of bases) {
      const { state, patches } = roundtrip(base, (draft) => {
        const [a, b] = draft.values();
        const item = a.shift()!;
        b.unshift(item);
      });
      const firstKey = base instanceof Map ? 'a' : 0;
      const secondKey = base instanceof Map ? 'b' : 1;
      expect(state).toEqual(
        base instanceof Map
          ? new Map([
              ['a', [1, 2]],
              ['b', [0, 3]],
            ])
          : new Set([
              [1, 2],
              [0, 3],
            ])
      );
      expect(patches).toContainEqual({ op: 'remove', path: [firstKey, 0] });
      expect(patches).toContainEqual({
        op: 'add',
        path: [secondKey, 0],
        value: 0,
      });
    }
  });

  test('sparse arrays and direct length changes preserve default behavior', () => {
    const sparse: any[] = [1, undefined, 3, 4];
    delete sparse[1];
    expectFallback(sparse, (draft) => {
      draft.splice(0, 1);
    });
    expectFallback([0, 1, 2, 3], (draft) => {
      draft.length = 5;
      draft.shift();
    });
  });

  test('duplicates, NaN, signed zero, undefined, Map and Set replay by value', () => {
    const shared = { id: 'shared' };
    const base: any[] = [
      shared,
      0,
      Number.NaN,
      -0,
      undefined,
      shared,
      new Map([['a', 1]]),
      new Set([1]),
    ];
    const { state, patches } = roundtrip(base, (draft) => {
      draft.splice(5, 1);
    });
    expect(patches).toEqual([{ op: 'remove', path: [5] }]);
    const replayed = apply(base, patches);
    expect(isDeepStrictEqual(replayed, state)).toBe(true);
    expect(Number.isNaN(replayed[2])).toBe(true);
    expect(Object.is(replayed[3], -0)).toBe(true);
    expect(replayed[4]).toBeUndefined();
    expect(replayed[0]).toBe(shared);
  });

  test('explicit draft aliases retain value replay, not an alias-graph promise', () => {
    const base = { a: { x: 1 }, arr: [{ x: 2 }, { x: 3 }] };
    const { state, patches } = roundtrip(base, (draft) => {
      draft.arr.unshift(draft.a);
    });
    expect(patches).toEqual([{ op: 'add', path: ['arr', 0], value: { x: 1 } }]);
    const replayed = apply(base, patches);
    expect(isDeepStrictEqual(replayed, state)).toBe(true);
    expect(state.arr[0]).toBe(state.a);
    expect(replayed.arr[0]).not.toBe(replayed.a);
  });

  test('makeCreator, manual drafts, frozen input and mutable apply work', () => {
    const creator = makeCreator(compactOptions());
    const base = [{ id: 0 }, { id: 1 }, { id: 2 }];
    const [state, patches, inverse] = creator(base, (draft) => {
      draft.shift();
    }) as any;
    expect(patches).toEqual([{ op: 'remove', path: [0] }]);
    expect(apply(base, patches)).toEqual(state);
    expect(apply(state, inverse)).toEqual(base);

    const [draft, finalize] = create(base, compactOptions()) as any;
    draft.shift();
    const [manualState, manualPatches, manualInverse] = finalize();
    expect(apply(base, manualPatches)).toEqual(manualState);
    expect(apply(manualState, manualInverse)).toEqual(base);

    const frozenBase = Object.freeze(base.map(Object.freeze));
    const frozen = roundtrip(
      frozenBase,
      (draft) => {
        draft.shift();
      },
      compactOptions({}, { enableAutoFreeze: true })
    );
    expect(Object.isFrozen(frozen.state)).toBe(true);

    const mutable = base.map((item) => ({ ...item }));
    apply(mutable, patches, { mutable: true });
    expect(mutable).toEqual(state);
    apply(mutable, inverse, { mutable: true });
    expect(mutable).toEqual(base);
  });

  test('nested producers, rawReturn and async recipes compose with the option', async () => {
    const base = { rows: [{ id: 0 }, { id: 1 }], other: { x: 0 } };
    const nested = roundtrip(base, (draft) => {
      draft.other = create(base.other, (inner) => {
        inner.x = 1;
      });
      draft.rows.shift();
    });
    expect(nested.patches).toContainEqual({
      op: 'remove',
      path: ['rows', 0],
    });

    const raw = roundtrip([{ id: 0 }, { id: 1 }], () => rawReturn([{ id: 1 }]));
    expect(raw.state).toEqual([{ id: 1 }]);

    const options = compactOptions();
    const [state, patches, inverse] = (await create(
      [{ id: 0 }, { id: 1 }],
      async (draft) => {
        await Promise.resolve();
        draft.shift();
      },
      options
    )) as any;
    expect(apply([{ id: 0 }, { id: 1 }], patches)).toEqual(state);
    expect(apply(state, inverse)).toEqual([{ id: 0 }, { id: 1 }]);
  });

  test('JSON serialization preserves replay with array and pointer paths', () => {
    for (const pathAsArray of [true, false]) {
      const base = { rows: [{ id: 0 }, { id: 1 }, { id: 2 }] };
      const { state, patches, inverse } = roundtrip(
        base,
        (draft) => {
          draft.rows.splice(1, 0, { id: 9 });
        },
        compactOptions({ pathAsArray, arrayLengthAssignment: false })
      );
      const serialized = JSON.parse(JSON.stringify(patches));
      const serializedInverse = JSON.parse(JSON.stringify(inverse));
      expect(apply(base, serialized)).toEqual(state);
      expect(apply(state, serializedInverse)).toEqual(base);
    }
  });

  test("explicit 'index' and enablePatches: true preserve default patches", () => {
    const recipes = [
      (draft: any) => {
        draft.rows.shift();
      },
      (draft: any) => {
        draft.rows.splice(1, 0, { id: 9 });
      },
      (draft: any) => {
        draft.rows.reverse();
      },
      (draft: any) => {
        draft.rows.push({ id: 9 });
      },
    ];
    for (const recipe of recipes) {
      const base = {
        rows: [{ id: 0 }, { id: 1 }, { id: 2 }, { id: 3 }],
      };
      const expected = create(base, recipe, {
        enableAutoFreeze: false,
        enablePatches: true,
      });
      const actual = create(base, recipe, {
        enableAutoFreeze: false,
        enablePatches: { arrayPatchStrategy: 'index' },
      });
      expect(actual).toEqual(expected);
    }
  });

  test('an independent strict RFC 6902 consumer replays root arrays', () => {
    for (const recipe of [
      (draft: any[]) => {
        draft.shift();
      },
      (draft: any[]) => {
        draft.unshift({ id: 9 });
      },
      (draft: any[]) => {
        draft.splice(1, 2);
      },
    ]) {
      const base = [{ id: 0 }, { id: 1 }, { id: 2 }, { id: 3 }];
      const [state, patches, inverse] = create(base, recipe, {
        enableAutoFreeze: false,
        enablePatches: {
          arrayPatchStrategy: 'compact',
          pathAsArray: false,
          arrayLengthAssignment: false,
        },
      }) as any;
      const next = jsonPatch.applyPatch(
        structuredClone(base),
        JSON.parse(JSON.stringify(patches)),
        true
      ).newDocument;
      expect(next).toEqual(state);
      const restored = jsonPatch.applyPatch(
        structuredClone(next),
        JSON.parse(JSON.stringify(inverse)),
        true
      ).newDocument;
      expect(restored).toEqual(base);
    }
  });

  test('an independent strict RFC 6902 consumer replays both directions', () => {
    const recipes = [
      (draft: any) => {
        draft.rows.shift();
      },
      (draft: any) => {
        draft.rows.splice(1, 0, { id: 9 });
      },
      (draft: any) => {
        draft.rows.splice(1, 2);
      },
    ];
    for (const recipe of recipes) {
      const base = {
        rows: [{ id: 0 }, { id: 1 }, { id: 2 }, { id: 3 }],
      };
      const [state, patches, inverse] = create(base, recipe, {
        enableAutoFreeze: false,
        enablePatches: {
          arrayPatchStrategy: 'compact',
          pathAsArray: false,
          arrayLengthAssignment: false,
        },
      }) as any;
      for (const patch of [...patches, ...inverse]) {
        expect(['add', 'remove', 'replace']).toContain(patch.op);
        expect(typeof patch.path).toBe('string');
        expect(patch.path.endsWith('/length')).toBe(false);
      }
      const forward = JSON.parse(
        JSON.stringify(patches)
      ) as JsonPatchOperation[];
      const backward = JSON.parse(
        JSON.stringify(inverse)
      ) as JsonPatchOperation[];
      const next = jsonPatch.applyPatch(
        structuredClone(base),
        forward,
        true
      ).newDocument;
      expect(next).toEqual(state);
      const restored = jsonPatch.applyPatch(
        structuredClone(next),
        backward,
        true
      ).newDocument;
      expect(restored).toEqual(base);
    }
  });
});

// Differential fuzz covers compact hits and all fallback shapes. These values
// deliberately include cases that JSON cannot represent, so this checks the
// library's value semantics separately from the JSON-safe tests above.
type Op =
  | ['push']
  | ['pop']
  | ['shift']
  | ['unshift']
  | ['splice', number, number, number]
  | ['set', number]
  | ['mutate', number]
  | ['length', number]
  | ['fill']
  | ['copyWithin']
  | ['reverse'];

function runOps(arr: any[], ops: Op[], random: () => number) {
  for (const op of ops) {
    const index = arr.length === 0 ? 0 : Math.floor(random() * arr.length);
    switch (op[0]) {
      case 'push':
        arr.push({ id: 1000 + index, n: 0 });
        break;
      case 'pop':
        arr.pop();
        break;
      case 'shift':
        arr.shift();
        break;
      case 'unshift':
        arr.unshift({ id: 1000 + index, n: 0 });
        break;
      case 'splice':
        arr.splice(
          index,
          op[2],
          ...Array.from({ length: op[3] }, (_, k) => ({ id: 2000 + k, n: 0 }))
        );
        break;
      case 'set':
        arr[index] = { id: 1000 + index, n: 0 };
        break;
      case 'mutate':
        if (arr[index] && typeof arr[index] === 'object') arr[index].n += 1;
        break;
      case 'length':
        arr.length = Math.min(op[1], arr.length + 1);
        break;
      case 'fill':
        arr.fill(7, index, index + 1);
        break;
      case 'copyWithin':
        arr.copyWithin(index, 0, Math.min(2, arr.length));
        break;
      case 'reverse':
        arr.reverse();
        break;
    }
  }
}

test('compact patches deterministic differential fuzz', () => {
  let seed = 42;
  const random = () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const kinds: Op[0][] = [
    'push',
    'pop',
    'shift',
    'unshift',
    'splice',
    'splice',
    'set',
    'mutate',
    'length',
    'fill',
    'copyWithin',
    'reverse',
  ];
  for (let caseIndex = 0; caseIndex < 400; caseIndex += 1) {
    const length = Math.floor(random() * 10);
    const base = Array.from({ length }, (_, i) =>
      random() < 0.2 ? i : { id: i, n: 0 }
    );
    const ops: Op[] = Array.from(
      { length: 1 + Math.floor(random() * 4) },
      () => {
        const kind = kinds[Math.floor(random() * kinds.length)];
        const index = Math.floor(random() * Math.max(length, 1));
        if (kind === 'splice') {
          return [
            'splice',
            index,
            Math.floor(random() * 3),
            Math.floor(random() * 3),
          ];
        }
        if (kind === 'length') return ['length', Math.floor(random() * 5)];
        if (kind === 'set' || kind === 'mutate') return [kind, index];
        return [kind] as Op;
      }
    );
    let expectedSeed = caseIndex * 7919 + 1;
    const expectedRandom = () => {
      expectedSeed = (expectedSeed * 1664525 + 1013904223) >>> 0;
      return expectedSeed / 4294967296;
    };
    const expected = structuredClone(base);
    runOps(expected, ops, expectedRandom);
    let draftSeed = caseIndex * 7919 + 1;
    const draftRandom = () => {
      draftSeed = (draftSeed * 1664525 + 1013904223) >>> 0;
      return draftSeed / 4294967296;
    };
    const [state, patches, inverse] = create(
      base,
      (draft: any) => {
        runOps(draft, ops, draftRandom);
      },
      compactOptions()
    ) as any;
    expect(state).toEqual(expected);
    expect(apply(base, patches)).toEqual(expected);
    expect(apply(state, inverse)).toEqual(base);
  }
});
