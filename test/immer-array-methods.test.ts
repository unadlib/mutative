import jsonPatch, { type Operation } from 'fast-json-patch';
import type { Immer, Patch } from 'immer';
import { apply, create } from '../src';
import {
  arrayMethodCases,
  arrayMethodOperations,
  makeArrayState,
  type ArrayState,
} from './immer-array-methods-cases';

// Disable expected-failure handling to run the original correctness assertions.
const reproduce = process.env.IMMER_ARRAY_METHODS_REPRO === '1';
const contractTest = (knownFailure: boolean) =>
  knownFailure && !reproduce ? test.fails : test;

function replayJson<T>(base: T, patches: Patch[]): T {
  const operations: Operation[] = patches.map((patch) => {
    const path = patch.path.length
      ? `/${patch.path
          .map((key) => String(key).replace(/~/g, '~0').replace(/\//g, '~1'))
          .join('/')}`
      : '';
    if (patch.op === 'remove') return { op: 'remove', path };
    if (patch.op === 'add') return { op: 'add', path, value: patch.value };
    return { op: 'replace', path, value: patch.value };
  });
  // These fixtures use JSON values only. An independent validating consumer
  // distinguishes invalid generated patches from a bug in Immer's applyPatches.
  return jsonPatch.applyPatch(
    structuredClone(base),
    JSON.parse(JSON.stringify(operations)),
    true
  ).newDocument;
}

