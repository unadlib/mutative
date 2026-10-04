import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readOptions } from './options.mjs';
import { formatReport, summarize } from './report.mjs';
import { createScenarios, supportsMode } from './scenarios.mjs';

const directory = dirname(fileURLToPath(import.meta.url));
const options = readOptions();
const resultsDirectory = join(directory, 'results');
mkdirSync(resultsDirectory, { recursive: true });
const runDirectory = mkdtempSync(join(resultsDirectory, 'run-'));
const reports = [];
const escape = (name) => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const timed = !options.check && !options.list;
const scenarios = createScenarios(options.config, options.filter);
const runsMode = (scenario, library) =>
  options.freezes.some((autoFreeze) =>
    options.patches.some((enablePatches) =>
      supportsMode(scenario, library, autoFreeze, enablePatches)
    )
  );
// Immer calls its MapSet plugin while finalizing every draft once the plugin
// is loaded. Map and Set scenarios therefore run in processes of their own, so
// the other scenarios measure Immer without it. With --isolate, every scenario
// and library gets a process: V8's object shapes, left by whatever ran earlier
// in a process, change wide-object timings many times over.
const groups = !timed
  ? [{ filter: options.filter, libraries: options.libraries }]
  : options.isolate
    ? scenarios.flatMap((scenario) =>
        options.libraries
          .filter((library) => runsMode(scenario, library))
          .map((library) => ({
            filter: `^${escape(scenario.name)}$`,
            libraries: [library],
          }))
      )
    : [false, true]
        .map((mapSet) =>
          scenarios.filter((scenario) => scenario.mapSet === mapSet)
        )
        .filter((group) => group.length)
        .map((group) => ({
          filter: `^(${group.map(({ name }) => escape(name)).join('|')})$`,
          libraries: options.libraries,
        }));
const processes = groups.flatMap((group, groupIndex) =>
  Array.from({ length: timed ? options.runs : 1 }, (_, runIndex) => ({
    ...group,
    groupIndex,
    runIndex,
  }))
);
// Each run measures every group before the next run starts.
processes.sort(
  (a, b) => a.runIndex - b.runIndex || a.groupIndex - b.groupIndex
);
for (const [
  index,
  { filter, libraries, groupIndex, runIndex },
] of processes.entries()) {
  const output = join(
    runDirectory,
    `process-${runIndex + 1}${groups.length > 1 ? `-${groupIndex + 1}` : ''}.json`
  );
  console.log(`\nIndependent process ${index + 1}/${processes.length}`);
  const child = spawnSync(
    process.execPath,
    [
      '--expose-gc',
      '--enable-source-maps',
      process.env.MUTATIVE_PERF_BUNDLE ??
        join(directory, 'dist/immutability-benchmarks.mjs'),
    ],
    {
      cwd: dirname(directory),
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'production',
        MUTATIVE_PERF_OPTIONS: JSON.stringify({
          ...options,
          filter,
          libraries,
          runIndex,
          output,
        }),
      },
    }
  );
  if (child.error) throw child.error;
  if (child.status !== 0)
    throw new Error(
      `Benchmark process failed: ${child.status ?? child.signal}`
    );
  if (timed) reports.push(JSON.parse(readFileSync(output, 'utf8')));
}
if (reports.length) {
  const report = {
    schemaVersion: 2,
    recordedAt: new Date().toISOString(),
    aggregation:
      'median of independent-process mean times; ratios use those medians',
    runs: reports,
    summary: summarize(reports),
  };
  const output = options.output
    ? resolve(options.output)
    : join(runDirectory, 'report.json');
  const markdownOutput = output.endsWith('.json')
    ? output.replace(/\.json$/, '.md')
    : `${output}.md`;
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(markdownOutput, formatReport(report));
  console.log(`\nJSON: ${output}\nMarkdown: ${markdownOutput}`);
  for (const entry of report.summary) {
    const { mutative, immer } = entry.libraries;
    console.log(
      `${entry.scenario} freeze=${entry.autoFreeze} patches=${entry.enablePatches}: Mutative ${mutative ? (mutative.medianMeanNs / 1000).toFixed(3) : '—'} us; Immer ${immer ? (immer.medianMeanNs / 1000).toFixed(3) : '—'} us; I/M ${entry.immerOverMutative?.toFixed(2) ?? '—'}`
    );
  }
}
