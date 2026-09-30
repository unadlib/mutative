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
      const key = JSON.stringify([trial.scenario, trial.autoFreeze]);
      if (!groups.has(key)) {
        groups.set(key, {
          scenario: trial.scenario,
          autoFreeze: trial.autoFreeze,
          operations: trial.operations,
          libraries: {},
        });
      }
      const group = groups.get(key);
      (group.libraries[trial.library] ??= []).push(trial.stats);
    }
  }
  return [...groups.values()].map((group) => {
    const libraries = Object.fromEntries(
      Object.entries(group.libraries).map(([name, samples]) => [
        name,
        {
          runs: samples.length,
          medianMeanNs: median(samples.map((stats) => stats.avg)),
          minMeanNs: Math.min(...samples.map((stats) => stats.avg)),
          maxMeanNs: Math.max(...samples.map((stats) => stats.avg)),
          medianP50Ns: median(samples.map((stats) => stats.p50)),
          medianP99Ns: median(samples.map((stats) => stats.p99)),
        },
      ])
    );
    return {
      ...group,
      libraries,
      immerOverMutative:
        libraries.immer && libraries.mutative
          ? libraries.immer.medianMeanNs / libraries.mutative.medianMeanNs
          : null,
    };
  });
}

export function formatReport(report) {
  const first = report.runs[0];
  const lines = [
    '# Mutative vs Immer workload benchmarks',
    '',
    `Recorded: ${report.recordedAt}. ${report.runs.length} independent Node processes; median of each process's mean time.`,
    '',
    `Local Mutative **${first.build.versions.mutative}** at \`${first.build.gitRevision}\`; installed Immer **${first.build.versions.immer}**; Mitata **${first.build.versions.mitata}**.`,
    '',
    `Environment: ${first.environment.cpu}, ${(first.environment.memoryBytes / 2 ** 30).toFixed(0)} GiB RAM, ${first.environment.platform}/${first.environment.arch}, Node ${first.environment.node}, V8 ${first.environment.v8}.`,
    '',
    `Fixture: array ${first.config.arraySize}, ${first.config.nestedArraySize} nested items/row, objects with ${first.config.largeObjectSize1}/${first.config.largeObjectSize2} properties; reuse ${first.config.reuseStateIterations} calls; RTKQ ${first.config.rtkqCount} pending + ${first.config.rtkqCount} resolved calls.`,
    '',
    'Both libraries use production artifacts. Array-method plugins and patches are disabled. Freeze off uses unfrozen inputs; freeze on uses pre-frozen inputs and payloads. Construction, configuration, and correctness checks are outside timing. Each iteration resets to its immutable base and evolves it only within that scenario.',
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
    const rows = report.summary.filter(
      (entry) => entry.autoFreeze === autoFreeze
    );
    lines.push(
      `## Auto-freeze ${autoFreeze ? 'on (pre-frozen input)' : 'off (unfrozen input)'}`,
      '',
      '| Scenario | Calls | Mutative µs | Immer µs | I/M | Mutative sample p99 µs | Immer sample p99 µs |',
      '| --- | ---: | ---: | ---: | ---: | ---: | ---: |'
    );
    for (const entry of rows) {
      lines.push(
        `| ${entry.scenario} | ${entry.operations} | ${time(entry.libraries.mutative)} | ${time(entry.libraries.immer)} | ${entry.immerOverMutative?.toFixed(2) ?? '—'} | ${time(entry.libraries.mutative, 'medianP99Ns')} | ${time(entry.libraries.immer, 'medianP99Ns')} |`
      );
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
  lines.push(
    'The accompanying JSON retains every process result, sample count, timing percentiles, measurement order, artifact SHA-256 hashes, configuration, and environment metadata.',
    ''
  );
  return lines.join('\n');
}
