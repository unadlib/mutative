import assert from 'node:assert/strict';
import { createRuntime } from './runtime.mjs';
import { prepareScenario } from './scenarios.mjs';
import { vanillaReducer } from './workloads.mjs';

function checkGraph(value, runtime, autoFreeze, seen = new Set()) {
  if (!value || typeof value !== 'object' || seen.has(value)) return;
  seen.add(value);
  assert.equal(runtime.isDraft(value), false, 'result must not contain drafts');
  assert.equal(
    Object.isFrozen(value),
    autoFreeze,
    'result freeze mode must match'
  );
  for (const child of Object.values(value))
    checkGraph(child, runtime, autoFreeze, seen);
}

export function validateScenarios(options, scenarios) {
  let checks = 0;
  for (const scenario of scenarios) {
    for (const autoFreeze of options.freezes) {
      for (const library of options.libraries) {
        const prepared = prepareScenario(
          options.config,
          scenario.name,
          autoFreeze
        );
        const baseSnapshot = structuredClone(prepared.base);
        const actionSnapshot = structuredClone(prepared.steps);
        const expected = prepared.execute(vanillaReducer, prepared.base);
        const runtime = createRuntime(library, autoFreeze);
        const result = prepared.execute(runtime.reducer, prepared.base);
        const label = `${scenario.name}/${library}/freeze=${autoFreeze}`;
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
        assert.deepEqual(
          prepared.execute(runtime.reducer, prepared.base),
          result,
          label
        );
        checks++;
      }
    }
  }
  return checks;
}
