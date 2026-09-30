import assert from 'node:assert/strict';
import { median } from './report.mjs';

const keyOf = (trial) =>
  JSON.stringify([trial.scenario, trial.autoFreeze, trial.enablePatches]);
const finite = (value, name, minimum = 0) =>
  assert.ok(Number.isFinite(value) && value >= minimum, `Invalid ${name}`);

function validateBuild(report, policy) {
  assert.equal(
    report.build.versions.immer,
    policy.immerVersion,
    'Immer must remain pinned'
  );
  assert.equal(
    report.build.versions['mutative-v1'],
    policy.v1Version,
    'v1 must remain pinned'
  );
  assert.equal(report.build.arrayMethodsEnabled, false);
  assert.equal(
    report.build.versions.mitata,
    policy.mitataVersion,
    'Mitata sampling rules must remain pinned'
  );
  for (const library of ['mutative', 'mutative-v1', 'immer'])
    assert.match(
      report.build.productionInputs[library].sha256,
      /^[a-f0-9]{64}$/
    );
  assert.match(report.build.mutativeSourceSha256, /^[a-f0-9]{64}$/);
  for (const field of ['node', 'v8', 'cpu', 'platform', 'arch'])
    assert.ok(
      typeof report.environment[field] === 'string' &&
        report.environment[field].length,
      `Missing environment ${field}`
    );
  assert.equal(report.config.arraySize, policy.arraySize);
}

function trialMap(reports, kind, policy) {
  const scenarios =
    kind === 'latency' ? policy.latencyScenarios : policy.memoryScenarios;
  const expected = new Set(
    scenarios.flatMap((scenario) =>
      policy.freezes.flatMap((autoFreeze) =>
        policy.patches.map((enablePatches) =>
          keyOf({ scenario, autoFreeze, enablePatches })
        )
      )
    )
  );
  const map = new Map();
  for (const report of reports) {
    validateBuild(report, policy);
    assert.equal(report.methodology.arrayMethodsEnabled, false);
    if (kind === 'latency') {
      assert.equal(report.methodology.heapSampling, false);
      assert.equal(report.methodology.patchApplicationTimed, false);
      assert.equal(report.methodology.patchSerializationTimed, false);
    } else {
      assert.equal(report.kind, 'memory');
      assert.equal(report.methodology.latencyMeasured, false);
      assert.equal(report.methodology.allocationIncludesCollectedObjects, true);
      assert.equal(
        report.methodology.retainedHeapBaseline,
        'post-GC heap after releasing the output holder'
      );
    }
    for (const trial of kind === 'latency' ? report.trials : [report.trial]) {
      assert.equal(
        trial.library,
        'mutative',
        'CI compares candidate artifacts, not unrelated library controls'
      );
      const key = keyOf(trial);
      assert.ok(expected.has(key), `Unexpected ${kind} trial ${key}`);
      assert.ok(!map.has(key), `Duplicate ${kind} trial ${key}`);
      finite(trial.operations, 'producer-call count', 1);
      if (trial.enablePatches) {
        finite(trial.patchCounts?.forward, 'forward patch count');
        finite(trial.patchCounts?.inverse, 'inverse patch count');
      }
      if (kind === 'latency') {
        finite(trial.stats.avg, 'mean time', Number.MIN_VALUE);
        // Mitata 1.0.34 collects >=12 raw samples, then trims two at each end
        // when there are >12: the smallest valid retained count is 13 - 4 = 9.
        finite(
          trial.stats.sampleCount,
          'retained sample count',
          policy.minimumRetainedSamples
        );
        assert.ok(Number.isSafeInteger(trial.stats.sampleCount));
      } else {
        assert.equal(trial.memory.iterations, policy.memoryIterations);
        assert.equal(trial.memory.samplingInterval, policy.samplingInterval);
        finite(
          trial.memory.sampledAllocatedBytesPerIteration,
          'allocation estimate'
        );
        assert.ok(
          Number.isFinite(trial.memory.retainedHeapBytesPerIteration),
          'Invalid retained heap'
        );
      }
      map.set(key, { trial, report });
    }
  }
  assert.equal(map.size, expected.size, `Incomplete ${kind} matrix`);
  return map;
}

function compareValues(values, budget, label) {
  const ratios = values.map(({ base, candidate }) =>
    base > 0 ? candidate / base : null
  );
  const validRatios = ratios.filter((value) => value !== null);
  const medianRatio = validRatios.length ? median(validRatios) : null;
  const medianDelta = median(
    values.map((value) => value.candidate - value.base)
  );
  const baseMedian = median(values.map((value) => value.base));
  const candidateMedian = median(values.map((value) => value.candidate));
  const failed =
    medianDelta > budget.minimumDelta &&
    (medianRatio === null || medianRatio > budget.maxRatio);
  return {
    label,
    status: failed ? 'regressed' : 'passed',
    baseMedian,
    candidateMedian,
    medianRatio,
    medianDelta,
    maxRatio: budget.maxRatio,
    minimumDelta: budget.minimumDelta,
    pairs: values.map((value, i) => ({ ...value, ratio: ratios[i] })),
  };
}