describe.each([false, true])('enableArrayMethods = %s', (optimized) => {
  let immer: typeof import('immer');

  beforeAll(async () => {
    // Plugins are module-global and cannot be disabled by constructing a new
    // Immer instance. Reset the module before loading each configuration.
    vi.resetModules();
    immer = await import('immer');
    immer.enablePatches();
    if (optimized) immer.enableArrayMethods();
  });

  test('root array: producing the edited shifted tail preserves the base', () => {
    const producer = new immer.Immer({ autoFreeze: false });
    const base = [{ value: 0 }, { value: 1 }];
    const [state] = producer.produceWithPatches(base, (draft) => {
      draft.unshift({ value: 9 });
      draft[2].value++;
    });
    expect(base).toStrictEqual([{ value: 0 }, { value: 1 }]);
    expect(state).toStrictEqual([{ value: 9 }, { value: 0 }, { value: 2 }]);
  });

  contractTest(optimized)(
    'root array: forward patches replay the edited shifted tail',
    () => {
      const producer = new immer.Immer({ autoFreeze: false });
      const base = [{ value: 0 }, { value: 1 }];
      const [state, patches] = producer.produceWithPatches(base, (draft) => {
        draft.unshift({ value: 9 });
        draft[2].value++;
      });
      expect(producer.applyPatches(base, patches)).toStrictEqual(state);
    }
  );

  contractTest(optimized)(
    'all 4913 three-operation combinations preserve state and replay patches',
    () => {
      const producer = new immer.Immer({ autoFreeze: false });
      const failures: string[] = [];
      for (const first of arrayMethodOperations) {
        for (const second of arrayMethodOperations) {
          for (const third of arrayMethodOperations) {
            const recipe = (draft: ArrayState) => {
              first.recipe(draft);
              second.recipe(draft);
              third.recipe(draft);
            };
            const base = makeArrayState();
            const before = structuredClone(base);
            const expected = structuredClone(base);
            recipe(expected);
            try {
              const [state, patches, inversePatches] =
                producer.produceWithPatches(base, recipe);
              expect(base).toStrictEqual(before);
              expect(state).toStrictEqual(expected);
              expect(producer.applyPatches(before, patches)).toStrictEqual(
                expected
              );
              expect(
                producer.applyPatches(state, inversePatches)
              ).toStrictEqual(before);
            } catch {
              failures.push(`${first.name} -> ${second.name} -> ${third.name}`);
            }
          }
        }
      }
      expect(failures.length, failures.slice(0, 3).join('\n')).toBe(0);
    }
  );

  describe.each([
    { autoFreeze: false, preFrozen: false },
    { autoFreeze: true, preFrozen: false },
    { autoFreeze: false, preFrozen: true },
    { autoFreeze: true, preFrozen: true },
  ])(
    'autoFreeze=$autoFreeze, preFrozen=$preFrozen',
    ({ autoFreeze, preFrozen }) => {
      let producer: Immer;

      beforeAll(() => {
        producer = new immer.Immer({ autoFreeze });
      });

      describe.each(arrayMethodCases)('$name', ({ recipe, failure }) => {
        let base: ArrayState;
        let before: ArrayState;
        let expected: ArrayState;
        let produced: readonly [ArrayState, Patch[], Patch[]] | undefined;
        let produceError: unknown;

        const corruptsBase =
          optimized &&
          (failure === 'raw-return' || failure === 'stale-assignment');
        const rejectsRecipe = corruptsBase && preFrozen;
        const unfinalized = optimized && failure === 'unfinalized-value';
        const invalidForward =
          optimized && (failure === 'patch-order' || unfinalized);

        beforeAll(() => {
          base = makeArrayState();
          // Capture both oracles BEFORE Immer runs; cloning a corrupted base
          // afterwards can make broken inverse patches appear correct.
          before = structuredClone(base);
          expected = structuredClone(base);
          recipe(expected);
          if (preFrozen) immer.freeze(base, true);
          try {
            produced = producer.produceWithPatches(base, recipe);
          } catch (error) {
            produceError = error;
          }
        });

        const result = () => {
          if (!produced) throw produceError;
          return produced;
        };

        contractTest(rejectsRecipe)('accepts the recipe', () => {
          expect(() => result()).not.toThrow();
        });

        contractTest(corruptsBase || unfinalized)(
          'produce without patches preserves the base and finalizes the result',
          () => {
            const plainBase = structuredClone(before);
            if (preFrozen) immer.freeze(plainBase, true);
            const state = producer.produce(plainBase, recipe);
            expect(plainBase).toStrictEqual(before);
            expect(state).toStrictEqual(expected);
            expect(() => JSON.stringify(state)).not.toThrow();
          }
        );

        if (rejectsRecipe) {
          test('the rejected write targets a frozen base object', () => {
            expect(produceError).toBeInstanceOf(TypeError);
            expect(String(produceError)).toMatch(/read.only property/);
            expect(base).toStrictEqual(before);
          });
        } else {
          contractTest(corruptsBase)('preserves the original base', () => {
            result();
            expect(base).toStrictEqual(before);
          });

          contractTest(unfinalized)(
            'matches the native mutation result',
            () => {
              expect(result()[0]).toStrictEqual(expected);
            }
          );

          contractTest(unfinalized)(
            'finalizes state and patch values for serialization',
            () => {
              expect(() => JSON.stringify(result())).not.toThrow();
            }
          );

          contractTest(invalidForward)(
            'Immer forward patches replay the result',
            () => {
              const [, patches] = result();
              expect(producer.applyPatches(before, patches)).toStrictEqual(
                expected
              );
            }
          );

          contractTest(invalidForward)(
            'JSON forward patches replay the result',
            () => {
              const [, patches] = result();
              expect(replayJson(before, patches)).toStrictEqual(expected);
            }
          );

          contractTest(corruptsBase)(
            'Immer inverse patches recover the original base',
            () => {
              const [state, , inversePatches] = result();
              expect(
                producer.applyPatches(state, inversePatches)
              ).toStrictEqual(before);
            }
          );

          contractTest(corruptsBase)(
            'JSON inverse patches recover the original base',
            () => {
              const [, , inversePatches] = result();
              // Use the native expected result so inverse patch values are checked
              // independently from an unfinalized Immer result.
              expect(replayJson(expected, inversePatches)).toStrictEqual(
                before
              );
            }
          );

          if (optimized && failure === 'patch-order') {
            test('forward replay fails before the shifted tail exists', () => {
              const [, patches] = result();
              expect(() => producer.applyPatches(before, patches)).toThrow(
                /path doesn't resolve|minified error nr: 18/
              );
            });
          }

          if (unfinalized) {
            test('the returned state contains a revoked nested draft', () => {
              expect(() => JSON.stringify(result()[0])).toThrow(/revoked/);
            });
          }
        }

        test('Mutative preserves the base and replays both patch directions', () => {
          const mutativeBase = structuredClone(before);
          if (preFrozen) immer.freeze(mutativeBase, true);
          const [state, patches, inversePatches] = create(
            mutativeBase,
            recipe,
            {
              enablePatches: true,
              enableAutoFreeze: autoFreeze,
            }
          );
          expect(mutativeBase).toStrictEqual(before);
          expect(state).toStrictEqual(expected);
          expect(apply(mutativeBase, patches)).toStrictEqual(expected);
          expect(apply(state, inversePatches)).toStrictEqual(before);
          expect(() =>
            JSON.stringify([state, patches, inversePatches])
          ).not.toThrow();
        });
      });
    }
  );
});
