import assert from 'node:assert/strict';
import { median } from './report.mjs';

export function summarizeMemory(reports) {
  const groups = new Map();
  for (const { trial } of reports) {
    const key = JSON.stringify([
      trial.scenario,
      trial.autoFreeze,
      trial.enablePatches,
    ]);
    if (!groups.has(key))
      groups.set(key, {
        scenario: trial.scenario,
        autoFreeze: trial.autoFreeze,
        enablePatches: trial.enablePatches,
        operations: trial.operations,
        libraries: {},
      });
    const group = groups.get(key);
    (group.libraries[trial.library] ??= []).push(trial);
  }
  return [...groups.values()].map((group) => ({
    ...group,
    libraries: Object.fromEntries(
      Object.entries(group.libraries).map(([library, trials]) => {
        for (const trial of trials) {
          assert.deepEqual(trial.patchCounts, trials[0].patchCounts);
          for (const field of [
            'sampledAllocatedBytesPerIteration',
            'retainedHeapBytesPerIteration',
            'rssDeltaBytes',
            'gcAfterRetainMs',
          ])
            assert.ok(
              Number.isFinite(trial.memory[field]),
              `Missing memory statistic: ${field}`
            );
        }
        const stats = (field) => {
          const values = trials.map((trial) => trial.memory[field]);
          return {
            median: median(values),
            min: Math.min(...values),
            max: Math.max(...values),
          };
        };
        return [
          library,
          {
            runs: trials.length,
            allocatedBytesPerIteration: stats(
              'sampledAllocatedBytesPerIteration'
            ),
            retainedHeapBytesPerIteration: stats(
              'retainedHeapBytesPerIteration'
            ),
            batchEndHeapDeltaBytes: stats('batchEndHeapDeltaBytes'),
            rssDeltaBytes: stats('rssDeltaBytes'),
            gcAfterRetainMs: stats('gcAfterRetainMs'),
          },
        ];
      })
    ),
  }));
}

export function formatMemoryReport(report) {
  const first = report.runs[0];
  const lines = [
    '# Memory measurements',
    '',
    `Recorded: ${report.recordedAt}; ${report.runs.length} isolated worker processes. Candidate Mutative ${first.build.versions.mutative}, pinned v1 ${first.build.versions['mutative-v1']}, Immer ${first.build.versions.immer}; Node ${first.environment.node}, V8 ${first.environment.v8}, ${first.environment.cpu}.`,
    '',
    'Each worker owns one scenario/library/freeze/patch combination. Setup, validation, and five warmup calls precede measurement. Allocation sampling includes collected objects and profiler/loop overhead; estimates are not exact allocation counts. A separate unprofiled pass retains one result per iteration (the last producer tuple when patches are enabled). Retained heap is a signed post-GC delta per retained output. Small or negative deltas can be measurement noise. RSS is a batch-end snapshot delta, not peak RSS or per-operation allocation. Explicit GC duration is diagnostic, not producer latency.',
    '',
    `Iterations/pass: ${first.trial.memory.iterations}; allocation sampling interval: ${first.trial.memory.samplingInterval} bytes. Freeze on uses pre-frozen inputs. Patch application and serialization are excluded. Array-method plugins are disabled.`,
    '',
    '| Scenario | Library | Freeze | Patches | Allocated KiB/iteration (estimate) | Retained heap KiB/iteration | Batch RSS delta MiB | Explicit GC ms |',
    '| --- | --- | --- | --- | ---: | ---: | ---: | ---: |',
  ];
  for (const row of report.summary)
    for (const [library, stats] of Object.entries(row.libraries))
      lines.push(
        `| ${row.scenario} | ${library} | ${row.autoFreeze ? 'on' : 'off'} | ${row.enablePatches ? 'on' : 'off'} | ${(stats.allocatedBytesPerIteration.median / 1024).toFixed(3)} | ${(stats.retainedHeapBytesPerIteration.median / 1024).toFixed(3)} | ${(stats.rssDeltaBytes.median / 2 ** 20).toFixed(3)} | ${stats.gcAfterRetainMs.median.toFixed(3)} |`
      );
  lines.push(
    '',
    'Tables use medians across independent workers. JSON retains every snapshot, process range, source/production hashes, patch counts, and sampling count. Compare latency using the separate timing reports.',
    ''
  );
  return lines.join('\n');
}
