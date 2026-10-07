/* eslint-disable @typescript-eslint/no-explicit-any */
import { apply, create, isDraft, original } from '../src';

// Two kinds of bookkeeping of array drafts must survive the native array
// methods: the indices whose contents may differ from the original array,
// which patches compare, and the values the recipe assigned, which a read hands
// out as they are wherever native methods moved them. A no-op `mark` sends
// every array method through the proxy path, the reference for identity.

const deepFreeze = <T>(value: T): T => {
  if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
  }
  return value;
};

// Holes replay as `undefined`, a limitation shared with Mutative 1.3.0.
const replayed = (value: unknown) =>
  Array.isArray(value) ? Array.from(value) : value;

const configurations = [false, true].flatMap((enableAutoFreeze) =>
  [false, true].flatMap((strict) =>
    [true, false].flatMap((pathAsArray) =>
      [true, false].flatMap((arrayLengthAssignment) =>
        [false, true].map((frozen) => ({
          enableAutoFreeze,
          strict,
          pathAsArray,
          arrayLengthAssignment,
          frozen,
        }))
      )
    )
  )
);

describe.each(configurations)(
  'enableAutoFreeze=$enableAutoFreeze, strict=$strict, pathAsArray=$pathAsArray, arrayLengthAssignment=$arrayLengthAssignment, frozen=$frozen',
  ({
    enableAutoFreeze,
    strict,
    pathAsArray,
    arrayLengthAssignment,
    frozen,
  }) => {
    const run = <T>(base: T, recipe: (draft: any) => void) => {
      const before = structuredClone(base);
      const value = frozen ? deepFreeze(base) : base;
      const [state, patches, inversePatches] = create(value, recipe, {
        enableAutoFreeze,
        strict,
        enablePatches: { pathAsArray, arrayLengthAssignment },
      });
      expect(value).toEqual(before);
      return { state: state as any, patches, inversePatches, base: value };
    };

    test('patches remove an element that a shorter array exposes again after a move', () => {
      const { state, patches, inversePatches, base } = run(
        [1, 2, 3],
        (draft) => {
          draft.pop();
          draft.reverse();
          draft.length = 3;
        }
      );
      expect(Array.from(state)).toEqual([2, 1, undefined]);
      expect(2 in state).toBe(false);
      expect(replayed(apply(base, patches))).toEqual([2, 1, undefined]);
      expect(replayed(apply(state, inversePatches))).toEqual([1, 2, 3]);
    });

    test('patches restore elements that the length removed and exposed again', () => {
      const { state, patches, inversePatches, base } = run(
        ['a', 'b', 'c', 'd'],
        (draft) => {
          draft.length = 1;
          draft.length = 3;
        }
      );
      expect(Array.from(state)).toEqual(['a', undefined, undefined]);
      expect(replayed(apply(base, patches))).toEqual([
        'a',
        undefined,
        undefined,
      ]);
      expect(apply(state, inversePatches)).toEqual(['a', 'b', 'c', 'd']);
    });

    test('an inserted element of the base state keeps its identity after the array moved', () => {
      const base = [{ id: 1 }, { id: 2 }];
      const item = base[1];
      const seen: unknown[] = [];
      const { state, patches, inversePatches } = run(base, (draft) => {
        draft.unshift(item);
        seen.push(
          draft[0] === item,
          isDraft(draft[0]),
          draft.indexOf(item),
          draft.lastIndexOf(item),
          draft.includes(item),
          draft.shift() === item
        );
      });
      expect(seen).toEqual([true, false, 0, 0, true, true]);
      expect(state).toEqual([{ id: 1 }, { id: 2 }]);
      expect(state[0]).toBe(base[0]);
      expect(state[1]).toBe(base[1]);
      expect(apply(base, patches)).toEqual(state);
      expect(apply(state, inversePatches)).toEqual([{ id: 1 }, { id: 2 }]);
    });
  }
);

