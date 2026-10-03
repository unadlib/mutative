import { writeFileSync } from 'node:fs';
import os from 'node:os';
import { bench, do_not_optimize, run } from 'mitata';
import { readOptions } from './options.mjs';
import { compactStats } from './report.mjs';
import { buildInfo, createRuntime, isImmerMapSetEnabled } from './runtime.mjs';
import {
  createScenarios,
  prepareScenario,
  supportsMode,
} from './scenarios.mjs';
import { validateScenarios } from './validate.mjs';

const options = process.env.MUTATIVE_PERF_OPTIONS
  ? JSON.parse(process.env.MUTATIVE_PERF_OPTIONS)
  : readOptions();
const scenarios = createScenarios(options.config, options.filter);
if (options.list) {
  for (const scenario of scenarios)
    console.log(
      `${scenario.name}: ${scenario.operations} ${scenario.kind === 'apply' ? 'patch applications' : 'reducer calls'}/iteration`
    );
} else {
  const { checks, patchCounts } = validateScenarios(options, scenarios);
  console.log(
    `Validated ${checks} scenario/library/freeze/patch combinations against immutable reference results and patch replay.`
  );
  if (!options.check) {
    if (typeof globalThis.gc !== 'function')
      throw new Error('Run with node --expose-gc');
    const definitions = new Map();
    let libraries = options.libraries;
    let freezes = options.freezes;
    let patches = options.patches;
    // Alternate library, freeze, and patch order between independent runs.
    if ((options.runIndex ?? 0) % 2) {
      libraries = [...libraries].reverse();
      freezes = [...freezes].reverse();
      patches = [...patches].reverse();
    }
    for (const scenario of scenarios) {
      for (const autoFreeze of freezes) {
        for (const enablePatches of patches) {
          for (const library of libraries.filter((candidate) =>
            supportsMode(scenario, candidate, autoFreeze, enablePatches)
          )) {
            const name = `${scenario.name}: ${library} (freeze: ${autoFreeze}, patches: ${enablePatches})`;
            const label = `${scenario.name}/${library}/freeze=${autoFreeze}/patches=${enablePatches}`;
            definitions.set(name, {
              scenario: scenario.name,
              operations: scenario.operations,
              library,
              autoFreeze,
              enablePatches,
              ...(enablePatches && { patchCounts: patchCounts.get(label) }),
            });
            bench(name, function* () {
              const prepared = prepareScenario(
                options.config,
                scenario.name,
                autoFreeze
              );
              const runtime = createRuntime(
                library,
                autoFreeze,
                enablePatches,
                undefined,
                options.immerArrayMethods === true,
                prepared
              );
              const execute = enablePatches
                ? () =>
                    prepared.executeWithPatches(
                      runtime.reducer,
                      prepared.base,
                      do_not_optimize
                    )
                : () => prepared.execute(runtime.reducer, prepared.base);
              yield {
                // Heap sampling changes the measurement budget; measure latency here.
                heap: false,
                bench() {
                  do_not_optimize(execute());
                },
              };
            });
          }
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
      trial.runs.map((entry) => ({
        ...definitions.get(entry.name),
        name: entry.name,
        stats: compactStats(entry.stats),
      }))
    );
    if (trials.length !== definitions.size)
      throw new Error('Incomplete benchmark matrix');
    const report = {
      schemaVersion: 2,
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
        arrayMethodsEnabled: options.immerArrayMethods === true,
        immerMapSetEnabled: isImmerMapSetEnabled(),
        patchesEnabled:
          options.patches.length === 1 ? options.patches[0] : null,
        patchModes: options.patches,
        patchPaths: 'arrays',
        mutativeArrayLengthAssignment: false,
        // Only apply-* scenarios time patch application, with patches off.
        patchApplicationTimed: scenarios.some(
          (scenario) => scenario.kind === 'apply'
        ),
        ...(options.libraries.includes('vanilla') && {
          vanilla:
            'hand-written reference reducer; freeze and patches off only',
        }),
        patchSerializationTimed: false,
        patchOutputEscape:
          'each producer tuple escapes; no accumulation across calls',
        freezeOnInput: 'deeply pre-frozen base and payloads',
        freezeOffInput: 'unfrozen base and payloads',
        fixtureAndActionSetupTimed: false,
        stateResetPerIteration: true,
        gc: 'Mitata once after warmup; natural GC included during timing',
        heapSampling: false,
        minCpuTimeNs: 642000000,
      },
      context: {
        ...measured.context,
        // Calibration contains millions of raw no-op samples. Retain its
        // statistics and counts, as for trials, instead of 50+ MB of arrays.
        noop: Object.fromEntries(
          Object.entries(measured.context.noop).map(([name, stats]) => [
            name,
            compactStats(stats),
          ])
        ),
      },
      trials,
    };
    if (options.output)
      writeFileSync(options.output, `${JSON.stringify(report, null, 2)}\n`);
  }
}
