import { writeFileSync } from 'node:fs';
import os from 'node:os';
import { measureMemory } from './memory.mjs';
import { readOptions } from './options.mjs';
import { buildInfo, createRuntime } from './runtime.mjs';
import { createScenarios, prepareScenario } from './scenarios.mjs';
import { validateScenarios } from './validate.mjs';

const options = process.env.MUTATIVE_PERF_OPTIONS
  ? JSON.parse(process.env.MUTATIVE_PERF_OPTIONS)
  : readOptions({ command: 'benchmark:memory' });
const scenarios = createScenarios(options.config, options.filter);
if (
  scenarios.length !== 1 ||
  options.libraries.length !== 1 ||
  options.freezes.length !== 1 ||
  options.patches.length !== 1
) {
  throw new Error(
    'Each memory worker requires exactly one scenario/library/freeze/patch combination'
  );
}
const { checks, patchCounts } = validateScenarios(options, scenarios);
const scenario = scenarios[0];
const [library] = options.libraries;
const [autoFreeze] = options.freezes;
const [enablePatches] = options.patches;
const prepared = prepareScenario(options.config, scenario.name, autoFreeze);
let lastRead;
const runtime = createRuntime(
  library,
  autoFreeze,
  enablePatches,
  (value) => {
    lastRead = value;
  },
  options.immerArrayMethods === true
);
const execute = () => {
  let state = prepared.base;
  let output = state;
  for (const action of prepared.steps) {
    output = runtime.reducer(state, action);
    state = enablePatches ? output[0] : output;
  }
  return output;
};
const memory = await measureMemory(execute, {
  iterations: options.memoryIterations,
  samplingInterval: options.samplingInterval,
});
const report = {
  schemaVersion: 1,
  kind: 'memory',
  build: buildInfo,
  environment: {
    node: process.version,
    v8: process.versions.v8,
    platform: process.platform,
    arch: process.arch,
    cpu: os.cpus()[0]?.model,
    memoryBytes: os.totalmem(),
  },
  config: options.config,
  checks,
  recordedAt: new Date().toISOString(),
  methodology: {
    arrayMethodsEnabled: options.immerArrayMethods === true,
    latencyMeasured: false,
    allocationIncludesCollectedObjects: true,
    allocationIncludesHarnessOverhead: true,
    retention:
      'one output per iteration; patches retain the last producer tuple, including its state',
    retainedHeapBaseline: 'post-GC heap after releasing the output holder',
    inputs: autoFreeze
      ? 'pre-frozen state and payloads'
      : 'unfrozen state and payloads',
    setupValidationWarmupExcluded: true,
    memoryPasses:
      'sampled allocation; separate batch-end/retained/released snapshots',
    warmupIterations: 5,
  },
  trial: {
    scenario: scenario.name,
    operations: scenario.operations,
    library,
    autoFreeze,
    enablePatches,
    runIndex: options.runIndex ?? 0,
    memory,
    ...(lastRead !== undefined && { lastRead }),
    ...(enablePatches && {
      patchCounts: patchCounts.get(
        `${scenario.name}/${library}/freeze=${autoFreeze}/patches=${enablePatches}`
      ),
    }),
  },
};
if (!options.output) throw new Error('Memory workers require --output');
writeFileSync(options.output, `${JSON.stringify(report, null, 2)}\n`);
