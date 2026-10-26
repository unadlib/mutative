/* eslint-disable no-bitwise */
import { isDeepStrictEqual } from 'node:util';
import jsonPatch, {
  type Operation as JsonPatchOperation,
} from 'fast-json-patch';
import { apply, create, makeCreator, original, rawReturn } from '../src';

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
    // A mark moves elements through the proxy instead of the native methods.
    for (const options of [{}, { mark: () => undefined }]) {
      const fallback = (recipe: (draft: any[]) => void) =>
        expectFallback([1, 2, 3], recipe, compactOptions({}, options));
      fallback((draft) => {
        draft.push(4);
      });
      fallback((draft) => {
        draft.splice(3, 0, 4, 5);
      });
      fallback((draft) => {
        draft.pop();
      });
      fallback((draft) => {
        draft.splice(1, 2);
      });
      fallback((draft) => {
        draft.length = 1;
      });
    }
  });

  test('compact patches do not depend on how the recipe changed the array', () => {
    class List<T> extends Array<T> {}
    const items = () => [{ id: 0 }, { id: 1 }, { id: 2 }, { id: 3 }];
    const inserted = { id: 9 };
    const removals = [
      (draft: any[]) => {
        draft.splice(1, 1);
      },
      (draft: any[]) => {
        Array.prototype.splice.call(draft, 1, 1);
      },
      (draft: any[]) => {
        for (let index = 1; index < draft.length - 1; index += 1) {
          draft[index] = draft[index + 1];
        }
        draft.length -= 1;
      },
    ];
    // Strict mode and marks move object elements through the proxy instead of
    // the native array methods, and so do the methods of a subclass.
    for (const options of [{}, { strict: true }, { mark: () => undefined }]) {
      for (const makeBase of [items, () => List.from(items())]) {
        for (const recipe of removals) {
          const base = makeBase();
          const { patches, inverse } = roundtrip(
            base,
            recipe,
            compactOptions({}, options)
          );
          expect(patches).toEqual([{ op: 'remove', path: [1] }]);
          expect(inverse).toEqual([{ op: 'add', path: [1], value: base[1] }]);
        }
        const { patches, inverse } = roundtrip(
          makeBase(),
          (draft) => {
            draft.unshift(inserted);
          },
          compactOptions({}, options)
        );
        expect(patches).toEqual([{ op: 'add', path: [0], value: inserted }]);
        expect(inverse).toEqual([{ op: 'remove', path: [0] }]);
      }
    }
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

  test('nested edits keep compact patches without blocking on sibling patches', () => {
    const nested = {
      rows: [{ x: 0 }, { x: 0 }, { x: 0 }],
    };
    const shifted = roundtrip(nested, (draft) => {
      draft.rows.shift();
      draft.rows[0].x = 1;
    });
    expect(shifted.patches).toEqual([
      { op: 'remove', path: ['rows', 0] },
      { op: 'replace', path: ['rows', 0], value: { x: 1 } },
    ]);
    expect(shifted.inverse).toEqual([
      { op: 'replace', path: ['rows', 0], value: { x: 0 } },
      { op: 'add', path: ['rows', 0], value: { x: 0 } },
    ]);
    const inserted = roundtrip(nested, (draft) => {
      draft.rows.unshift({ x: -1 });
      draft.rows[0].x = 1;
    });
    expect(inserted.patches).toEqual([
      { op: 'add', path: ['rows', 0], value: { x: 1 } },
    ]);
    const rows = roundtrip(
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
    expect(rows.patches).toEqual([
      { op: 'remove', path: ['rows', 0] },
      { op: 'replace', path: ['rows', 0], value: [2, 3, 4] },
    ]);

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

  test('a child that emitted patches at its own index after the change falls back', () => {
    // The child is at its own key, so it emits patches under the array's path.
    // Past the insertion, its element is the base array's second reference to
    // the same object, and the child's patches would change the first one.
    const shared = { id: 's' };
    expectFallback({ list: [{ id: 'a' }, shared, shared] }, (draft) => {
      const child = draft.list[2];
      draft.list.unshift({ id: 'n' });
      draft.list[2] = child;
      child.v = 1;
    });
  });

  test('a child back at its own index before the insertion keeps its patches', () => {
    // The insertion is aligned after the child, whose patches change the
    // base element at its index, and the inserted value is the base element.
    const { patches, inverse } = roundtrip(
      { list: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] },
      (draft) => {
        const child = draft.list[1];
        draft.list[1] = original(draft.list)[1];
        draft.list.splice(1, 0, child);
        child.v = 1;
      }
    );
    expect(patches).toEqual([
      { op: 'add', path: ['list', 1, 'v'], value: 1 },
      { op: 'add', path: ['list', 2], value: { id: 'b' } },
    ]);
    expect(inverse).toEqual([
      { op: 'remove', path: ['list', 1, 'v'] },
      { op: 'remove', path: ['list', 2] },
    ]);
  });

  test("only an element's own child at its own index carries its change", () => {
    // `b[0]` emits its patches under `b`. Placed into `a`, where the base
    // array holds the same object, its change reaches `a` only by a replace.
    const shared = { id: 's' };
    const moved = roundtrip(
      { a: [shared, { id: 'x1' }, { id: 'x2' }], b: [shared, { id: 'y1' }] },
      (draft) => {
        draft.a.splice(1, 1);
        const item = draft.b[0];
        item.v = 1;
        draft.a[0] = item;
      }
    );
    expect(moved.patches).toEqual([
      { op: 'add', path: ['b', 0, 'v'], value: 1 },
      { op: 'remove', path: ['a', 1] },
      { op: 'replace', path: ['a', 0], value: { id: 's', v: 1 } },
    ]);
    // The child also placed at the next index, where the base array holds the
    // same object, emits its patches only at its own one.
    const copied = roundtrip(
      { list: [shared, shared, { id: 'x' }, { id: 'y' }] },
      (draft) => {
        const child = draft.list[0];
        draft.list[1] = child;
        child.v = 1;
        draft.list.splice(2, 1);
      }
    );
    expect(copied.patches).toEqual([
      { op: 'add', path: ['list', 0, 'v'], value: 1 },
      { op: 'remove', path: ['list', 2] },
      { op: 'replace', path: ['list', 1], value: { id: 's', v: 1 } },
    ]);
  });

  test('a changed alias draft at a retained index is replaced', () => {
    // A draft read through another path before the array is finalized after
    // it, so the array still holds the draft. It stands for its original only
    // while it is unchanged; changed, its element is replaced.
    const shared = { id: 'x' };
    const { patches, inverse } = roundtrip(
      { other: shared, list: [shared, { id: 'y' }, { id: 'z' }] },
      (draft) => {
        const other = draft.other;
        draft.list[0] = other;
        other.v = 1;
        draft.list.splice(1, 1);
      }
    );
    expect(patches).toEqual([
      { op: 'remove', path: ['list', 1] },
      { op: 'replace', path: ['list', 0], value: { id: 'x', v: 1 } },
      { op: 'add', path: ['other', 'v'], value: 1 },
    ]);
    expect(inverse).toEqual([
      { op: 'replace', path: ['list', 0], value: { id: 'x' } },
      { op: 'add', path: ['list', 1], value: { id: 'y' } },
      { op: 'remove', path: ['other', 'v'] },
    ]);
  });

  test('elements changed before or after an insertion or deletion keep compact patches', () => {
    const makeBase = () => ({
      todos: Array.from({ length: 8 }, (_, id) => ({ id, done: false })),
    });
    // Strict mode and marks move object elements through the proxy instead of
    // the native array methods.
    for (const options of [{}, { strict: true }, { mark: () => undefined }]) {
      // Before the deletion, the element keeps its index, and its own patch
      // carries the change.
      const before = roundtrip(
        makeBase(),
        (draft) => {
          draft.todos[0].done = true;
          draft.todos.splice(5, 1);
        },
        compactOptions({}, options)
      );
      expect(before.patches).toEqual([
        { op: 'replace', path: ['todos', 0, 'done'], value: true },
        { op: 'remove', path: ['todos', 5] },
      ]);
      expect(before.inverse).toEqual([
        { op: 'replace', path: ['todos', 0, 'done'], value: false },
        { op: 'add', path: ['todos', 5], value: { id: 5, done: false } },
      ]);
      // After it, the element moved, and it is replaced at its new index.
      const after = roundtrip(
        makeBase(),
        (draft) => {
          draft.todos[6].done = true;
          draft.todos.splice(2, 1);
        },
        compactOptions({}, options)
      );
      expect(after.patches).toEqual([
        { op: 'remove', path: ['todos', 2] },
        { op: 'replace', path: ['todos', 5], value: { id: 6, done: true } },
      ]);
      expect(after.inverse).toEqual([
        { op: 'replace', path: ['todos', 5], value: { id: 6, done: false } },
        { op: 'add', path: ['todos', 2], value: { id: 2, done: false } },
      ]);
      const inserted = roundtrip(
        makeBase(),
        (draft) => {
          draft.todos.unshift({ id: -1, done: false });
          draft.todos[1].done = true;
        },
        compactOptions({}, options)
      );
      expect(inserted.patches).toEqual([
        { op: 'add', path: ['todos', 0], value: { id: -1, done: false } },
        { op: 'replace', path: ['todos', 1], value: { id: 0, done: true } },
      ]);
      expect(inserted.inverse).toEqual([
        { op: 'replace', path: ['todos', 1], value: { id: 0, done: false } },
        { op: 'remove', path: ['todos', 0] },
      ]);
      // A nested array that keeps its index has compact patches of its own.
      const nested = roundtrip(
        {
          rows: [
            [0, 1],
            [2, 3],
            [4, 5],
          ],
        },
        (draft) => {
          draft.rows[0].shift();
          draft.rows.splice(1, 1);
        },
        compactOptions({}, options)
      );
      expect(nested.patches).toEqual([
        { op: 'remove', path: ['rows', 0, 0] },
        { op: 'remove', path: ['rows', 1] },
      ]);
      expect(nested.inverse).toEqual([
        { op: 'add', path: ['rows', 0, 0], value: 0 },
        { op: 'add', path: ['rows', 1], value: [2, 3] },
      ]);
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

  test('an inserted draft gives the same patches whichever the recipe read first', () => {
    for (const readFirst of [false, true]) {
      for (const change of [false, true]) {
        const base = { a: { x: 1 }, arr: [{ x: 2 }, { x: 3 }] };
        const { state, patches, inverse } = roundtrip(base, (draft) => {
          // Reading `a` before `arr` finalizes its draft after the array.
          const first = readFirst ? draft.a : null;
          const arr = draft.arr;
          const item = first ?? draft.a;
          arr.splice(1, 0, item);
          if (change) item.x = 9;
        });
        const added = { op: 'add', path: ['arr', 1], value: state.a };
        const removed = { op: 'remove', path: ['arr', 1] };
        if (change) {
          expect(patches).toHaveLength(2);
          expect(patches).toContainEqual(added);
          expect(patches).toContainEqual({
            op: 'replace',
            path: ['a', 'x'],
            value: 9,
          });
          expect(inverse).toHaveLength(2);
          expect(inverse).toContainEqual(removed);
        } else {
          expect(patches).toEqual([added]);
          expect(inverse).toEqual([removed]);
        }
      }
    }
  });

  test('a draft of another producer is inserted by value', () => {
    create({ item: { v: 1 } }, (outer) => {
      const base = [0, 1];
      const [, patches, inverse] = create(
        base,
        (draft: any[]) => {
          draft.splice(1, 0, outer.item);
        },
        compactOptions()
      ) as any;
      expect(patches).toEqual([{ op: 'add', path: [1], value: { v: 1 } }]);
      expect(inverse).toEqual([{ op: 'remove', path: [1] }]);
      expect(apply(base, patches)).toEqual([0, { v: 1 }, 1]);
      expect(apply([0, { v: 1 }, 1], inverse)).toEqual(base);
    });
  });

  test('a draft of another producer at a retained index is replaced', () => {
    // The other producer may change its draft after this one is done, and
    // then writes the final value into this result, so the draft does not
    // stand for its original even while it is unchanged.
    const item: { id: string; v?: number } = { id: 'a' };
    const base = [item, { id: 'b' }, { id: 'c' }];
    let result: any;
    create({ item }, (outer) => {
      result = create(
        base,
        (draft: any[]) => {
          draft[0] = outer.item;
          draft.splice(1, 1);
        },
        compactOptions()
      );
      outer.item.v = 1;
    });
    const [state, patches, inverse] = result;
    expect(state).toEqual([{ id: 'a', v: 1 }, { id: 'c' }]);
    expect(patches).toEqual([
      { op: 'remove', path: [1] },
      { op: 'replace', path: [0], value: { id: 'a' } },
    ]);
    expect(inverse).toEqual([
      { op: 'replace', path: [0], value: { id: 'a' } },
      { op: 'add', path: [1], value: { id: 'b' } },
    ]);
    expect(apply(state, inverse)).toEqual(base);
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
  const random = mulberry32(42);
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
  let compactCases = 0;
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
    // The plain run and each producer pick the same indices.
    const indexRandom = () => {
      let opSeed = caseIndex * 7919 + 1;
      return () => {
        opSeed = (opSeed * 1664525 + 1013904223) >>> 0;
        return opSeed / 4294967296;
      };
    };
    const expected = structuredClone(base);
    runOps(expected, ops, indexRandom());
    const recipe = (draft: any) => {
      runOps(draft, ops, indexRandom());
    };
    const [state, patches, inverse] = create(
      base,
      recipe,
      compactOptions()
    ) as any;
    expect(state).toEqual(expected);
    expect(apply(base, patches)).toEqual(expected);
    expect(apply(state, inverse)).toEqual(base);
    const [, indexPatches] = create(base, recipe, {
      enableAutoFreeze: false,
      enablePatches: true,
    }) as any;
    if (!isDeepStrictEqual(patches, indexPatches)) compactCases += 1;
  }
  // Most recipes here end in a fallback shape; 25 of them get compact patches.
  expect(compactCases).toBeGreaterThanOrEqual(25);
});

function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const makeRow = (random: () => number) => ({
  id: Math.floor(random() * 1e9),
  n: 0,
  sub: { k: 0 },
  kids: Array.from({ length: Math.floor(random() * 4) }, (_, index) =>
    random() < 0.5 ? index : { v: index }
  ),
});

const pick = (list: any[], random: () => number) =>
  Math.floor(random() * Math.max(list.length, 1));

// Steps on `{ a, b, shared, meta }`: rows with nested arrays in two arrays,
// moves between them, and `shared`, which may be the first row of `a` too.
const nestedSteps: ((draft: any, random: () => number) => void)[] = [
  (draft) => {
    draft.a.shift();
  },
  (draft, random) => {
    draft.b.unshift(makeRow(random));
  },
  (draft, random) => {
    draft.a.splice(
      pick(draft.a, random),
      Math.floor(random() * 3),
      ...Array.from({ length: Math.floor(random() * 3) }, () => makeRow(random))
    );
  },
  (draft, random) => {
    if (draft.b.length)
      draft.a.splice(pick(draft.a, random), 0, draft.b[pick(draft.b, random)]);
  },
  (draft, random) => {
    if (draft.a.length) {
      const [row] = draft.a.splice(pick(draft.a, random), 1);
      draft.b.splice(pick(draft.b, random), 0, row);
    }
  },
  (draft, random) => {
    if (draft.a.length) draft.a[pick(draft.a, random)].n += 1;
  },
  (draft, random) => {
    if (draft.b.length) draft.b[pick(draft.b, random)].sub.k += 1;
  },
  (draft, random) => {
    if (draft.a.length) draft.a[pick(draft.a, random)].kids.shift();
  },
  (draft, random) => {
    if (draft.a.length)
      draft.a[pick(draft.a, random)].kids.unshift(
        random() < 0.5 ? 9 : { v: 9 }
      );
  },
  (draft, random) => {
    if (draft.b.length) {
      const kids = draft.b[pick(draft.b, random)].kids;
      kids.splice(pick(kids, random), 1);
    }
  },
  (draft, random) => {
    draft.a.push(makeRow(random));
  },
  (draft) => {
    draft.b.pop();
  },
  (draft) => {
    draft.a.reverse();
  },
  (draft, random) => {
    if (draft.a.length) draft.a[pick(draft.a, random)] = makeRow(random);
  },
  (draft) => {
    draft.shared.n += 1;
  },
  (draft, random) => {
    draft.a.splice(pick(draft.a, random), 0, draft.shared);
  },
  (draft, random) => {
    if (draft.a.length) Reflect.get(draft.a, pick(draft.a, random));
  },
  (draft, random) => {
    draft.a.length = Math.min(draft.a.length, Math.floor(random() * 4));
  },
  (draft) => {
    draft.b.sort((x: any, y: any) => x.id - y.id);
  },
  (draft) => {
    draft.meta.c += 1;
  },
  (draft, random) => {
    if (draft.a.length) {
      const row = draft.a[pick(draft.a, random)];
      draft.b.unshift(row);
      row.n += 5;
    }
  },
  (draft, random) => {
    const shared = draft.shared;
    draft.b.splice(pick(draft.b, random), 0, shared);
  },
];

const freezeDeep = (value: any) => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(freezeDeep);
  }
  return value;
};

// Strict mode and marks move object elements through the proxy instead of the
// native array methods. The index patches of each recipe are the reference:
// both strategies give the same state, and both patch sets replay in either
// direction. Each path is a test of its own, which stays well within the
// default timeout under coverage.
test.each([
  { name: 'native', options: {}, frozen: false },
  { name: 'frozen', options: { enableAutoFreeze: true }, frozen: true },
  { name: 'strict', options: { strict: true }, frozen: false },
  { name: 'mark', options: { mark: () => undefined }, frozen: false },
])(
  'compact patches differential fuzz across nested arrays, moves and aliases on the $name path',
  ({ options, frozen }) => {
    const failures: number[] = [];
    let compactCases = 0;
    for (let caseIndex = 0; caseIndex < 1500; caseIndex += 1) {
      const plan = mulberry32(caseIndex * 2654435761 + 17);
      const steps = Array.from(
        { length: 1 + Math.floor(plan() * 3) },
        () => nestedSteps[Math.floor(plan() * nestedSteps.length)]
      );
      const random = mulberry32(caseIndex + 1);
      const a = Array.from({ length: Math.floor(random() * 7) }, () =>
        makeRow(random)
      );
      const b = Array.from({ length: Math.floor(random() * 5) }, () =>
        makeRow(random)
      );
      if (a.length > 2 && random() < 0.2) a[2] = a[1];
      const shared = a.length > 0 && random() < 0.5 ? a[0] : makeRow(random);
      const base = { a, b, shared, meta: { c: 0 } };
      if (frozen) freezeDeep(base);
      const recipe = (draft: any) => {
        const stepRandom = mulberry32(caseIndex + 2);
        for (const step of steps) step(draft, stepRandom);
      };
      let passed = false;
      try {
        const before = structuredClone(base);
        const [indexState, indexPatches, indexInverse] = create(base, recipe, {
          ...options,
          enablePatches: true,
        }) as any;
        const [state, patches, inverse] = create(
          base,
          recipe,
          compactOptions({}, options)
        ) as any;
        if (!isDeepStrictEqual(patches, indexPatches)) compactCases += 1;
        passed =
          isDeepStrictEqual(base, before) &&
          isDeepStrictEqual(state, indexState) &&
          isDeepStrictEqual(apply(base, indexPatches), indexState) &&
          isDeepStrictEqual(apply(indexState, indexInverse), base) &&
          isDeepStrictEqual(apply(base, patches), state) &&
          isDeepStrictEqual(apply(state, inverse), base);
      } catch {
        // A recipe that throws fails like one with a wrong result.
      }
      if (!passed) failures.push(caseIndex);
    }
    expect(failures.slice(0, 3)).toEqual([]);
    // 643 of the recipes get compact patches, whichever path they take.
    expect(compactCases).toBeGreaterThanOrEqual(643);
  }
);