export function evaluateBudgets(report) {
  const policy = report.policy;
  assert.equal(policy.schemaVersion, 1);
  assert.ok(
    policy.latencyRuns >= 5 && policy.memoryRuns >= 3,
    'Budgets require at least five timing and three memory pairs'
  );
  for (const field of [
    'latencyScenarios',
    'memoryScenarios',
    'freezes',
    'patches',
  ])
    assert.ok(Array.isArray(policy[field]) && policy[field].length);
  for (const field of ['latencyScenarios', 'memoryScenarios'])
    assert.equal(new Set(policy[field]).size, policy[field].length);
  assert.deepEqual(policy.freezes, [false, true]);
  assert.ok(
    Number.isSafeInteger(policy.minimumRetainedSamples) &&
      policy.minimumRetainedSamples >= 9
  );
  assert.deepEqual(policy.patches, [false, true]);
  for (const field of ['latency', 'allocation', 'retainedHeap'])
    finite(policy[field].maxRatio, 'budget ratio', 1);
  finite(policy.latency.minimumDeltaNs, 'latency noise floor');
  finite(policy.allocation.minimumDeltaBytes, 'allocation noise floor');
  finite(policy.retainedHeap.minimumDeltaBytes, 'retained heap noise floor');
  assert.equal(report.latencyPairs.length, policy.latencyRuns);
  assert.equal(report.memoryPairs.length, policy.memoryRuns);
  const results = [];
  const identities = new Map();
  for (const kind of ['latency', 'memory']) {
    const valuesByKey = new Map();
    for (const [index, pair] of report[`${kind}Pairs`].entries()) {
      assert.equal(pair.index, index, 'Pairs must be complete and ordered');
      const maps = Object.fromEntries(
        ['base', 'candidate'].map((role) => [
          role,
          trialMap(
            kind === 'latency' ? [pair[role]] : pair[role],
            kind,
            policy
          ),
        ])
      );
      for (const [key, base] of maps.base) {
        const candidate = maps.candidate.get(key);
        assert.deepEqual(
          candidate.report.environment,
          base.report.environment,
          'Pairs require the same runtime and host'
        );
        assert.deepEqual(
          candidate.report.config,
          base.report.config,
          'Pairs require identical fixtures'
        );
        assert.deepEqual(
          candidate.trial.patchCounts,
          base.trial.patchCounts,
          'Patch operation counts must match'
        );
        for (const [role, entry] of [
          ['base', base],
          ['candidate', candidate],
        ]) {
          const identity = {
            source: entry.report.build.mutativeSourceSha256,
            inputs: entry.report.build.productionInputs,
          };
          if (identities.has(role))
            assert.deepEqual(
              identity,
              identities.get(role),
              'Artifact identities must be stable across all pairs and metrics'
            );
          else identities.set(role, identity);
        }
        if (!valuesByKey.has(key)) valuesByKey.set(key, []);
        valuesByKey
          .get(key)
          .push({ base: base.trial, candidate: candidate.trial });
      }
    }
    for (const [key, pairs] of valuesByKey) {
      if (kind === 'latency')
        results.push(
          compareValues(
            pairs.map((pair) => ({
              base: pair.base.stats.avg,
              candidate: pair.candidate.stats.avg,
            })),
            {
              maxRatio: policy.latency.maxRatio,
              minimumDelta: policy.latency.minimumDeltaNs,
            },
            `latency/${key}`
          )
        );
      else
        for (const [metric, field, budget] of [
          [
            'allocation',
            'sampledAllocatedBytesPerIteration',
            policy.allocation,
          ],
          [
            'retainedHeap',
            'retainedHeapBytesPerIteration',
            policy.retainedHeap,
          ],
        ])
          results.push(
            compareValues(
              pairs.map((pair) => ({
                base: pair.base.memory[field],
                candidate: pair.candidate.memory[field],
              })),
              {
                maxRatio: budget.maxRatio,
                minimumDelta: budget.minimumDeltaBytes,
              },
              `${metric}/${key}`
            )
          );
    }
  }
  return {
    status: results.some((result) => result.status === 'regressed')
      ? 'failed'
      : 'passed',
    results,
  };
}

export function formatBudgetReport(evaluation) {
  return [
    '# Performance regression budgets',
    '',
    `Status: **${evaluation.status}**. Each row uses paired candidate/base ratios and deltas; a regression exceeds both the relative budget and the absolute noise floor.`,
    '',
    '| Metric / scenario / freeze / patches | Base median | Candidate median | Paired median ratio | Allowed ratio | Median delta | Noise floor | Status |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |',
    ...evaluation.results.map(
      (row) =>
        `| ${row.label} | ${row.baseMedian.toFixed(2)} | ${row.candidateMedian.toFixed(2)} | ${row.medianRatio?.toFixed(3) ?? '—'} | ${row.maxRatio.toFixed(2)} | ${row.medianDelta.toFixed(2)} | ${row.minimumDelta} | ${row.status} |`
    ),
    '',
    'Latency values are ns per scenario. Allocation and retained-heap values are bytes per scenario output. JSON retains all individual pairs. Signed retained-heap estimates near zero require the absolute floor; RSS snapshots are recorded but not gated.',
    '',
  ].join('\n');
}
