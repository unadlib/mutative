import {
  createActions,
  createInitialState,
  getValidId,
  getValidIndex,
  rtkqPending,
  rtkqResolved,
} from './workloads.mjs';
import { createAdditionalScenarios } from './additional-workloads.mjs';
import { deepFreeze } from './graph.mjs';

// Shared by benchmarks, correctness validation, and CPU profiling.
export function createScenarios(config, filter = '.*') {
  const actions = createActions(config);
  const scenario = (name, steps, createBase = createInitialState) => ({
    name,
    steps,
    createBase,
    operations: steps.length,
    execute(reducer, base) {
      let state = base;
      for (const action of steps) state = reducer(state, action);
      return state;
    },
    executeWithPatches(reducer, base, consume) {
      let state = base;
      for (const action of steps) {
        const result = reducer(state, action);
        consume(result);
        state = result[0];
      }
      return state;
    },
  });
  const scenarios = Object.entries(actions).map(([name, action]) =>
    // The upstream filter(0) discarded everything. Exercise 50% retention.
    scenario(name, [action(name === 'filter' ? 0.5 : 0)])
  );
  scenarios.push(
    ...createAdditionalScenarios(config).map((entry) =>
      scenario(entry.name, entry.steps, entry.createBase)
    )
  );
  for (const name of [
    'update',
    'update-high',
    'remove',
    'remove-high',
    'update-largeObject1',
    'update-largeObject2',
  ]) {
    scenarios.push(
      scenario(
        `${name}-reuse`,
        Array.from({ length: config.reuseStateIterations }, (_, i) =>
          actions[name](i)
        )
      )
    );
  }
  scenarios.push(
    scenario('mixed-sequence', [
      actions.add(1),
      actions.update(getValidId(config.arraySize)),
      actions['update-high'](2),
      actions['update-multiple'](3),
      actions.remove(getValidIndex(config.arraySize)),
    ]),
    scenario('rtkq-sequence', [
      ...Array.from({ length: config.rtkqCount }, (_, i) => rtkqPending(i)),
      ...Array.from({ length: config.rtkqCount }, (_, i) => rtkqResolved(i)),
    ])
  );
  const pattern = new RegExp(filter);
  const selected = scenarios.filter(({ name }) => pattern.test(name));
  if (!selected.length) throw new Error(`No scenarios match ${filter}`);
  return selected;
}

export function prepareScenario(config, name, autoFreeze) {
  // Each trial gets its own graph and payloads; freezing never leaks to another.
  const scenario = createScenarios(config).find((entry) => entry.name === name);
  if (!scenario) throw new Error(`Unknown scenario: ${name}`);
  const base = scenario.createBase(config);
  if (autoFreeze) {
    deepFreeze(base);
    deepFreeze(scenario.steps);
  }
  return { ...scenario, base };
}
