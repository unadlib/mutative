/* eslint-disable @typescript-eslint/no-explicit-any */
import { isDeepStrictEqual } from 'node:util';
import { apply, create, isDraft, original, unsafe } from '../src';

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

    const insertBaseElement = (wrap: (callback: () => void) => void) => {
      const base = [{ id: 1 }, { id: 2 }];
      const item = base[1];
      const seen: unknown[] = [];
      const { state, patches, inversePatches } = run(base, (draft) =>
        wrap(() => {
          draft.unshift(item);
          seen.push(
            draft[0] === item,
            isDraft(draft[0]),
            draft.indexOf(item),
            draft.lastIndexOf(item),
            draft.includes(item),
            draft.shift() === item
          );
        })
      );
      expect(seen).toEqual([true, false, 0, 0, true, true]);
      expect(state).toEqual([{ id: 1 }, { id: 2 }]);
      expect(state[0]).toBe(base[0]);
      expect(state[1]).toBe(base[1]);
      expect(apply(base, patches)).toEqual(state);
      expect(apply(state, inversePatches)).toEqual([{ id: 1 }, { id: 2 }]);
    };

    test('an inserted element of the base state keeps its identity after the array moved', () => {
      insertBaseElement((callback) => callback());
    });

    // In strict mode, `unsafe()` runs the native methods on arrays of objects
    // as well.
    test('an inserted element of the base state keeps its identity after the array moved inside unsafe()', () => {
      insertBaseElement(unsafe);
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

// Every sequence of three of these operations runs natively and on the proxy
// path. Shrinking, growing again, moving, inserting elements of the base
// state, reading, searching and editing drafts must give the same reads,
// search results, removed values and final state, by value and by identity,
// leave the base state unchanged, and produce patches that replay in both
// directions.
type Operation = [
  name: string,
  run: (list: any[], context: Context, step: number) => unknown,
];
interface Context {
  base: any[];
  make: (label: string) => unknown;
  seen: string[];
  describe: (value: unknown) => string;
}

const sequenceOperations: Operation[] = [
  ['pop', (list) => list.pop()],
  ['shift', (list) => list.shift()],
  ['splice out', (list) => list.splice(1, 2)],
  ['shrink', (list) => (list.length = Math.max(list.length - 2, 0))],
  ['grow', (list) => (list.length += 2)],
  [
    'assign past the end',
    (list, { make }, step) => (list[list.length + 1] = make(`past${step}`)),
  ],
  ['delete', (list) => delete list[1]],
  ['push', (list, { make }, step) => list.push(make(`push${step}`))],
  ['unshift', (list, { make }, step) => list.unshift(make(`unshift${step}`))],
  ['splice in', (list, { make }, step) => list.splice(1, 0, make(`in${step}`))],
  [
    'splice over',
    (list, { make }, step) => list.splice(0, 1, make(`over${step}`)),
  ],
  ['reverse', (list) => list.reverse()],
  [
    'sort',
    (list) =>
      list.sort(
        (a, b) =>
          (typeof b === 'object' ? b.id : b) -
          (typeof a === 'object' ? a.id : a)
      ),
  ],
  ['unshift base', (list, { base }) => list.unshift(base[1])],
  ['splice in base', (list, { base }) => list.splice(1, 0, base[3])],
  ['splice over base', (list, { base }) => list.splice(0, 1, base[3])],
  ['push base', (list, { base }) => list.push(base[0])],
  ['assign base', (list, { base }) => (list[0] = base[2])],
  [
    'edit',
    (list) => {
      for (const index of [0, list.length - 1]) {
        const value = list[index];
        if (isDraft(value)) value.value += 1;
      }
    },
  ],
  [
    'read and search',
    (list, { base, seen, describe }) => {
      seen.push(Array.from(list, describe).join());
      for (const value of base) {
        seen.push(
          `${list.indexOf(value)} ${list.lastIndexOf(value)} ${list.includes(value)}`
        );
      }
    },
  ],
];
const readAndSearch = sequenceOperations[sequenceOperations.length - 1][1];

const sequenceConfigurations = [
  { fixture: 'objects', enableAutoFreeze: false, nested: false, frozen: false },
  { fixture: 'objects', enableAutoFreeze: true, nested: false, frozen: true },
  { fixture: 'objects', enableAutoFreeze: false, nested: true, frozen: false },
  {
    fixture: 'primitives',
    enableAutoFreeze: false,
    nested: false,
    frozen: false,
  },
] as const;

describe.each(sequenceConfigurations)(
  'sequences of three operations on $fixture, enableAutoFreeze=$enableAutoFreeze, nested=$nested, frozen=$frozen',
  ({ fixture, enableAutoFreeze, nested, frozen }) => {
    const runSequence = (
      operations: Operation[],
      mark: (() => undefined) | undefined
    ) => {
      const elements: any[] =
        fixture === 'objects'
          ? Array.from({ length: 4 }, (_, id) => ({ id, value: 0 }))
          : [0, 1, 2, 3];
      const base: any = nested
        ? { list: elements, other: { id: -1 } }
        : elements;
      const before = structuredClone(base);
      if (frozen) deepFreeze(base);
      const listOf = (value: any): any[] => (nested ? value.list : value);
      const made = new Map<unknown, string>();
      let next = 100;
      const describeRaw = (value: unknown): string => {
        if (typeof value !== 'object' || value === null) return String(value);
        const index = elements.indexOf(value);
        if (index !== -1) return `base${index}`;
        return made.get(value) ?? `copy${JSON.stringify(value)}`;
      };
      const seen: string[] = [];
      const context: Context = {
        base: elements,
        seen,
        make: (label) => {
          if (fixture === 'primitives') return (next += 1);
          const value = { id: (next += 1), value: 0 };
          made.set(value, label);
          return value;
        },
        describe: (value) =>
          isDraft(value)
            ? `draft(${describeRaw(original(value))})`
            : describeRaw(value),
      };
      const recipe = (draft: any) => {
        const list = listOf(draft);
        operations.forEach(([, operation], step) => {
          const result = operation(list, context, step);
          // Describing the array itself would read, and draft, every element.
          seen.push(
            result === list
              ? 'self'
              : Array.isArray(result)
                ? `[${result.map(context.describe).join()}]`
                : context.describe(result)
          );
        });
        readAndSearch(list, context, operations.length);
      };
      const [state, patches, inversePatches] = create(base, recipe, {
        enablePatches: true,
        enableAutoFreeze,
        mark,
      });
      const list = listOf(state);
      const observed = {
        seen: [...seen],
        identity: Array.from(list, describeRaw),
      };
      const failures: string[] = [];
      if (!isDeepStrictEqual(base, before)) failures.push('base changed');
      if (
        !isDeepStrictEqual(
          replayed(listOf(apply(base, patches))),
          Array.from(list)
        )
      )
        failures.push('forward patches');
      if (
        !isDeepStrictEqual(
          replayed(listOf(apply(state, inversePatches))),
          listOf(before)
        )
      )
        failures.push('inverse patches');
      if (nested && state.other !== base.other) failures.push('sharing');
      // Enabling patches must not change the result.
      next = 100;
      seen.length = 0;
      if (
        !isDeepStrictEqual(
          create(base, recipe, { enableAutoFreeze, mark }),
          state
        )
      )
        failures.push('result without patches');
      return { failures, ...observed, state: list };
    };

    test.each(sequenceOperations.map(([name]) => name))(
      'starting with %s, match the proxy path and replay their patches',
      (firstName) => {
        const first = sequenceOperations.find(([name]) => name === firstName)!;
        const failures: string[] = [];
        for (const second of sequenceOperations) {
          for (const third of sequenceOperations) {
            const operations = [first, second, third];
            const name = operations.map(([name]) => name).join(' -> ');
            const native = runSequence(operations, undefined);
            const proxy = runSequence(operations, () => undefined);
            const problems = [
              ...native.failures.map((failure) => `native ${failure}`),
              ...proxy.failures.map((failure) => `proxy ${failure}`),
            ];
            if (!isDeepStrictEqual(native.seen, proxy.seen))
              problems.push('reads, searches or removed values');
            if (!isDeepStrictEqual(native.state, proxy.state))
              problems.push('state');
            if (!isDeepStrictEqual(native.identity, proxy.identity))
              problems.push('identity');
            if (problems.length) failures.push(`${name}: ${problems.join()}`);
          }
        }
        expect(failures.length, failures.slice(0, 5).join('\n')).toBe(0);
      }
    );
  }
);
