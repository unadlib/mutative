import { writeFileSync } from 'node:fs';
import os from 'node:os';
import { bench, do_not_optimize, run } from 'mitata';
import { readOptions } from './options.mjs';
import { buildInfo, createRuntime } from './runtime.mjs';
import { createScenarios, prepareScenario } from './scenarios.mjs';
import { validateScenarios } from './validate.mjs';

const options = process.env.MUTATIVE_PERF_OPTIONS
  ? JSON.parse(process.env.MUTATIVE_PERF_OPTIONS)
  : readOptions();
const scenarios = createScenarios(options.config, options.filter);
if (options.list) {
  for (const scenario of scenarios)
    console.log(
      `${scenario.name}: ${scenario.operations} reducer calls/iteration`
    );
} else {
  const checks = validateScenarios(options, scenarios);
  console.log(
    `Validated ${checks} scenario/library/freeze combinations against immutable reference results.`
  );
  if (!options.check) {
    if (typeof globalThis.gc !== 'function')
      throw new Error('Run with node --expose-gc');
    const definitions = new Map();
    let libraries = options.libraries;
    let freezes = options.freezes;
    // Alternate library and freeze order between independent process runs.
    if ((options.runIndex ?? 0) % 2) {
      libraries = [...libraries].reverse();
      freezes = [...freezes].reverse();
    }
    for (const scenario of scenarios) {
      for (const autoFreeze of freezes) {
        for (const library of libraries) {
          const name = `${scenario.name}: ${library} (freeze: ${autoFreeze})`;
          definitions.set(name, {
            scenario: scenario.name,
            operations: scenario.operations,
            library,
            autoFreeze,
          });
          bench(name, function* () {
            const prepared = prepareScenario(
              options.config,
              scenario.name,
              autoFreeze
            );
            const runtime = createRuntime(library, autoFreeze);
            yield {
              // Heap sampling changes the measurement budget; measure latency here.
              heap: false,
              bench() {
                do_not_optimize(
                  prepared.execute(runtime.reducer, prepared.base)
                );
              },
            };
          });
        }
      }
    }
    let completed = 0;
    const measured = await run({
      format: 'quiet',
      colors: false,
      throw: true,
      observe(trial) {
        for (const entry of trial.runs) {
          if (entry.error || !entry.stats)
            throw new Error(`Failed benchmark: ${entry.name}`);
          console.log(
            `[${++completed}/${definitions.size}] ${entry.name}: ${(entry.stats.avg / 1000).toFixed(3)} us`
          );
        }
        return trial;
      },
    });
    const trials = measured.benchmarks.flatMap((trial) =>
      trial.runs.map((entry) => {
        const { samples, ...stats } = entry.stats;
        delete stats.debug;
        return {
          ...definitions.get(entry.name),
          name: entry.name,
          stats: { ...stats, sampleCount: samples.length },
        };
      })
    );
    if (trials.length !== definitions.size)
      throw new Error('Incomplete benchmark matrix');
    const report = {
      schemaVersion: 1,
      recordedAt: new Date().toISOString(),
      runIndex: options.runIndex ?? 0,
      build: buildInfo,
      environment: {
        node: process.version,
        v8: process.versions.v8,
        platform: process.platform,
        arch: process.arch,
        osRelease: os.release(),
        cpu: os.cpus()[0]?.model,
        logicalCpus: os.cpus().length,
        memoryBytes: os.totalmem(),
        execArgv: process.execArgv,
      },
      config: options.config,
      checks,
      unit: 'nanoseconds per full scenario iteration',
      methodology: {
        arrayMethodsEnabled: false,
        patchesEnabled: false,
        freezeOnInput: 'deeply pre-frozen base and payloads',
        freezeOffInput: 'unfrozen base and payloads',
        fixtureAndActionSetupTimed: false,
        stateResetPerIteration: true,
        gc: 'Mitata once after warmup; natural GC included during timing',
        heapSampling: false,
        minCpuTimeNs: 642000000,
      },
      context: measured.context,
      trials,
    };
    if (options.output)
      writeFileSync(options.output, `${JSON.stringify(report, null, 2)}\n`);
  }
}
