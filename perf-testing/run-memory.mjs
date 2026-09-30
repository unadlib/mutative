import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readOptions } from './options.mjs';
import { createScenarios } from './scenarios.mjs';
import { formatMemoryReport, summarizeMemory } from './memory-report.mjs';

const directory = dirname(fileURLToPath(import.meta.url));
const options = readOptions({ command: 'benchmark:memory' });
const scenarios = createScenarios(options.config, options.filter);
if (options.list) {
  for (const scenario of scenarios)
    console.log(
      `${scenario.name}: ${scenario.operations} reducer calls/iteration`
    );
  process.exit(0);
}
if (options.check) {
  const child = spawnSync(
    process.execPath,
    ['--expose-gc', join(directory, 'dist/immutability-benchmarks.mjs')],
    {
      cwd: dirname(directory),
      stdio: 'inherit',
      env: { ...process.env, MUTATIVE_PERF_OPTIONS: JSON.stringify(options) },
    }
  );
  if (child.error) throw child.error;
  if (child.status !== 0)
    throw new Error(
      `Memory workload validation failed: ${child.status ?? child.signal}`
    );
  process.exit(0);
}
mkdirSync(join(directory, 'results'), { recursive: true });
const runDirectory = mkdtempSync(join(directory, 'results/memory-'));
const reports = [];
for (let runIndex = 0; runIndex < options.runs; runIndex++) {
  const modes = [options.libraries, options.freezes, options.patches].map(
    (modes) => (runIndex % 2 ? [...modes].reverse() : modes)
  );
  for (const scenario of scenarios)
    for (const library of modes[0])
      for (const autoFreeze of modes[1])
        for (const enablePatches of modes[2]) {
          const output = join(runDirectory, `trial-${reports.length + 1}.json`);
          const child = spawnSync(
            process.execPath,
            [
              '--expose-gc',
              '--enable-source-maps',
              process.env.MUTATIVE_PERF_MEMORY_BUNDLE ??
                join(directory, 'dist/immutability-memory.mjs'),
            ],
            {
              cwd: dirname(directory),
              stdio: 'inherit',
              env: {
                ...process.env,
                NODE_ENV: 'production',
                MUTATIVE_PERF_OPTIONS: JSON.stringify({
                  ...options,
                  filter: `^${scenario.name}$`,
                  libraries: [library],
                  freezes: [autoFreeze],
                  patches: [enablePatches],
                  runIndex,
                  output,
                }),
              },
            }
          );
          if (child.error) throw child.error;
          if (child.status !== 0)
            throw new Error(
              `Memory worker failed: ${child.status ?? child.signal}`
            );
          const report = JSON.parse(readFileSync(output, 'utf8'));
          reports.push(report);
          console.log(
            `[${reports.length}/${options.runs * scenarios.length * options.libraries.length * options.freezes.length * options.patches.length}] ${scenario.name}/${library}/freeze=${autoFreeze}/patches=${enablePatches}: ${(report.trial.memory.sampledAllocatedBytesPerIteration / 1024).toFixed(2)} KiB allocated/iteration (sampled)`
          );
        }
}
const report = {
  schemaVersion: 1,
  kind: 'memory',
  recordedAt: new Date().toISOString(),
  runs: reports,
  summary: summarizeMemory(reports),
};
const output = resolve(options.output ?? join(runDirectory, 'report.json'));
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(
  output.endsWith('.json') ? output.replace(/\.json$/, '.md') : `${output}.md`,
  formatMemoryReport(report)
);
console.log(`Memory report: ${output}`);
