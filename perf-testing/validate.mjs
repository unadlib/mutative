import assert from 'node:assert/strict';
import { createRuntime } from './runtime.mjs';
import { prepareScenario } from './scenarios.mjs';
import { vanillaReducer } from './workloads.mjs';

function checkGraph(value, runtime, autoFreeze, seen = new Set()) {
  if (!value || typeof value !== 'object' || seen.has(value)) return;
  seen.add(value);
  assert.equal(runtime.isDraft(value), false, 'result must not contain drafts');
  if (autoFreeze !== undefined)
    assert.equal(
      Object.isFrozen(value),
      autoFreeze,
      'result freeze mode must match'
    );
  for (const child of Object.values(value))
    checkGraph(child, runtime, autoFreeze, seen);
}

// Independent plain-JavaScript replay, including own fields with undefined
// values in the RTKQ fixture. JSON serialization would lose those fields.
function replayPatches(base, patches) {
  let document = structuredClone(base);
  for (const patch of patches) {
    const { op, path } = patch;
    assert.ok(['add', 'remove', 'replace'].includes(op));
    assert.ok(Array.isArray(path), 'patch paths must be arrays');
    if (op !== 'remove') assert.ok(Object.hasOwn(patch, 'value'));
    if (!path.length) {
      assert.equal(op, 'replace');
      document = structuredClone(patch.value);
    } else {
      let parent = document;
      for (const key of path.slice(0, -1)) {
        assert.ok(parent && typeof parent === 'object');
        assert.ok(Object.hasOwn(parent, key), 'patch parent must exist');
        parent = parent[key];
      }
      assert.ok(parent && typeof parent === 'object');
      const key = path.at(-1);
      assert.ok(typeof key === 'string' || typeof key === 'number');
      if (Array.isArray(parent)) {
        const index = Number(key);
        assert.ok(Number.isSafeInteger(index) && index >= 0);
        assert.ok(
          index < parent.length || (op === 'add' && index === parent.length)
        );
        if (op === 'add') parent.splice(index, 0, structuredClone(patch.value));
        else if (op === 'remove') parent.splice(index, 1);
        else parent[index] = structuredClone(patch.value);
      } else {
        if (op !== 'add') assert.ok(Object.hasOwn(parent, key));
        if (op === 'remove') delete parent[key];
        else parent[key] = structuredClone(patch.value);
      }
    }
  }
  return document;
}

function validatePatchedSteps(prepared, runtime, autoFreeze, label) {
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
    const beforeSnapshot = structuredClone(before);
    const result = runtime.reducer(before, action);
    assert.ok(Array.isArray(result) && result.length === 3, label);
    const [next, forward, inverse] = result;
    checkGraph(next, runtime, autoFreeze);
    assert.ok(Array.isArray(forward) && Array.isArray(inverse), label);
    checkGraph(forward, runtime);
    checkGraph(inverse, runtime);
    const patchSnapshot = structuredClone([forward, inverse]);
    assert.deepEqual(next, expectedSteps[index], `${label}: step ${index}`);
    assert.deepEqual(before, beforeSnapshot, `${label}: step input unchanged`);
    assert.deepEqual(
      replayPatches(before, forward),
      next,
      `${label}: forward replay`
    );
    assert.deepEqual(
      replayPatches(next, inverse),
      beforeSnapshot,
      `${label}: inverse replay`
    );
    assert.deepEqual(
      runtime.applyPatches(before, forward),
      next,
      `${label}: native forward replay`
    );
    assert.deepEqual(
      runtime.applyPatches(next, inverse),
      beforeSnapshot,
      `${label}: native inverse replay`
    );
    assert.deepEqual(
      [forward, inverse],
      patchSnapshot,
      `${label}: patches unchanged`
    );
    assert.deepEqual(
      before,
      beforeSnapshot,
      `${label}: replay input unchanged`
    );
    patchCounts.forward += forward.length;
    patchCounts.inverse += inverse.length;
    state = next;
  }
  assert.ok(patchCounts.forward > 0 && patchCounts.inverse > 0, label);
  return { result: state, patchCounts };
}

export function validateScenarios(options, scenarios) {
  let checks = 0;
  const patchCounts = new Map();
  for (const scenario of scenarios) {
    for (const autoFreeze of options.freezes) {
      for (const enablePatches of options.patches) {
        for (const library of options.libraries) {
          const prepared = prepareScenario(
            options.config,
            scenario.name,
            autoFreeze
          );
          const baseSnapshot = structuredClone(prepared.base);
          const actionSnapshot = structuredClone(prepared.steps);
          const expected = prepared.execute(vanillaReducer, prepared.base);
          const runtime = createRuntime(library, autoFreeze, enablePatches);
          const label = `${scenario.name}/${library}/freeze=${autoFreeze}/patches=${enablePatches}`;
          const validated = enablePatches
            ? validatePatchedSteps(prepared, runtime, autoFreeze, label)
            : { result: prepared.execute(runtime.reducer, prepared.base) };
          const { result } = validated;
          if (enablePatches) patchCounts.set(label, validated.patchCounts);
          assert.deepEqual(
            result,
            expected,
            `${label}: immutable reference result`
          );
          assert.deepEqual(
            prepared.base,
            baseSnapshot,
            `${label}: input unchanged`
          );
          assert.deepEqual(
            prepared.steps,
            actionSnapshot,
            `${label}: actions unchanged`
          );
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
          const repeated = enablePatches
            ? prepared.executeWithPatches(
                runtime.reducer,
                prepared.base,
                () => {}
              )
            : prepared.execute(runtime.reducer, prepared.base);
          assert.deepEqual(repeated, result, label);
          checks++;
        }
      }
    }
  }
  return { checks, patchCounts };
}
