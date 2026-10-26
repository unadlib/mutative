/* eslint-disable no-sparse-arrays, no-bitwise */
import jsonPatch from 'fast-json-patch';
import { apply, create, type PatchesOptions } from '../src';

const modes = [
  { pathAsArray: true, arrayLengthAssignment: true },
  { pathAsArray: false, arrayLengthAssignment: true },
  { pathAsArray: true, arrayLengthAssignment: false },
  { pathAsArray: false, arrayLengthAssignment: false },
] satisfies PatchesOptions[];

const cases: [string, () => any[], (draft: any[]) => void][] = [
  [
    'unshift a trailing hole',
    () => [1, ,],
    (draft) => {
      draft.unshift(0);
    },
  ],
  [
    'splice before trailing holes',
    () => [1, , ,],
    (draft) => {
      draft.splice(1, 0, 2);
    },
  ],
  [
    'shift a leading hole',
    () => [, 1, ,],
    (draft) => {
      draft.shift();
    },
  ],
  [
    'pop a trailing hole',
    () => [1, ,],
    (draft) => {
      draft.pop();
    },
  ],
  [
    'truncate holes',
    () => [1, , 2, ,],
    (draft) => {
      draft.length = 1;
    },
  ],
  [
    'clear a sparse array',
    () => [1, , 2, ,],
    (draft) => {
      draft.length = 0;
    },
  ],
  [
    'grow length',
    () => [1],
    (draft) => {
      draft.length = 4;
    },
  ],
  [
    'assign beyond length',
    () => [],
    (draft) => {
      draft[3] = 1;
    },
  ],
  [
    'append then create a gap',
    () => [1],
    (draft) => {
      draft.push(2);
      draft[4] = 3;
    },
  ],
  [
    'fill a hole with undefined',
    () => [,],
    (draft) => {
      draft[0] = undefined;
    },
  ],
  [
    'fill a hole with an object',
    () => [,],
    (draft) => {
      draft[0] = { value: 1 };
    },
  ],
  [
    'remove and re-expose an element',
    () => [1, 2, 3],
    (draft) => {
      draft.length = 1;
      draft.length = 3;
    },
  ],
  [
    'remove and re-expose undefined',
    () => [undefined],
    (draft) => {
      draft.length = 0;
      draft.length = 1;
    },
  ],
  [
    'reverse holes',
    () => [1, , , 2],
    (draft) => {
      draft.reverse();
    },
  ],
  [
    'sort holes',
    () => [2, , 1, ,],
    (draft) => {
      draft.sort();
    },
  ],
  [
    'copyWithin holes',
    () => [1, , , 2],
    (draft) => {
      draft.copyWithin(1, 2);
    },
  ],
  [
    'fill holes',
    () => [1, , , 2],
    (draft) => {
      draft.fill(undefined, 1, 3);
    },
  ],
  [
    'nested change before a gap',
    () => [{ value: 1 }],
    (draft) => {
      draft[0].value++;
      draft.length = 3;
    },
  ],
  [
    'nested change after a hole',
    () => [, { value: 1 }],
    (draft) => {
      draft[1].value++;
      draft[0] = undefined;
    },
  ],
  [
    'move a changed child',
    () => [{ value: 1 }, ,],
    (draft) => {
      draft[0].value++;
      draft.unshift(0);
    },
  ],
  [
    'drop a changed child',
    () => [{ value: 1 }, ,],
    (draft) => {
      draft[0].value++;
      draft.length = 0;
      draft.length = 2;
    },
  ],
  [
    'change a nested sparse array',
    () => [[1, ,], ,],
    (draft) => {
      draft[0].unshift(0);
      draft.unshift(2);
    },
  ],
];

const mapKey = { id: 'array' };
const containers: [string, (array: any[]) => any, (state: any) => any[]][] = [
  ['root', (array) => array, (state) => state],
  ['object', (array) => ({ 'a/b~c': array }), (state) => state['a/b~c']],
  ['array', (array) => [array], (state) => state[0]],
  [
    'Map',
    (array) => new Map([['array', array]]),
    (state) => state.get('array'),
  ],
  ['Set', (array) => new Set([array]), (state) => [...state][0]],
];

