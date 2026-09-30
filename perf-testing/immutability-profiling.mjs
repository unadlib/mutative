import { mkdirSync, writeFileSync } from 'node:fs';
import { Session } from 'node:inspector';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { do_not_optimize } from 'mitata';
import { readOptions } from './options.mjs';
import { buildInfo, createRuntime } from './runtime.mjs';
import { createScenarios, prepareScenario } from './scenarios.mjs';
import { validateScenarios } from './validate.mjs';

const options = readOptions({
  command: 'profile:immer',
  library: 'mutative',
  freeze: 'off',
});
if (options.libraries.length !== 1 || options.freezes.length !== 1) {
  throw new Error(
    'Profile one library and freeze mode at a time; use --library mutative|immer --freeze off|on'
  );
}
const scenarios = createScenarios(options.config, options.filter);
const checks = validateScenarios(options, scenarios);
const [library] = options.libraries;
const [autoFreeze] = options.freezes;
const runtime = createRuntime(library, autoFreeze);
const preparedScenarios = scenarios.map((scenario) =>
  prepareScenario(options.config, scenario.name, autoFreeze)
);
console.log(
  `Validated ${checks} profiling scenarios for ${library}, freeze=${autoFreeze}.`
);

if (!options.check && !options.list) {
  if (typeof globalThis.gc !== 'function')
    throw new Error('Run with node --expose-gc');
  // The profile deliberately excludes startup, validation, setup, and warmup.
  for (const prepared of preparedScenarios) {
    for (let i = 0; i < Math.min(100, options.iterations); i++) {
      do_not_optimize(prepared.execute(runtime.reducer, prepared.base));
    }
  }
  globalThis.gc();
  const session = new Session();
  session.connect();
  const post = (method, params = {}) =>
    new Promise((accept, reject) => {
      session.post(method, params, (error, result) => {
        if (error) reject(error);
        else accept(result);
      });
    });
  try {
    await post('Profiler.enable');
    await post('Profiler.setSamplingInterval', { interval: 1000 });
    await post('Profiler.start');
    for (const prepared of preparedScenarios) {
      for (let i = 0; i < options.iterations; i++) {
        do_not_optimize(prepared.execute(runtime.reducer, prepared.base));
      }
    }
    const { profile } = await post('Profiler.stop');
    const directory = dirname(dirname(fileURLToPath(import.meta.url)));
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const output = resolve(
      options.output ??
        join(
          directory,
          'results',
          `${library}-freeze-${autoFreeze}-${stamp}.cpuprofile`
        )
    );
    mkdirSync(dirname(output), { recursive: true });
    writeFileSync(output, JSON.stringify(profile));
    writeFileSync(
      `${output}.metadata.json`,
      `${JSON.stringify(
        {
          build: buildInfo,
          node: process.version,
          v8: process.versions.v8,
          library,
          autoFreeze,
          config: options.config,
          scenarios: scenarios.map(({ name, operations }) => ({
            name,
            operations,
          })),
          iterationsPerScenario: options.iterations,
          samplingIntervalUs: 1000,
          arrayMethodsEnabled: false,
          setupAndWarmupProfiled: false,
        },
        null,
        2
      )}\n`
    );
    console.log(
      `CPU profile: ${output}\nAnalyze: pnpm profile:immer:analyze ${output}`
    );
  } finally {
    session.disconnect();
  }
} else if (options.list) {
  for (const scenario of scenarios)
    console.log(
      `${scenario.name}: ${scenario.operations} reducer calls/iteration`
    );
}
