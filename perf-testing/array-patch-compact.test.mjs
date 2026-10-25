import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createContext,
  makeBase,
  makeOptions,
  markdownPath,
  median,
  SCENARIOS,
  summarize,
} from './array-patch-compact.mjs';

test('markdown reports never overwrite the JSON output', () => {
  assert.equal(markdownPath('/tmp/report.json'), '/tmp/report.md');
  assert.equal(markdownPath('/tmp/report'), '/tmp/report.md');
});

test('compact benchmark scenarios are unique and cover hits, fallbacks and controls', () => {
  const names = SCENARIOS.map(({ name }) => name);
  assert.equal(new Set(names).size, names.length);
  assert.ok(SCENARIOS.some(({ compactPatches }) => compactPatches === 1));
  assert.ok(
    SCENARIOS.some(({ compactPatches }) => typeof compactPatches === 'function')
  );
  for (const name of [
    'disjoint-insert-plan',
    'nested-edit-after-shift',
    'reverse-fallback',
    'sort-fallback',
    'append-control',
    'local-edit-control',
  ]) {
    assert.equal(
      SCENARIOS.find((scenario) => scenario.name === name).fallback,
      true,
      name
    );
  }
});

test('scenario fixtures produce independent deterministic native results', () => {
  for (const scenario of SCENARIOS) {
    const base = makeBase(scenario.name, 40);
    const other = makeBase(scenario.name, 40);
    assert.deepStrictEqual(base, other, scenario.name);
    assert.notEqual(base, other, scenario.name);
    assert.ok(base.every((item, index) => item !== other[index]));
    const context = createContext(40, 8);
    const expected = structuredClone(base);
    scenario.mutate(expected, context);
    assert.notDeepStrictEqual(expected, base, scenario.name);
    assert.equal(base.length, 40, scenario.name);
  }
  assert.deepStrictEqual(
    makeBase('sort-fallback', 40).map(({ id }) => id),
    makeBase('sort-fallback', 40).map(({ id }) => id)
  );
});

test('benchmark options select only the requested implementation', () => {
  const index = makeOptions('index', false);
  assert.deepStrictEqual(index, {
    enableAutoFreeze: false,
    enablePatches: {
      pathAsArray: false,
      arrayLengthAssignment: false,
    },
  });
  assert.equal(
    makeOptions('compact', true).enablePatches.arrayPatchStrategy,
    'compact'
  );
  assert.equal(makeOptions('prototype', false).enablePatches.arraySplice, true);
  assert.equal(makeOptions('compact', true).enableAutoFreeze, true);
  assert.throws(() => makeOptions('unknown', false));
});

test('frozen fixtures pre-freeze bases and insertion payloads', () => {
  const context = createContext(40, 8, true);
  for (const value of [
    context,
    context.one,
    context.one[0],
    context.batch,
    context.batch[0],
    context.first[0],
    context.second[0],
  ]) {
    assert.equal(Object.isFrozen(value), true);
  }
});

test('summaries use process medians and reject inconsistent patch counts', () => {
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([4, 1, 3, 2]), 2.5);
  assert.throws(() => median([Number.NaN]), /finite/);
  const fixture = (createMs, forwardPatches = 1) => ({
    scenario: 'shift',
    strategy: 'compact',
    autoFreeze: false,
    scenarioClass: 'contiguous',
    forwardPatches,
    inversePatches: 1,
    forwardBytes: 20,
    inverseBytes: 40,
    retainedReferences: 9999,
    retainedReferenceRatio: 0.9999,
    createMs,
    applyMs: 0.02,
    inverseApplyMs: 0.02,
    stringifyParseApplyMs: 0.03,
    retainedHeapBytesPerOutput: 100,
    processMaxRssBytes: 1000,
  });
  const rows = summarize([fixture(3), fixture(1), fixture(2)]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].runs, 3);
  assert.equal(rows[0].createMs, 2);
  assert.throws(() => summarize([fixture(1), fixture(2, 2)]), /forwardPatches/);
});
