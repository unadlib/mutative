import assert from 'node:assert/strict';

export function compactStats(measured) {
  const { samples, ...stats } = measured;
  delete stats.debug;
  return { ...stats, sampleCount: samples?.length ?? measured.sampleCount };
}

export function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function summarize(reports) {
  const groups = new Map();
  for (const report of reports) {
    for (const trial of report.trials) {
      const patches =
        trial.enablePatches ?? report.methodology.patchesEnabled ?? false;
      const key = JSON.stringify([trial.scenario, trial.autoFreeze, patches]);
      if (!groups.has(key)) {
        groups.set(key, {
          scenario: trial.scenario,
          autoFreeze: trial.autoFreeze,
          ...(Object.hasOwn(trial, 'enablePatches') && {
            enablePatches: patches,
          }),
          operations: trial.operations,
          libraries: {},
        });
      }
      const group = groups.get(key);
      if (Object.hasOwn(trial, 'enablePatches')) group.enablePatches = patches;
      (group.libraries[trial.library] ??= []).push(trial);
    }
  }
  return [...groups.values()].map((group) => {
    const libraries = Object.fromEntries(
      Object.entries(group.libraries).map(([name, trials]) => {
        const samples = trials.map((trial) => trial.stats);
        for (const trial of trials)
          assert.deepEqual(
            trial.patchCounts,
            trials[0].patchCounts,
            'Patch counts must match across processes'
          );
        return [
          name,
          {
            runs: samples.length,
            medianMeanNs: median(samples.map((stats) => stats.avg)),
            minMeanNs: Math.min(...samples.map((stats) => stats.avg)),
            maxMeanNs: Math.max(...samples.map((stats) => stats.avg)),
            medianP50Ns: median(samples.map((stats) => stats.p50)),
            medianP99Ns: median(samples.map((stats) => stats.p99)),
            ...(trials[0].patchCounts && {
              patchCounts: trials[0].patchCounts,
            }),
          },
        ];
      })
    );
    return {
      ...group,
      libraries,
      immerOverMutative:
        libraries.immer && libraries.mutative
          ? libraries.immer.medianMeanNs / libraries.mutative.medianMeanNs
          : null,
      ...(libraries['mutative-v1'] && {
        v1OverCandidate: libraries.mutative
          ? libraries['mutative-v1'].medianMeanNs /
            libraries.mutative.medianMeanNs
          : null,
      }),
      ...(libraries.vanilla && {
        vanillaOverCandidate: libraries.mutative
          ? libraries.vanilla.medianMeanNs / libraries.mutative.medianMeanNs
          : null,
      }),
    };
  });
}

const pluginNote = (report) =>
  `${
    report.runs[0].methodology?.arrayMethodsEnabled
      ? "Immer's array-method plugin is enabled; Mutative's native array methods need no option."
      : 'Array-method plugins are disabled.'
  }${
    report.runs.some((run) => run.methodology?.immerMapSetEnabled)
      ? " Immer's MapSet plugin is enabled only in the processes that run Map and Set scenarios."
      : ''
  }`;

// Map and Set scenarios run in processes of their own within each run.
const runCount = (report) =>
  new Set(report.runs.map((run) => run.runIndex ?? 0)).size;