describe('elements of the base state inserted into a moved array', () => {
  type Item = { id: number; value: number };
  const items = (): Item[] =>
    Array.from({ length: 4 }, (_, id) => ({ id, value: 0 }));

  // Runs `recipe` natively and on the proxy path, and checks that both read,
  // search, remove and finalize the same values, that the base state is
  // unchanged, and that the patches replay in both directions.
  const check = (
    recipe: (draft: Item[], base: Item[], seen: unknown[]) => void
  ) => {
    const results = [undefined, () => undefined].map((mark) => {
      const base = items();
      const before = structuredClone(base);
      const seen: unknown[] = [];
      const [state, patches, inversePatches] = create(
        base,
        (draft) => recipe(draft, base, seen),
        { enablePatches: true, mark }
      );
      expect(base).toEqual(before);
      expect(apply(base, patches)).toEqual(state);
      expect(apply(state, inversePatches)).toEqual(before);
      const identity = state.map((value: Item) => base.indexOf(value));
      return { seen, state, identity };
    });
    expect(results[0].seen).toEqual(results[1].seen);
    expect(results[0].state).toEqual(results[1].state);
    expect(results[0].identity).toEqual(results[1].identity);
    return results[0];
  };

  const describeRead = (value: unknown, base: Item[]) =>
    isDraft(value)
      ? `draft of ${base.indexOf(original(value as Item))}`
      : `base ${base.indexOf(value as Item)}`;

  test('splice inserts an element of the base state as it is', () => {
    const { seen, identity } = check((draft, base, seen) => {
      draft.splice(1, 0, base[3]);
      seen.push(
        describeRead(draft[1], base),
        draft.indexOf(base[3]),
        draft.lastIndexOf(base[3]),
        draft.includes(base[3]),
        describeRead(draft.splice(1, 1)[0], base)
      );
      draft.splice(2, 0, base[0]);
      seen.push(describeRead(draft[2], base), draft.indexOf(base[0]));
    });
    expect(seen).toEqual(['base 3', 1, 1, true, 'base 3', 'base 0', 2]);
    expect(identity).toEqual([0, 1, 0, 2, 3]);
  });

  test('push after reverse appends an element of the base state as it is', () => {
    const { seen, identity } = check((draft, base, seen) => {
      draft.reverse();
      draft.push(base[0]);
      seen.push(
        describeRead(draft[4], base),
        describeRead(draft[3], base),
        draft.indexOf(base[0]),
        draft.lastIndexOf(base[0]),
        describeRead(draft.pop(), base)
      );
    });
    expect(seen).toEqual(['base 0', 'draft of 0', 4, 4, 'base 0']);
    expect(identity).toEqual([3, 2, 1, 0]);
  });

  test('an assigned element of the base state keeps its identity through several moves', () => {
    const { seen, state } = check((draft, base, seen) => {
      draft.reverse();
      draft[1] = base[3];
      draft.unshift({ id: 9, value: 0 });
      draft.reverse();
      draft.splice(0, 1);
      seen.push(
        draft.map((value) => describeRead(value, base)).join(),
        draft.indexOf(base[3]),
        draft.lastIndexOf(base[3])
      );
      draft[0].value += 1;
    });
    expect(seen).toEqual(['draft of 1,base 3,draft of 3,base -1', 1, 1]);
    expect(state).toEqual([
      { id: 1, value: 1 },
      { id: 3, value: 0 },
      { id: 3, value: 0 },
      { id: 9, value: 0 },
    ]);
  });

  test('an object that an index accessor of the base array returns is read as it is after a move', () => {
    const reads = [undefined, () => undefined].map((mark) => {
      const base: any[] = [{ id: 0 }, { id: 1 }];
      Object.defineProperty(base, 2, {
        configurable: true,
        enumerable: true,
        get: () => ({ id: 2 }),
      });
      let read: any;
      create(
        base,
        (draft) => {
          draft.reverse();
          read = draft[0];
        },
        { mark }
      );
      return [isDraft(read), read.id];
    });
    expect(reads).toEqual([
      [false, 2],
      [false, 2],
    ]);
  });

  // Without a real move, the native methods leave the array as the proxy
  // path does, so these controls held before moves were tracked as well.
  test.each([
    [
      'a reverse of one element',
      (draft: Item[], base: Item[]) => {
        draft.length = 1;
        draft[0] = base[2];
        draft.reverse();
      },
    ],
    [
      'a palindrome reverse',
      (draft: Item[], base: Item[]) => {
        draft[0] = base[1];
        draft[1] = base[0];
        draft[2] = base[0];
        draft[3] = base[1];
        draft.reverse();
      },
    ],
    [
      'a splice that replaces an element with itself',
      (draft: Item[], base: Item[]) => {
        draft[0] = base[3];
        draft.splice(0, 1, base[3]);
      },
    ],
  ])('%s keeps an assigned element of the base state', (_, prepare) => {
    const { seen } = check((draft, base, seen) => {
      prepare(draft, base);
      seen.push(
        describeRead(draft[0], base),
        draft.indexOf(base[0]),
        draft.includes(base[draft.length > 1 ? 3 : 2])
      );
    });
    expect(seen[0]).toMatch(/^base [123]$/);
  });

  test('a reverse that pairs an assigned element with its unread twin moves both', () => {
    const { seen } = check((draft, base, seen) => {
      draft[0] = base[3];
      draft[1] = base[2];
      draft.reverse();
      seen.push(
        draft.map((value) => describeRead(value, base)).join(),
        draft.indexOf(base[3]),
        draft.includes(base[2])
      );
    });
    expect(seen).toEqual([
      'draft of 3,draft of 2,draft of 2,draft of 3',
      -1,
      false,
    ]);
  });

  test('assigning an element of the base state where a move placed it records the assignment', () => {
    const { seen } = check((draft, base, seen) => {
      draft.reverse();
      draft[0] = base[3];
      seen.push(
        describeRead(draft[0], base),
        draft.indexOf(base[3]),
        describeRead(draft.shift(), base)
      );
    });
    expect(seen).toEqual(['base 3', 0, 'base 3']);
  });

  test('an inserted element of the base state that a move places at its original index is drafted from then on', () => {
    const { seen } = check((draft, base, seen) => {
      draft.unshift(base[1]);
      draft.unshift({ id: 9, value: 0 });
      draft.shift();
      seen.push(
        draft.map((value) => describeRead(value, base)).join(),
        draft.indexOf(base[1])
      );
    });
    expect(seen).toEqual([
      'draft of 1,draft of 0,draft of 1,draft of 2,draft of 3',
      -1,
    ]);
  });
});
