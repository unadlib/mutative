import { apply, create } from '../src';
import {
  arrayMethodOperations,
  makeArrayState,
  type ArrayState,
} from './immer-array-methods-cases';

// Runs the exhaustive audit of test/immer-array-methods.test.ts against
// Mutative: each of the 17 operations composed three times, with plain JS on
// a copy as the reference. Every sequence runs on the native array methods and
// on the proxy path, which a no-op `mark` selects, in each freeze mode.
const deepFreeze = <T>(value: T): T => {
  if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
  }
  return value;
};

const paths = [
  ['native', undefined],
  ['proxy', () => undefined],
] as const;

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

    test('all 4913 three-operation combinations match plain JS and replay patches on both paths', () => {
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
            for (const [path, mark] of paths) {
              try {
                const base = makeBase();
                const [state, patches, inversePatches] = create(base, recipe, {
                  enablePatches: true,
                  enableAutoFreeze,
                  mark,
                });
                expect(base).toStrictEqual(before);
                expect(state).toStrictEqual(expected);
                // Enabling patches must not change the result.
                expect(
                  create(makeBase(), recipe, { enableAutoFreeze, mark })
                ).toStrictEqual(expected);
                expect(apply(base, patches)).toStrictEqual(expected);
                expect(apply(state, inversePatches)).toStrictEqual(before);
              } catch {
                failures.push(
                  `${path}: ${first.name} -> ${second.name} -> ${third.name}`
                );
              }
            }
          }
        }
      }
      expect(failures.length, failures.slice(0, 3).join('\n')).toBe(0);
    });
  }
);
