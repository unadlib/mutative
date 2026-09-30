import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readOptions } from './options.mjs';
import { formatReport, summarize } from './report.mjs';

const directory = dirname(fileURLToPath(import.meta.url));
const options = readOptions();
const resultsDirectory = join(directory, 'results');
mkdirSync(resultsDirectory, { recursive: true });
const runDirectory = mkdtempSync(join(resultsDirectory, 'run-'));
const reports = [];
for (
  let runIndex = 0;
  runIndex < (options.check || options.list ? 1 : options.runs);
  runIndex++
) {
  const output = join(runDirectory, `process-${runIndex + 1}.json`);
  console.log(`\nIndependent process ${runIndex + 1}/${options.runs}`);
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
        MUTATIVE_PERF_OPTIONS: JSON.stringify({ ...options, runIndex, output }),
      },
    }
  );
  if (child.error) throw child.error;
  if (child.status !== 0)
    throw new Error(
      `Benchmark process failed: ${child.status ?? child.signal}`
    );
  if (!options.check && !options.list)
    reports.push(JSON.parse(readFileSync(output, 'utf8')));
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
