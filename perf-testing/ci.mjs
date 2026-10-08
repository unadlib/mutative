import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { DEFAULT_CONFIG } from './workloads.mjs';
import { evaluateBudgets, formatBudgetReport } from './regression.mjs';
import { createScenarios, supportsMode } from './scenarios.mjs';

const { values } = parseArgs({
  options: {
    'base-dir': { type: 'string' },
    output: { type: 'string' },
    'self-control': { type: 'boolean', default: false },
    group: { type: 'string', multiple: true },
  },
});
const directory = dirname(fileURLToPath(import.meta.url));
const root = dirname(directory);
if (!values['base-dir'] && !values['self-control'])
  throw new Error(
    'Provide --base-dir with a built PR-base checkout, or --self-control for calibration'
  );
const policySource = readFileSync(join(directory, 'budgets.json'), 'utf8');
const policy = JSON.parse(policySource);
// CI runs each group in a job of its own; locally, all groups run in turn.
const groups = values.group ?? Object.keys(policy.groups);
for (const group of groups)
  if (!Object.hasOwn(policy.groups, group))
    throw new Error(`Unknown budget group: ${group}`);
const outputRoot = resolve(values.output ?? join(directory, 'results/ci'));
const command = (args, env = {}) => {
  const child = spawnSync(process.execPath, args, {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, ...env, NODE_ENV: 'production' },
  });
  if (child.error) throw child.error;
  if (child.status !== 0)
    throw new Error(
      `Performance command failed: ${child.status ?? child.signal}`
    );
};
const bundles = {};
for (const role of ['base', 'candidate']) {
  const buildDirectory = join(directory, 'dist', `ci-${role}`);
  command([join(directory, 'build.mjs')], {
    MUTATIVE_PERF_CANDIDATE_DIR:
      role === 'base' && !values['self-control']
        ? resolve(values['base-dir'])
        : root,
    MUTATIVE_PERF_BUILD_DIR: buildDirectory,
  });
  bundles[role] = {
    latency: join(buildDirectory, 'immutability-benchmarks.mjs'),
    memory: join(buildDirectory, 'immutability-memory.mjs'),
  };
}
const common = {
  runs: 1,
  libraries: ['mutative'],
  freezes: policy.freezes,
  patches: policy.patches,
  config: { ...DEFAULT_CONFIG, arraySize: policy.arraySize },
  memoryIterations: policy.memoryIterations,
  samplingInterval: policy.samplingInterval,
};
const registry = new Map(
  createScenarios(common.config).map((scenario) => [scenario.name, scenario])
);
const worker = (outputDirectory, kind, role, runIndex, options, suffix) => {
  const output = join(
    outputDirectory,
    `${kind}-${runIndex + 1}-${role}${suffix ?? ''}.json`
  );
  command(['--expose-gc', '--enable-source-maps', bundles[role][kind]], {
    MUTATIVE_PERF_OPTIONS: JSON.stringify({
      ...common,
      ...options,
      runIndex,
      output,
    }),
  });
  return JSON.parse(readFileSync(output, 'utf8'));
};
let failed = false;
for (const group of groups) {
  const { latencyScenarios, memoryScenarios } = policy.groups[group];
  const outputDirectory = join(outputRoot, group);
  mkdirSync(outputDirectory, { recursive: true });
  const report = {
    schemaVersion: 2,
    kind: 'regression',
    group,
    recordedAt: new Date().toISOString(),
    selfControl: values['self-control'],
    policySha256: createHash('sha256').update(policySource).digest('hex'),
    policy,
    latencyPairs: [],
    memoryPairs: [],
  };
  const reportPath = join(outputDirectory, 'report.json');
  const save = () =>
    writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  for (let index = 0; index < policy.latencyRuns; index++) {
    const pair = { index };
    for (const role of index % 2
      ? ['candidate', 'base']
      : ['base', 'candidate'])
      pair[role] = worker(outputDirectory, 'latency', role, index, {
        filter: `^(${latencyScenarios.join('|')})$`,
      });
    report.latencyPairs.push(pair);
    save();
  }
  for (let index = 0; index < policy.memoryRuns; index++) {
    const pair = { index, base: [], candidate: [] };
    for (const scenario of memoryScenarios)
      for (const autoFreeze of policy.freezes)
        for (const enablePatches of policy.patches.filter((patches) =>
          supportsMode(registry.get(scenario), 'mutative', autoFreeze, patches)
        ))
          for (const role of index % 2
            ? ['candidate', 'base']
            : ['base', 'candidate']) {
            pair[role].push(
              worker(
                outputDirectory,
                'memory',
                role,
                index,
                {
                  filter: `^${scenario}$`,
                  freezes: [autoFreeze],
                  patches: [enablePatches],
                },
                `-${scenario}-${autoFreeze}-${enablePatches}`
              )
            );
          }
    report.memoryPairs.push(pair);
    save();
  }
  report.evaluation = evaluateBudgets(report);
  save();
  const markdown = formatBudgetReport(report.evaluation);
  writeFileSync(join(outputDirectory, 'report.md'), markdown);
  console.log(markdown);
  console.log(`Budget artifacts: ${reportPath}`);
  if (report.evaluation.status !== 'passed') failed = true;
}
if (failed) process.exitCode = 1;