export function formatReport(report) {
  if (
    report.summary.some(
      (entry) => entry.libraries['mutative-v1'] || entry.libraries.vanilla
    )
  ) {
    return formatVersionedReport(report);
  }
  const first = report.runs[0];
  const lines = [
    '# Mutative vs Immer workload benchmarks',
    '',
    `Recorded: ${report.recordedAt}. ${runCount(report)} runs in ${report.runs.length} independent Node processes; median of each process's mean time.`,
    '',
    `Local Mutative **${first.build.versions.mutative}** at \`${first.build.gitRevision}\`; installed Immer **${first.build.versions.immer}**; Mitata **${first.build.versions.mitata}**.`,
    '',
    `Environment: ${first.environment.cpu}, ${(first.environment.memoryBytes / 2 ** 30).toFixed(0)} GiB RAM, ${first.environment.platform}/${first.environment.arch}, Node ${first.environment.node}, V8 ${first.environment.v8}.`,
    '',
    `Fixture: array ${first.config.arraySize}, ${first.config.nestedArraySize} nested items/row, objects with ${first.config.largeObjectSize1}/${first.config.largeObjectSize2} properties; reuse ${first.config.reuseStateIterations} calls; RTKQ ${first.config.rtkqCount} pending + ${first.config.rtkqCount} resolved calls.`,
    '',
    `Both libraries use production artifacts. ${pluginNote(report)} Freeze off uses unfrozen inputs; freeze on uses pre-frozen inputs and payloads. Construction, configuration, and correctness checks are outside timing. Each iteration resets to its immutable base and evolves it only within that scenario.`,
    '',
    'Enabled patch trials generate forward and inverse operations at every reducer call. Both libraries use array paths and index-based array removals (Mutative: arrayLengthAssignment false). Every producer tuple escapes; patch application, serialization, and accumulation are excluded from timing, except that the apply-* scenarios time patch application with patches off. Operation counts sum across all calls in the scenario.',
    '',
    'Times are **microseconds per full scenario**, including natural GC. Ratio = Immer time / Mutative time; above 1 favors Mutative, below 1 favors Immer. These are scenario measurements, not a universal speedup. P99 describes Mitata samples, which can be batches of operations; it is not per-request tail latency.',
    '',
  ];
  const time = (stats, field = 'medianMeanNs') =>
    stats ? (stats[field] / 1000).toFixed(3) : '—';
  const freezeModes = [false, true].filter((autoFreeze) =>
    report.summary.some((entry) => entry.autoFreeze === autoFreeze)
  );
  for (const autoFreeze of freezeModes) {
    const patchModes = [false, true].filter((enabled) =>
      report.summary.some(
        (entry) =>
          entry.autoFreeze === autoFreeze &&
          (entry.enablePatches ?? false) === enabled
      )
    );
    for (const enabled of patchModes) {
      const rows = report.summary.filter(
        (entry) =>
          entry.autoFreeze === autoFreeze &&
          (entry.enablePatches ?? false) === enabled
      );
      lines.push(
        `## Auto-freeze ${autoFreeze ? 'on (pre-frozen input)' : 'off (unfrozen input)'}; patches ${enabled ? 'on' : 'off'}`,
        '',
        '| Scenario | Calls | Mutative µs | Immer µs | I/M | Mutative sample p99 µs | Immer sample p99 µs |',
        '| --- | ---: | ---: | ---: | ---: | ---: | ---: |'
      );
      for (const entry of rows) {
        lines.push(
          `| ${entry.scenario} | ${entry.operations} | ${time(entry.libraries.mutative)} | ${time(entry.libraries.immer)} | ${entry.immerOverMutative?.toFixed(2) ?? '—'} | ${time(entry.libraries.mutative, 'medianP99Ns')} | ${time(entry.libraries.immer, 'medianP99Ns')} |`
        );
      }
      if (enabled) {
        lines.push(
          '',
          'Patch operations per full scenario:',
          '',
          '| Scenario | Mutative forward / inverse | Immer forward / inverse |',
          '| --- | ---: | ---: |'
        );
        for (const entry of rows) {
          const counts = (library) =>
            library?.patchCounts
              ? `${library.patchCounts.forward} / ${library.patchCounts.inverse}`
              : '—';
          lines.push(
            `| ${entry.scenario} | ${counts(entry.libraries.mutative)} | ${counts(entry.libraries.immer)} |`
          );
        }
      }
      lines.push(
        '',
        'Independent-process mean ranges (µs):',
        '',
        '| Scenario | Mutative min–max | Immer min–max |',
        '| --- | ---: | ---: |'
      );
      for (const entry of rows) {
        const range = (library) =>
          library
            ? `${time(library, 'minMeanNs')}–${time(library, 'maxMeanNs')}`
            : '—';
        lines.push(
          `| ${entry.scenario} | ${range(entry.libraries.mutative)} | ${range(entry.libraries.immer)} |`
        );
      }
      lines.push('');
    }
  }
  lines.push(
    'The accompanying JSON retains every process result, sample count, timing percentiles, measurement order, artifact SHA-256 hashes, configuration, and environment metadata.',
    ''
  );
  return lines.join('\n');
}

function formatVersionedReport(report) {
  const first = report.runs[0];
  const lines = [
    '# Candidate Mutative vs pinned v1 and Immer',
    '',
    `Recorded: ${report.recordedAt}; ${runCount(report)} runs in ${report.runs.length} independent processes. Times are median process means in µs per complete scenario.`,
    '',
    `Candidate Mutative ${first.build.versions.mutative} at \`${first.build.candidate?.gitRevision ?? first.build.gitRevision}\`; pinned Mutative v1 ${first.build.versions['mutative-v1']}; pinned Immer ${first.build.versions.immer}. The candidate is only v2 when its actual package version is 2.x.`,
    '',
    `Environment: ${first.environment.cpu}; Node ${first.environment.node}, V8 ${first.environment.v8}, ${first.environment.platform}/${first.environment.arch}.`,
    '',
    `Production artifacts and their hashes are recorded in JSON. ${pluginNote(report)} Setup and validation are excluded. Freeze-on inputs are pre-frozen; patch timing includes forward/inverse generation, excluding replay and serialization. The apply-* scenarios time patch application instead, with patches off.`,
    '',
    'V1/C, I/C and Va/C are time ratios to the candidate; values above 1 favor the candidate. Vanilla is the hand-written reference reducer, which runs with freeze and patches off only. Small differences do not establish a winner.',
    '',
    '| Scenario | Freeze | Patches | Calls | Candidate µs | V1 µs | Immer µs | Vanilla µs | V1/C | I/C | Va/C |',
    '| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
  ];
  const time = (library) =>
    library ? (library.medianMeanNs / 1000).toFixed(3) : '—';
  for (const row of report.summary)
    lines.push(
      `| ${row.scenario} | ${row.autoFreeze ? 'on' : 'off'} | ${row.enablePatches ? 'on' : 'off'} | ${row.operations} | ${time(row.libraries.mutative)} | ${time(row.libraries['mutative-v1'])} | ${time(row.libraries.immer)} | ${time(row.libraries.vanilla)} | ${row.v1OverCandidate?.toFixed(2) ?? '—'} | ${row.immerOverMutative?.toFixed(2) ?? '—'} | ${row.vanillaOverCandidate?.toFixed(2) ?? '—'} |`
    );
  lines.push(
    '',
    'JSON retains per-process mean ranges, sample p50/p99 and counts, patch counts, fixture sizes, environment, and production/source hashes. Sample p99 can represent batches, not individual-request tail latency.',
    ''
  );
  return lines.join('\n');
}
