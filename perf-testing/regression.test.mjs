import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { evaluateBudgets } from './regression.mjs';

function fixture() {
  const policy = {
    schemaVersion: 1,
    immerVersion: '11.1.18',
    v1Version: '1.3.0',
    mitataVersion: '1.0.34',
    minimumRetainedSamples: 9,
    arraySize: 1000,
    latencyRuns: 5,
    memoryRuns: 3,
    memoryIterations: 16,
    samplingInterval: 1024,
    freezes: [false, true],
    patches: [false, true],
    latencyScenarios: ['example'],
    memoryScenarios: ['example'],
    latency: { maxRatio: 1.3, minimumDeltaNs: 500 },
    allocation: { maxRatio: 1.35, minimumDeltaBytes: 8192 },
    retainedHeap: { maxRatio: 1.35, minimumDeltaBytes: 1024 },
  };
  const build = {
    versions: { immer: '11.1.18', 'mutative-v1': '1.3.0', mitata: '1.0.34' },
    arrayMethodsEnabled: false,
    mutativeSourceSha256: 'a'.repeat(64),
    productionInputs: Object.fromEntries(
      ['mutative', 'mutative-v1', 'immer'].map((name) => [
        name,
        { sha256: 'b'.repeat(64) },
      ])
    ),
  };
  const environment = {
    node: 'v24.16.0',
    v8: 'test-v8',
    cpu: 'test-cpu',
    platform: 'linux',
    arch: 'x64',
  };
  const config = { arraySize: 1000 };
  const trials = policy.freezes.flatMap((autoFreeze) =>
    policy.patches.map((enablePatches) => ({
      scenario: 'example',
      library: 'mutative',
      autoFreeze,
      enablePatches,
      operations: 1,
      ...(enablePatches && { patchCounts: { forward: 1, inverse: 1 } }),
      stats: { avg: 10000, sampleCount: 100 },
      memory: {
        iterations: 16,
        samplingInterval: 1024,
        sampledAllocatedBytesPerIteration: 100000,
        retainedHeapBytesPerIteration: 20000,
      },
    }))
  );
  const latency = {
    build,
    environment,
    config,
    methodology: {
      arrayMethodsEnabled: false,
      heapSampling: false,
      patchApplicationTimed: false,
      patchSerializationTimed: false,
    },
    trials,
  };
  const memory = trials.map((trial) => ({
    build,
    environment,
    config,
    kind: 'memory',
    methodology: {
      arrayMethodsEnabled: false,
      latencyMeasured: false,
      allocationIncludesCollectedObjects: true,
      retainedHeapBaseline: 'post-GC heap after releasing the output holder',
    },
    trial,
  }));
  return structuredClone({
    policy,
    latencyPairs: Array.from({ length: 5 }, (_, index) => ({
      index,
      base: structuredClone(latency),
      candidate: structuredClone(latency),
    })),
    memoryPairs: Array.from({ length: 3 }, (_, index) => ({
      index,
      base: structuredClone(memory),
      candidate: structuredClone(memory),
    })),
  });
}

test('complete paired controls pass while one candidate process stays fast', () => {
  const report = fixture();
  report.latencyPairs[0].candidate.trials[0].stats.avg = 1000000;
  for (const pair of report.latencyPairs.slice(2))
    pair.candidate.trials[0].stats.avg *= 1.4;
  const evaluation = evaluateBudgets(report);
  assert.equal(evaluation.status, 'passed');
  assert.equal(evaluation.results.length, 12);
});

test('latency regressions fail while sub-floor absolute changes remain tolerated', () => {
  const report = fixture();
  for (const pair of report.latencyPairs)
    pair.candidate.trials[0].stats.avg *= 1.6;
  assert.equal(evaluateBudgets(report).status, 'failed');
  for (const pair of report.latencyPairs.slice(1))
    pair.base.trials[0].stats.avg *= 1.6;
  assert.equal(evaluateBudgets(report).status, 'failed');
  for (const pair of report.latencyPairs) {
    pair.base.trials[0].stats.avg = 100;
    pair.candidate.trials[0].stats.avg = 200;
  }
  assert.equal(evaluateBudgets(report).status, 'passed');
});