describe.each(cases)('sparse patches: %s', (_name, make, recipe) => {
  test.each(containers)('round trips in a %s', (_container, wrap, read) => {
    for (const enablePatches of modes) {
      for (const enableAutoFreeze of [false, true]) {
        const base = wrap(make());
        const before = wrap(make());
        const [state, patches, inverse] = create(
          base,
          (draft: any) => recipe(read(draft)),
          { enablePatches, enableAutoFreeze }
        );
        expect(base).toStrictEqual(before);
        expect(state).toStrictEqual(
          create(wrap(make()), (draft: any) => recipe(read(draft)), {
            enableAutoFreeze,
          })
        );
        const replay = apply(base, patches);
        expect(replay).toStrictEqual(state);
        expect(apply(state, inverse)).toStrictEqual(before);
        expect(apply(replay, inverse)).toStrictEqual(before);
        expect(apply(apply(state, inverse), patches)).toStrictEqual(state);

        // Mutable application and application on a live draft must keep the
        // same root; array replacement patches would not support these cases.
        const mutable = wrap(make());
        apply(mutable, patches, { mutable: true });
        expect(mutable).toStrictEqual(state);
        apply(mutable, inverse, { mutable: true });
        expect(mutable).toStrictEqual(before);
        expect(
          create(wrap(make()), (draft: any) => {
            expect(apply(draft, patches)).toBe(draft);
          })
        ).toStrictEqual(state);
      }
    }
  });
});

test('preserves array holes as well as explicit undefined', () => {
  const [state, patches, inverse] = create(
    [1, ,],
    (draft) => {
      draft.unshift(0);
    },
    { enablePatches: true }
  );
  expect(Object.hasOwn(state, 2)).toBe(false);
  expect(Object.hasOwn(apply([1, ,], patches), 2)).toBe(false);
  expect(Object.hasOwn(apply(state, inverse), 1)).toBe(false);

  const [filled, fill, undo] = create(
    [,],
    (draft) => {
      draft[0] = undefined;
    },
    { enablePatches: true }
  );
  expect(Object.hasOwn(filled, 0)).toBe(true);
  expect(Object.hasOwn(apply([,], fill), 0)).toBe(true);
  expect(Object.hasOwn(apply(filled, undo), 0)).toBe(false);
});

test('keeps unchanged prefix references and supports object Map keys', () => {
  const item = { value: 1 };
  const array = [item, ,];
  const base = new Map([[mapKey, array]]);
  const [state, patches, inverse] = create(
    base,
    (draft) => {
      draft.get(mapKey)!.length = 4;
    },
    { enablePatches: true }
  );
  const replay = apply(base, patches);
  expect(replay).toStrictEqual(state);
  expect(replay.get(mapKey)![0]).toBe(item);
  expect(apply(replay, inverse)).toStrictEqual(base);
});

test('deleting a missing index remains a no-op with empty patches', () => {
  const base = [1, ,];
  const [state, patches, inverse] = create(
    base,
    (draft) => {
      delete draft[1];
      delete draft[9];
    },
    { enablePatches: true }
  );
  expect(state).toBe(base);
  expect(patches).toStrictEqual([]);
  expect(inverse).toStrictEqual([]);
});

test('per-index removal mode uses length patches only to grow sparse arrays', () => {
  const base = [1, , 2, ,];
  const [state, patches, inverse] = create(
    base,
    (draft) => {
      draft.splice(0, 2);
      draft.length = 5;
    },
    { enablePatches: { arrayLengthAssignment: false } }
  );
  for (const [input, steps] of [
    [base, patches],
    [state, inverse],
  ] as const) {
    const target = input.slice();
    for (const patch of steps) {
      if (patch.path[patch.path.length - 1] === 'length') {
        expect(patch.value).toBeGreaterThan(target.length);
      }
      apply(target, [patch], { mutable: true });
    }
  }
});

