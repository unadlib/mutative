import assert from 'node:assert/strict';
import test from 'node:test';
import { isFrozenValue } from './graph.mjs';
import {
  createScenarios,
  prepareScenario,
  supportsMode,
} from './scenarios.mjs';
import { DEFAULT_CONFIG } from './workloads.mjs';

const scenarios = createScenarios(DEFAULT_CONFIG);
const byName = (name) => scenarios.find((scenario) => scenario.name === name);

test('scenario names are unique and carry their requirements', () => {
  const names = scenarios.map(({ name }) => name);
  assert.equal(new Set(names).size, names.length);
  for (const scenario of scenarios) {
    assert.equal(
      scenario.mapSet,
      /^(map|set)-/.test(scenario.name),
      `${scenario.name} MapSet plugin`
    );
    assert.equal(
      scenario.kind === 'apply',
      scenario.name.startsWith('apply-'),
      `${scenario.name} kind`
    );
    assert.equal(
      typeof scenario.mark === 'function',
      scenario.name.startsWith('class-'),
      `${scenario.name} mark`
    );
  }
});

test('supportsMode limits the vanilla reducer and patch application', () => {
  const producer = byName('update');
  const apply = byName('apply-update-10pct');
  for (const library of ['mutative', 'mutative-v1', 'immer'])
    for (const autoFreeze of [false, true])
      for (const patches of [false, true]) {
        assert.equal(
          supportsMode(producer, library, autoFreeze, patches),
          true
        );
        assert.equal(
          supportsMode(apply, library, autoFreeze, patches),
          !patches
        );
      }
  for (const autoFreeze of [false, true])
    for (const patches of [false, true]) {
      assert.equal(
        supportsMode(producer, 'vanilla', autoFreeze, patches),
        !autoFreeze && !patches
      );
      assert.equal(supportsMode(apply, 'vanilla', autoFreeze, patches), false);
    }
});

test('prepared scenarios own fresh fixtures, frozen only on request', () => {
  const frozen = prepareScenario(DEFAULT_CONFIG, 'map-update', true);
  const unfrozen = prepareScenario(DEFAULT_CONFIG, 'map-update', false);
  assert.notEqual(frozen.base, unfrozen.base);
  assert.equal(isFrozenValue(frozen.base.map), true);
  assert.equal(Object.isFrozen(frozen.base.map.get(0).nested), true);
  assert.equal(Object.isFrozen(frozen.steps[0]), true);
  assert.equal(isFrozenValue(unfrozen.base.map), false);
  assert.equal(Object.isFrozen(unfrozen.steps[0]), false);
  assert.equal(unfrozen.base.map.size, DEFAULT_CONFIG.arraySize);
});