test('allocation and retained-heap regressions independently fail', () => {
  for (const metric of [
    'sampledAllocatedBytesPerIteration',
    'retainedHeapBytesPerIteration',
  ]) {
    const report = fixture();
    for (const pair of report.memoryPairs)
      pair.candidate[0].trial.memory[metric] *= 2;
    assert.equal(evaluateBudgets(report).status, 'failed');
  }
});

test('Mitata outlier trimming leaves nine valid retained samples', () => {
  const report = fixture();
  for (const pair of report.latencyPairs)
    for (const role of ['base', 'candidate'])
      for (const trial of pair[role].trials) trial.stats.sampleCount = 9;
  assert.equal(evaluateBudgets(report).status, 'passed');
  report.latencyPairs[0].candidate.trials[0].stats.sampleCount = 8;
  assert.throws(() => evaluateBudgets(report));
});

for (const [name, corrupt] of [
  [
    'missing mode',
    (report) => {
      report.latencyPairs[0].candidate.trials.pop();
    },
  ],
  [
    'duplicate trial',
    (report) => {
      report.latencyPairs[0].candidate.trials[1] =
        report.latencyPairs[0].candidate.trials[0];
    },
  ],
  [
    'missing pair',
    (report) => {
      report.latencyPairs.pop();
    },
  ],
  [
    'invalid timing',
    (report) => {
      report.latencyPairs[0].candidate.trials[0].stats.avg = NaN;
    },
  ],
  [
    'insufficient samples',
    (report) => {
      report.latencyPairs[0].candidate.trials[0].stats.sampleCount = 0;
    },
  ],
  [
    'changed runtime',
    (report) => {
      report.latencyPairs[0].candidate.environment.node = 'v22';
    },
  ],
  [
    'changed fixture',
    (report) => {
      report.latencyPairs[0].candidate.config.arraySize = 10;
    },
  ],
  [
    'changed artifact',
    (report) => {
      report.latencyPairs[1].candidate.build.productionInputs.mutative.sha256 =
        'c'.repeat(64);
    },
  ],
  [
    'unpinned Immer',
    (report) => {
      report.latencyPairs[0].candidate.build.versions.immer = '12';
    },
  ],
  [
    'array-method plugin enabled',
    (report) => {
      report.latencyPairs[0].candidate.methodology.arrayMethodsEnabled = true;
    },
  ],
  [
    'missing memory statistic',
    (report) => {
      delete report.memoryPairs[0].candidate[0].trial.memory
        .sampledAllocatedBytesPerIteration;
    },
  ],
  [
    'ambiguous retained heap baseline',
    (report) => {
      delete report.memoryPairs[0].candidate[0].methodology
        .retainedHeapBaseline;
    },
  ],
  [
    'changed patch count',
    (report) => {
      report.latencyPairs[0].candidate.trials[1].patchCounts.forward = 2;
    },
  ],
])
  test(`invalid evidence fails closed: ${name}`, () => {
    const report = fixture();
    corrupt(report);
    assert.throws(() => evaluateBudgets(report));
  });

test('budget CLI exits nonzero for a real regression', () => {
  const directory = mkdtempSync(join(tmpdir(), 'mutative-budget-'));
  try {
    const report = fixture();
    for (const pair of report.latencyPairs)
      pair.candidate.trials[0].stats.avg *= 2;
    const filename = join(directory, 'report.json');
    writeFileSync(filename, JSON.stringify(report));
    const child = spawnSync(
      process.execPath,
      ['perf-testing/check-budgets.mjs', filename],
      { encoding: 'utf8' }
    );
    assert.equal(child.status, 1);
    assert.match(child.stdout, /regressed/);
  } finally {
    rmSync(directory, { recursive: true });
  }
});
