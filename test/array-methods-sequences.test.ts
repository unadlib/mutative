import { isDeepStrictEqual } from 'node:util';
import { apply, create } from '../src';
import {
  arrayMethodOperations,
  makeArrayState,
  type ArrayState,
} from './immer-array-methods-cases';

// Runs the exhaustive audit of test/immer-array-methods.test.ts against
// Mutative: each of the 17 operations composed three times, with plain JS on
// a copy as the reference. Every sequence runs on the native array methods and
// on the proxy path, which a no-op `mark` selects, in each freeze mode. The
// comparisons use `isDeepStrictEqual`: with `expect`, the file took 1.6 times
// as long under coverage, where CI runs it.
const deepFreeze = <T>(value: T): T => {
  if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
  }
  return value;
};

describe.each([
  { enableAutoFreeze: false, preFrozen: false },
  { enableAutoFreeze: true, preFrozen: false },
  { enableAutoFreeze: false, preFrozen: true },
  { enableAutoFreeze: true, preFrozen: true },
])(
  'enableAutoFreeze=$enableAutoFreeze, preFrozen=$preFrozen',
  ({ enableAutoFreeze, preFrozen }) => {
    const makeBase = () =>
      preFrozen ? deepFreeze(makeArrayState()) : makeArrayState();

    test.each([
      { path: 'native', mark: undefined },
      { path: 'proxy', mark: () => undefined },
    ])(
      'all 4913 three-operation combinations on the $path path match plain JS and replay patches',
      ({ mark }) => {
        const failures: string[] = [];
        for (const first of arrayMethodOperations) {
          for (const second of arrayMethodOperations) {
            for (const third of arrayMethodOperations) {
              const recipe = (draft: ArrayState) => {
                first.recipe(draft);
                second.recipe(draft);
                third.recipe(draft);
              };
              const before = makeArrayState();
              const expected = structuredClone(before);
              recipe(expected);
              let passed = false;
              try {
                const base = makeBase();
                const [state, patches, inversePatches] = create(base, recipe, {
                  enablePatches: true,
                  enableAutoFreeze,
                  mark,
                });
                passed =
                  isDeepStrictEqual(base, before) &&
                  isDeepStrictEqual(state, expected) &&
                  // Enabling patches must not change the result.
                  isDeepStrictEqual(
                    create(makeBase(), recipe, { enableAutoFreeze, mark }),
                    expected
                  ) &&
                  isDeepStrictEqual(apply(base, patches), expected) &&
                  isDeepStrictEqual(apply(state, inversePatches), before);
              } catch {
                // A sequence that throws fails like one with a wrong result.
              }
              if (!passed) {
                failures.push(
                  `${first.name} -> ${second.name} -> ${third.name}`
                );
              }
            }
          }
        }
        expect(failures.length, failures.slice(0, 3).join('\n')).toBe(0);
      }
    );
  }
);