test('dense JSON arrays retain interoperable index patches', () => {
  const base = [1, 2, 3];
  const [state, patches, inverse] = create(
    base,
    (draft) => {
      draft.unshift(0);
      draft.splice(2, 2);
    },
    { enablePatches: { pathAsArray: false, arrayLengthAssignment: false } }
  );
  expect(
    jsonPatch.applyPatch(base.slice(), patches as any, true).newDocument
  ).toStrictEqual(state);
  expect(
    jsonPatch.applyPatch(state.slice(), inverse as any, true).newDocument
  ).toStrictEqual(base);
  expect(
    [...patches, ...inverse].some((patch) => patch.path.endsWith('/length'))
  ).toBe(false);
});

test('large gaps need patches only for lengths and present indices', () => {
  const [state, patches, inverse] = create(
    [] as number[],
    (draft) => {
      draft[100_000] = 1;
    },
    { enablePatches: true }
  );
  expect(patches.length).toBeLessThanOrEqual(3);
  expect(inverse.length).toBe(1);
  const replay = apply([], patches);
  expect(replay.length).toBe(state.length);
  expect(Object.keys(replay)).toStrictEqual(['100000']);
  expect(replay[100_000]).toBe(1);
  expect(apply(replay, inverse)).toStrictEqual([]);
});

test('rebuilds non-enumerable array indices too', () => {
  const base = new Array<number>(4);
  Object.defineProperty(base, '3', { value: 9, configurable: true });
  const [state, patches, inverse] = create(
    base,
    (draft) => {
      draft[0] = 1;
    },
    { enablePatches: true }
  );
  expect(apply(base, patches)).toStrictEqual(state);
  const restored = apply(state, inverse);
  expect(restored.length).toBe(4);
  expect(Object.hasOwn(restored, 0)).toBe(false);
  expect(Object.hasOwn(restored, 3)).toBe(true);
  expect(restored[3]).toBe(9);
});

test('restores indices but no custom properties named like numbers', () => {
  // A short suffix is checked index by index; across more than 65,536 holes,
  // own keys are enumerated, where only a key past that point would count.
  for (const length of [3, 70_000]) {
    const base: any[] = new Array(length);
    base[0] = 1;
    base[length - 1] = 9;
    const key = String(length - 1.5);
    (base as any)[key] = 'custom';
    const [state, patches, inverse] = create(
      base,
      (draft) => {
        draft[1] = 2;
      },
      { enablePatches: true }
    );
    expect(
      [...patches, ...inverse].some((patch) => patch.path.includes(Number(key)))
    ).toBe(false);
    expect(apply(base, patches)).toStrictEqual(state);
    const restored = apply(state, inverse);
    expect(restored.length).toBe(length);
    expect(Object.keys(restored)).toStrictEqual(['0', String(length - 1)]);
    expect(restored[length - 1]).toBe(9);
  }
});

test('filling a hole takes one patch, and its inverse patches rebuild', () => {
  const base = Array.from({ length: 10 }, (_, index) => ({ index }));
  delete base[0];
  const [state, patches, inverse] = create(
    base,
    (draft) => {
      draft[0] = { index: 0 };
    },
    { enablePatches: true }
  );
  expect(patches).toStrictEqual([
    { op: 'replace', path: [0], value: { index: 0 } },
  ]);
  // Shorten to the hole, lengthen again, and restore the nine elements.
  expect(inverse).toHaveLength(11);
  const replay = apply(base, patches);
  expect(replay).toStrictEqual(state);
  for (let index = 1; index < 10; index += 1) {
    expect(replay[index]).toBe(base[index]);
  }
  expect(apply(state, inverse)).toStrictEqual(base);
});

