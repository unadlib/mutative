/* eslint-disable @typescript-eslint/no-explicit-any */
import { create, unsafe } from '../src';

// The optimized array methods must give the results of the proxy path, which
// a borrowed `Array.prototype` method always takes. Each case runs the same
// recipe twice, once through the draft's method and once through the
// borrowed method, and compares outcomes and states.
type Outcome = { result: string; state: string };

const describeValue = (value: unknown): string => {
  if (typeof value === 'number' && Object.is(value, -0)) return '-0';
  if (typeof value === 'number' && Number.isNaN(value)) return 'NaN';
  if (value instanceof Date) return 'Date';
  if (Array.isArray(value)) return `[${value.map(describeValue).join(',')}]`;
  if (typeof value === 'object' && value !== null) return JSON.stringify(value);
  return String(value);
};

function outcome(
  base: any,
  recipe: (draft: any) => unknown,
  options: Record<string, unknown>,
  wrap: (run: () => unknown) => unknown = (run) => run()
): Outcome {
  let result = '';
  let state: any;
  try {
    state = create(
      base,
      (draft: any) => {
        wrap(() => {
          try {
            const value = recipe(draft);
            result = value === draft.list ? 'self' : describeValue(value);
          } catch (error: any) {
            result = `throws ${error.name}: ${error.message}`;
          }
        });
      },
      options
    );
  } catch (error: any) {
    return { result, state: `create throws ${error.name}` };
  }
  return { result, state: describeValue(state.list) };
}

const searchFixture = (withDate: boolean) => {
  const item = { id: 1 };
  const other = { id: 2 };
  const list: any[] = [item, other, 7, NaN, -0, item];
  if (withDate) list.splice(3, 0, new Date(0));
  return { base: { list, shared: item }, item };
};

const needles: Record<string, (draft: any, item: object) => unknown> = {
  'an unread base object': (_draft, item) => item,
  'a base object read before': (draft, item) => {
    expect(draft.list[0]).not.toBe(item);
    return item;
  },
  "the array's own draft": (draft) => draft.list[0],
  'a draft through another path': (draft) => draft.shared,
  'an object assigned in the recipe': (draft) => {
    const value = { id: 9 };
    draft.list.push(value);
    return value;
  },
  'an absent object': () => ({ id: 1 }),
  'a primitive': () => 7,
  NaN: () => NaN,
  zero: () => 0,
};

const histories: Record<string, (draft: any) => void> = {
  'a fresh draft': () => {},
  'every element read': (draft) => {
    draft.list.forEach((value: unknown) => value);
  },
  'moves that restore the order': (draft) => {
    draft.list.reverse();
    draft.list.reverse();
  },
  'a reversed array': (draft) => {
    draft.list.reverse();
  },
  'a draft assigned into the array': (draft) => {
    draft.list[1] = draft.shared;
  },
};

const fromIndexes: unknown[][] = [
  [],
  [0],
  [-2],
  [10],
  [-10],
  ['1'],
  [undefined],
  [{ valueOf: () => 1 }],
];

const modes: Record<
  string,
  { options: Record<string, unknown>; wrap?: (run: () => unknown) => unknown }
> = {
  default: { options: {} },
  strict: { options: { strict: true } },
  'strict inside unsafe()': {
    options: { strict: true },
    wrap: (run) => unsafe(run),
  },
};

describe.each(['indexOf', 'lastIndexOf', 'includes'] as const)(
  '%s gives the results of the proxy path',
  (method) => {
    test.each(Object.keys(histories))('after %s', (history) => {
      const mismatches: string[] = [];
      for (const withDate of [false, true]) {
        for (const [needleName, needle] of Object.entries(needles)) {
          for (const args of fromIndexes) {
            for (const [modeName, mode] of Object.entries(modes)) {
              const run = (borrowed: boolean, options = mode.options) => {
                const { base, item } = searchFixture(withDate);
                return outcome(
                  base,
                  (draft) => {
                    histories[history](draft);
                    const value = needle(draft, item);
                    return borrowed
                      ? (Array.prototype[method] as Function).call(
                          draft.list,
                          value,
                          ...args
                        )
                      : draft.list[method](value, ...args);
                  },
                  options,
                  mode.wrap
                );
              };
              const optimized = run(false);
              const label = `${needleName}, fromIndex ${describeValue(args)}, ${modeName}${withDate ? ', with a Date' : ''}`;
              const expected = run(true);
              if (JSON.stringify(optimized) !== JSON.stringify(expected)) {
                mismatches.push(
                  `${label}: ${JSON.stringify(optimized)} vs proxy ${JSON.stringify(expected)}`
                );
              }
              if (modeName === 'default') {
                const marked = run(false, { mark: () => undefined });
                if (JSON.stringify(optimized) !== JSON.stringify(marked)) {
                  mismatches.push(
                    `${label}: ${JSON.stringify(optimized)} vs no-op mark ${JSON.stringify(marked)}`
                  );
                }
              }
            }
          }
        }
      }
      expect(mismatches).toStrictEqual([]);
    });
  }
);

test('indexOf finds what findIndex finds by reference', () => {
  // NaN is excluded: indexOf never finds it, while findIndex compares with ===.
  const comparable = Object.entries(needles).filter(([name]) => name !== 'NaN');
  for (const [, needle] of comparable) {
    for (const history of Object.values(histories)) {
      const results = [false, true].map((viaCallback) => {
        const { base, item } = searchFixture(false);
        return outcome(
          base,
          (draft) => {
            history(draft);
            const value = needle(draft, item);
            return viaCallback
              ? draft.list.findIndex((element: unknown) => element === value)
              : draft.list.indexOf(value);
          },
          {}
        );
      });
      expect(results[0]).toStrictEqual(results[1]);
    }
  }
});

describe('strict mode reads of non-draftable elements', () => {
  const calls: [string, unknown[]][] = [
    ['shift', []],
    ['unshift', [0]],
    ['unshift', []],
    ['splice', [1, 1]],
    ['splice', [0, 1, 'x']],
    ['splice', [1, 0, 'x']],
    ['splice', [2, 1, 'x', 'y']],
    ['reverse', []],
    ['sort', []],
    ['join', ['-']],
    ['indexOf', [2]],
    ['lastIndexOf', [1]],
    ['includes', [1]],
  ];
  const bases: Record<string, () => any[]> = {
    'a Date first': () => [new Date(0), 1, 2],
    'a Date in the middle': () => [1, new Date(0), 2],
    'a Date last': () => [1, 2, new Date(0)],
    'a Date in the middle of five': () => [1, 2, new Date(0), 3, 4],
    'plain objects only': () => [1, { id: 1 }, 2],
  };
  test.each(calls)(
    '%s(%j) fails or succeeds as through the proxy',
    (method, args) => {
      for (const [baseName, makeBase] of Object.entries(bases)) {
        for (const [modeName, mode] of Object.entries(modes)) {
          const run = (borrowed: boolean) =>
            outcome(
              { list: makeBase() },
              (draft) =>
                borrowed
                  ? (Array.prototype as any)[method].apply(draft.list, args)
                  : draft.list[method](...args),
              mode.options,
              mode.wrap
            );
          expect(
            { case: `${baseName}, ${modeName}`, outcome: run(false) },
            `${method} with ${baseName}, ${modeName}`
          ).toStrictEqual({
            case: `${baseName}, ${modeName}`,
            outcome: run(true),
          });
        }
      }
    }
  );
});
