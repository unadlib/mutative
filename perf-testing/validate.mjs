import assert from 'node:assert/strict';
import {
  assertSameData,
  canonical,
  graphChildren,
  isFrozenValue,
  replayPatches,
} from './graph.mjs';
import { createRuntime } from './runtime.mjs';
import { prepareScenario, supportsMode } from './scenarios.mjs';
import { vanillaReducer } from './workloads.mjs';
import { expectedReads } from './additional-workloads.mjs';

function checkGraph(value, runtime, autoFreeze, seen = new Set()) {
  if (!value || typeof value !== 'object' || seen.has(value)) return;
  seen.add(value);
  assert.equal(runtime.isDraft(value), false, 'result must not contain drafts');
  if (autoFreeze !== undefined)
    assert.equal(
      isFrozenValue(value),
      autoFreeze,
      'result freeze mode must match'
    );
  for (const child of graphChildren(value))
    checkGraph(child, runtime, autoFreeze, seen);
}

// Map and Set results need the canonical view: Mutative's frozen collections
// carry enumerable mutators, and only an ordered view checks their order.
// Other graphs compare directly, as deepStrictEqual already checks prototypes.
const comparator = (scenario) =>
  scenario.mapSet
    ? assertSameData
    : (actual, expected, message) =>
        assert.deepEqual(actual, expected, message);

function validatePatchedSteps(prepared, runtime, autoFreeze, label) {
  const same = comparator(prepared);
  // Build the entire oracle before production so a mutation cannot contaminate it.
  const expectedSteps = [];
  let reference = prepared.base;
  for (const action of prepared.steps) {
    reference = vanillaReducer(reference, action);
    expectedSteps.push(reference);
  }
  let state = prepared.base;
  const patchCounts = { forward: 0, inverse: 0 };
  for (const [index, action] of prepared.steps.entries()) {
    const before = state;
    const beforeSnapshot = canonical(before);
    const result = runtime.reducer(before, action);
    assert.ok(Array.isArray(result) && result.length === 3, label);
    const [next, forward, inverse] = result;
    checkGraph(next, runtime, autoFreeze);
    assert.ok(Array.isArray(forward) && Array.isArray(inverse), label);
    checkGraph(forward, runtime);
    checkGraph(inverse, runtime);
    const patchSnapshot = canonical([forward, inverse]);
    same(next, expectedSteps[index], `${label}: step ${index}`);
    if (
      expectedSteps[index] ===
      (index ? expectedSteps[index - 1] : prepared.base)
    ) {
      assert.equal(next, before, `${label}: unchanged state identity`);
      assert.equal(forward.length, 0, `${label}: no forward patches for no-op`);
      assert.equal(inverse.length, 0, `${label}: no inverse patches for no-op`);
    }
    same(before, beforeSnapshot, `${label}: step input unchanged`);
    // Replays compare Map and Set contents without their order: a Set patch
    // adds at the end, wherever the value was.
    same(
      replayPatches(before, forward),
      next,
      `${label}: forward replay`,
      false
    );
    same(
      replayPatches(next, inverse),
      beforeSnapshot,
      `${label}: inverse replay`,
      false
    );
    same(
      runtime.applyPatches(before, forward),
      next,
      `${label}: native forward replay`,
      false
    );
    same(
      runtime.applyPatches(next, inverse),
      beforeSnapshot,
      `${label}: native inverse replay`,
      false
    );
    same([forward, inverse], patchSnapshot, `${label}: patches unchanged`);
    same(before, beforeSnapshot, `${label}: replay input unchanged`);
    patchCounts.forward += forward.length;
    patchCounts.inverse += inverse.length;
    state = next;
  }
  if (state !== prepared.base)
    assert.ok(patchCounts.forward > 0 && patchCounts.inverse > 0, label);
  return { result: state, patchCounts };
}

export function validateScenarios(options, scenarios) {
  let checks = 0;
  const patchCounts = new Map();
  for (const scenario of scenarios) {
    for (const autoFreeze of options.freezes) {
      for (const enablePatches of options.patches) {
        for (const library of options.libraries.filter((name) =>
          supportsMode(scenario, name, autoFreeze, enablePatches)
        )) {
          const prepared = prepareScenario(
            options.config,
            scenario.name,
            autoFreeze
          );
          const same = comparator(prepared);
          const baseSnapshot = canonical(prepared.base);
          const actionSnapshot = canonical(prepared.steps);
          const expected = prepared.execute(vanillaReducer, prepared.base);
          const reads = [];
          let reference = prepared.base;
          const expectedReadValues = prepared.steps.flatMap((action) => {
            const values = expectedReads(reference, action);
            reference = vanillaReducer(reference, action);
            return values;
          });
          const runtime = createRuntime(
            library,
            autoFreeze,
            enablePatches,
            (value) => reads.push(value),
            options.immerArrayMethods === true,
            prepared
          );
          const label = `${scenario.name}/${library}/freeze=${autoFreeze}/patches=${enablePatches}`;
          const validated = enablePatches
            ? validatePatchedSteps(prepared, runtime, autoFreeze, label)
            : { result: prepared.execute(runtime.reducer, prepared.base) };
          const { result } = validated;
          assert.deepEqual(reads, expectedReadValues, `${label}: read results`);
          if (enablePatches) patchCounts.set(label, validated.patchCounts);
          same(result, expected, `${label}: immutable reference result`);
          same(prepared.base, baseSnapshot, `${label}: input unchanged`);
          same(prepared.steps, actionSnapshot, `${label}: actions unchanged`);
          if (expected === prepared.base)
            assert.equal(result, prepared.base, `${label}: unchanged identity`);
          else
            assert.notEqual(
              result,
              prepared.base,
              `${label}: scenario must update state`
            );
          // Unchanged root branches must remain shared, not be deep-cloned.
          for (const key of Object.keys(prepared.base)) {
            if (expected[key] === prepared.base[key]) {
              assert.equal(
                result[key],
                prepared.base[key],
                `${label}: shared ${key}`
              );
            }
          }
          checkGraph(result, runtime, autoFreeze);
          checkGraph(prepared.base, runtime, autoFreeze);
          checkGraph(prepared.steps, runtime, autoFreeze);
          // Resetting a sample to the same immutable base must be repeatable.
          reads.length = 0;
          const repeated = enablePatches
            ? prepared.executeWithPatches(
                runtime.reducer,
                prepared.base,
                () => {}
              )
            : prepared.execute(runtime.reducer, prepared.base);
          same(repeated, result, label);
          assert.deepEqual(
            reads,
            expectedReadValues,
            `${label}: repeatable reads`
          );
          checks++;
        }
      }
    }
  }
  return { checks, patchCounts };
}