test('manual, async and nested producers preserve sparse patches', async () => {
  for (const enablePatches of modes) {
    const base = [1, ,];
    const [draft, finish] = create(base, { enablePatches });
    draft.unshift(0);
    const [state, patches, inverse] = finish();
    expect(apply(base, patches)).toStrictEqual(state);
    expect(apply(state, inverse)).toStrictEqual(base);
    const [asyncState, asyncPatches, asyncInverse] = await create(
      base,
      async (inner) => {
        await Promise.resolve();
        inner.unshift(0);
      },
      { enablePatches }
    );
    expect(apply(base, asyncPatches)).toStrictEqual(asyncState);
    expect(apply(asyncState, asyncInverse)).toStrictEqual(base);
    expect(
      create({ list: base }, (outer) => {
        const [next, forward, backward] = create(
          outer.list,
          (inner) => {
            inner.unshift(0);
          },
          { enablePatches }
        );
        expect(apply(base, forward)).toStrictEqual(next);
        expect(apply(next, backward)).toStrictEqual(base);
        outer.list = next;
      })
    ).toStrictEqual({ list: state });
  }
});

test('array subclasses and marked arrays use the same sparse replay contract', () => {
  class Items extends Array<number | undefined> {}
  for (const mark of [undefined, () => 'immutable' as const]) {
    const base = new Items(3);
    base[0] = 1;
    const [state, patches, inverse] = create(
      base,
      (draft) => {
        draft.unshift(0);
        draft[2] = undefined;
      },
      { enablePatches: true, mark }
    );
    expect(state).toBeInstanceOf(Items);
    expect(apply(base, patches, { mark })).toStrictEqual(state);
    expect(apply(state, inverse, { mark })).toStrictEqual(base);
  }
});

test('random sparse edits preserve values, own indices and repeated undo/redo', () => {
  let seed = 0x54729;
  const random = (limit: number) => {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return (seed >>> 0) % limit;
  };
  const value = () =>
    [undefined, null, 0, -0, NaN, 1, 2, { value: 1 }][random(8)];
  for (let sample = 0; sample < 1500; sample += 1) {
    const base = Array.from({ length: random(8) }, value);
    for (let index = 0; index < base.length; index += 1) {
      if (random(3) === 0) delete base[index];
    }
    const before = structuredClone(base);
    const operations = Array.from({ length: 1 + random(8) }, () => ({
      code: random(14),
      a: random(9),
      b: random(9),
      value: value(),
    }));
    const recipe = (draft: any[]) => {
      for (const { code, a, b, value } of operations) {
        const item = structuredClone(value);
        switch (code) {
          case 0:
            delete draft[a];
            break;
          case 1:
            draft[a] = item;
            break;
          case 2:
            draft.length = a;
            break;
          case 3:
            draft.push(item);
            break;
          case 4:
            draft.pop();
            break;
          case 5:
            draft.shift();
            break;
          case 6:
            draft.unshift(item);
            break;
          case 7:
            draft.splice(a, b);
            break;
          case 8:
            draft.splice(a, b, item);
            break;
          case 9:
            draft.reverse();
            break;
          case 10:
            draft.sort();
            break;
          case 11:
            draft.fill(item, a, b);
            break;
          case 12:
            draft.copyWithin(a, b);
            break;
          case 13:
            if (draft[a] && typeof draft[a] === 'object') draft[a].value++;
            break;
        }
      }
    };
    // Native methods provide the oracle, with Mutative's documented delete
    // semantics: present indices become undefined, missing ones stay absent.
    const expected = structuredClone(base);
    recipe(
      new Proxy(expected, {
        deleteProperty(target, key) {
          if (Object.hasOwn(target, key)) (target as any)[key] = undefined;
          return true;
        },
      })
    );
    const [state, patches, inverse] = create(base, recipe, {
      enablePatches: modes[sample % modes.length],
      enableAutoFreeze: sample % 3 === 0,
    });
    const context = `sample ${sample}: ${JSON.stringify(operations)}`;
    expect(state, context).toStrictEqual(expected);
    expect(base, context).toStrictEqual(before);
    expect(create(structuredClone(before), recipe), context).toStrictEqual(
      state
    );
    const replay = apply(base, patches);
    expect(replay, context).toStrictEqual(state);
    expect(apply(state, inverse), context).toStrictEqual(before);
    expect(apply(replay, inverse), context).toStrictEqual(before);
    expect(apply(apply(replay, inverse), patches), context).toStrictEqual(
      state
    );
  }
});
