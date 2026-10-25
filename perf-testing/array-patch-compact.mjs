/* eslint-disable no-bitwise */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { cpus } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { resourceUsage } from 'node:process';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const root = dirname(dirname(scriptPath));
const require = createRequire(import.meta.url);

export const SCENARIOS = [
  {
    name: 'shift',
    compactPatches: 1,
    mutate(draft) {
      draft.shift();
    },
  },
  {
    name: 'unshift',
    compactPatches: 1,
    mutate(draft, context) {
      draft.unshift(...context.one);
    },
  },
  {
    name: 'middle-remove',
    compactPatches: 1,
    mutate(draft) {
      draft.splice(Math.floor(draft.length / 2), 1);
    },
  },
  {
    name: 'middle-insert',
    compactPatches: 1,
    mutate(draft, context) {
      draft.splice(Math.floor(draft.length / 2), 0, ...context.one);
    },
  },
  {
    name: 'block-remove',
    compactPatches: (context) => context.batch.length,
    mutate(draft, context) {
      draft.splice(Math.floor(draft.length / 2), context.batch.length);
    },
  },
  {
    name: 'block-insert',
    compactPatches: (context) => context.batch.length,
    mutate(draft, context) {
      draft.splice(Math.floor(draft.length / 2), 0, ...context.batch);
    },
  },
  {
    name: 'coalesced-insert-plan',
    compactPatches: (context) => context.first.length + context.second.length,
    mutate(draft, context) {
      const index = Math.floor(draft.length / 2);
      draft.splice(index, 0, ...context.first);
      draft.splice(index + context.first.length, 0, ...context.second);
    },
  },
  {
    name: 'disjoint-insert-plan',
    fallback: true,
    mutate(draft, context) {
      draft.splice(Math.floor(draft.length / 4), 0, ...context.first);
      draft.splice(Math.floor((draft.length * 3) / 4), 0, ...context.second);
    },
  },
  {
    name: 'nested-edit-after-shift',
    fallback: true,
    mutate(draft) {
      draft.shift();
      draft[Math.floor(draft.length / 2)].value += 1;
    },
  },
  {
    name: 'reverse-fallback',
    fallback: true,
    mutate(draft) {
      draft.reverse();
    },
  },
  {
    name: 'sort-fallback',
    fallback: true,
    mutate(draft) {
      draft.sort((a, b) => a.id - b.id);
    },
  },
  {
    name: 'append-control',
    fallback: true,
    mutate(draft, context) {
      draft.push(...context.one);
    },
  },
  {
    name: 'local-edit-control',
    fallback: true,
    mutate(draft) {
      draft[Math.floor(draft.length / 2)].value += 1;
    },
  },
  {
    name: 'many-small-arrays',
    compactPatches: (context) => context.arraySize,
    mutate(draft) {
      for (const row of draft) row.shift();
    },
  },
];

const scenarioByName = (name) => {
  const scenario = SCENARIOS.find((item) => item.name === name);
  assert.ok(scenario, `Unknown scenario: ${name}`);
  return scenario;
};

export function makeBase(name, size) {
  if (name === 'many-small-arrays') {
    return Array.from({ length: size }, () => [0, 1, 2]);
  }
  const base = Array.from({ length: size }, (_, id) => ({ id, value: id }));
  if (name === 'sort-fallback') {
    let seed = 42;
    for (let index = base.length - 1; index > 0; index -= 1) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const other = seed % (index + 1);
      [base[index], base[other]] = [base[other], base[index]];
    }
  }
  return base;
}

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

export function createContext(arraySize, batchSize, autoFreeze = false) {
  const makeItems = (length, offset) =>
    Array.from({ length }, (_, index) => ({
      id: arraySize + offset + index,
      value: arraySize + offset + index,
    }));
  const planSize = Math.max(1, Math.floor(batchSize / 4));
  const context = {
    arraySize,
    one: makeItems(1, 0),
    batch: makeItems(batchSize, 0),
    first: makeItems(planSize, batchSize),
    second: makeItems(planSize, batchSize + planSize),
  };
  if (autoFreeze) deepFreeze(context);
  return context;
}

export function makeOptions(strategy, autoFreeze) {
  const enablePatches = {
    pathAsArray: false,
    arrayLengthAssignment: false,
  };
  if (strategy === 'compact') enablePatches.arrayPatchStrategy = 'compact';
  else assert.equal(strategy, 'index');
  return { enableAutoFreeze: autoFreeze, enablePatches };
}

function produce(api, base, scenario, context, strategy, autoFreeze) {
  return api.create(
    base,
    (draft) => scenario.mutate(draft, context),
    makeOptions(strategy, autoFreeze)
  );
}

function replay(api, base, patches, autoFreeze) {
  return api.apply(base, JSON.parse(JSON.stringify(patches)), {
    enableAutoFreeze: autoFreeze,
  });
}

function validate(api, base, scenario, context, strategy, autoFreeze) {
  const before = structuredClone(base);
  const expected = structuredClone(base);
  scenario.mutate(expected, context);
  const result = produce(api, base, scenario, context, strategy, autoFreeze);
  const [next, patches, inversePatches] = result;
  assert.deepStrictEqual(base, before, `${scenario.name}: base mutated`);
  assert.deepStrictEqual(next, expected, `${scenario.name}: next value`);
  const forward = replay(api, base, patches, autoFreeze);
  assert.deepStrictEqual(forward, next, `${scenario.name}: forward replay`);
  assert.deepStrictEqual(
    replay(api, next, inversePatches, autoFreeze),
    base,
    `${scenario.name}: inverse replay`
  );
  for (const patch of [...patches, ...inversePatches]) {
    assert.ok(['add', 'remove', 'replace'].includes(patch.op));
    assert.equal(typeof patch.path, 'string');
    assert.ok(!patch.path.endsWith('/length'));
  }
  if (strategy === 'compact') {
    if (scenario.fallback) {
      const legacy = produce(api, base, scenario, context, 'index', autoFreeze);
      assert.deepStrictEqual(patches, legacy[1], `${scenario.name}: fallback`);
      assert.deepStrictEqual(
        inversePatches,
        legacy[2],
        `${scenario.name}: inverse fallback`
      );
    } else {
      const expectedCount =
        typeof scenario.compactPatches === 'function'
          ? scenario.compactPatches(context)
          : scenario.compactPatches;
      assert.equal(patches.length, expectedCount, `${scenario.name}: forward`);
      assert.equal(
        inversePatches.length,
        expectedCount,
        `${scenario.name}: inverse`
      );
    }
  }
  const baseReferences = new Set(base);
  return {
    result,
    retainedReferences: forward.filter((value) => baseReferences.has(value))
      .length,
  };
}

export function median(values) {
  assert.ok(values.length > 0);
  assert.ok(values.every(Number.isFinite), 'Metrics must be finite numbers');
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

let _sink;
function measure(callback, sampleCount) {
  const samples = [];
  for (let index = 0; index < sampleCount; index += 1) {
    const start = performance.now();
    const value = callback();
    samples.push(performance.now() - start);
    _sink = value;
  }
  return {
    median: median(samples),
    min: Math.min(...samples),
    max: Math.max(...samples),
    samples,
  };
}

function settledHeap() {
  let value = Infinity;
  for (let index = 0; index < 3; index += 1) {
    globalThis.gc();
    value = Math.min(value, process.memoryUsage().heapUsed);
  }
  return value;
}

function measureMemory(api, base, scenario, context, strategy, autoFreeze, n) {
  _sink = undefined;
  settledHeap();
  const outputs = [];
  for (let index = 0; index < n; index += 1) {
    outputs.push(produce(api, base, scenario, context, strategy, autoFreeze));
  }
  const live = settledHeap();
  outputs.length = 0;
  const released = settledHeap();
  return {
    iterations: n,
    retainedHeapBytesPerOutput: (live - released) / n,
    // Node reports maxRSS in KiB on the supported Unix development platforms.
    processMaxRssBytes: resourceUsage().maxRSS * 1024,
  };
}

function operationCounts(patches) {
  return patches.reduce(
    (counts, { op }) => ({ ...counts, [op]: counts[op] + 1 }),
    { add: 0, remove: 0, replace: 0 }
  );
}

function runWorker(values) {
  const strategy = values.strategy;
  const scenario = scenarioByName(values.scenario);
  const autoFreeze = values.freeze === 'on';
  const candidateDir = resolve(values['candidate-dir']);
  const artifact = join(candidateDir, 'dist', 'mutative.cjs.production.min.js');
  // Each isolated worker loads the explicitly selected production checkout.
  // eslint-disable-next-line import/no-dynamic-require
  const api = require(artifact);
  const arraySize = Number(values['array-size']);
  const batchSize = Number(values['batch-size']);
  const context = createContext(arraySize, batchSize, autoFreeze);
  const base = makeBase(scenario.name, arraySize);
  if (autoFreeze) deepFreeze(base);
  const checked = validate(api, base, scenario, context, strategy, autoFreeze);
  const [, patches, inversePatches] = checked.result;
  const record = {
    scenario: scenario.name,
    strategy,
    autoFreeze,
    scenarioClass: scenario.fallback ? 'fallback/control' : 'contiguous',
    forwardPatches: patches.length,
    inversePatches: inversePatches.length,
    forwardBytes: Buffer.byteLength(JSON.stringify(patches)),
    inverseBytes: Buffer.byteLength(JSON.stringify(inversePatches)),
    forwardOperations: operationCounts(patches),
    inverseOperations: operationCounts(inversePatches),
    retainedReferences: checked.retainedReferences,
    retainedReferenceRatio: checked.retainedReferences / base.length,
  };
  if (!values.check) {
    const samples = Number(values.samples);
    // Validation and warmup share no timed interval. Every call starts from the
    // same immutable base; fixture and payload construction are excluded.
    produce(api, base, scenario, context, strategy, autoFreeze);
    replay(api, base, patches, autoFreeze);
    const createStats = measure(
      () => produce(api, base, scenario, context, strategy, autoFreeze),
      samples
    );
    const forward = JSON.parse(JSON.stringify(patches));
    const inverse = JSON.parse(JSON.stringify(inversePatches));
    const [next] = checked.result;
    const applyStats = measure(
      () => api.apply(base, forward, { enableAutoFreeze: autoFreeze }),
      samples
    );
    const inverseApplyStats = measure(
      () => api.apply(next, inverse, { enableAutoFreeze: autoFreeze }),
      samples
    );
    const replayStats = measure(
      () => replay(api, base, patches, autoFreeze),
      samples
    );
    Object.assign(record, {
      createMs: createStats.median,
      applyMs: applyStats.median,
      inverseApplyMs: inverseApplyStats.median,
      stringifyParseApplyMs: replayStats.median,
      timings: {
        create: createStats,
        apply: applyStats,
        inverseApply: inverseApplyStats,
        stringifyParseApply: replayStats,
      },
      ...measureMemory(
        api,
        base,
        scenario,
        context,
        strategy,
        autoFreeze,
        Number(values['memory-iterations'])
      ),
    });
  }
  process.stdout.write(JSON.stringify(record));
}

function integer(values, name, minimum = 1) {
  const value = Number(values[name]);
  assert.ok(
    Number.isSafeInteger(value) && value >= minimum,
    `--${name} must be an integer >= ${minimum}`
  );
  return value;
}

function identity(directory) {
  const artifact = join(directory, 'dist', 'mutative.cjs.production.min.js');
  return {
    directory,
    version: JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8'))
      .version,
    productionSha256: createHash('sha256')
      .update(readFileSync(artifact))
      .digest('hex'),
  };
}

const timingMetrics = [
  'createMs',
  'applyMs',
  'inverseApplyMs',
  'stringifyParseApplyMs',
  'retainedHeapBytesPerOutput',
  'processMaxRssBytes',
];

export function summarize(records) {
  const groups = new Map();
  for (const record of records) {
    const key = `${record.scenario}\0${record.autoFreeze}\0${record.strategy}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(record);
  }
  return [...groups.values()].map((items) => {
    const first = items[0];
    const result = {
      scenario: first.scenario,
      strategy: first.strategy,
      autoFreeze: first.autoFreeze,
      scenarioClass: first.scenarioClass,
      runs: items.length,
    };
    for (const key of [
      'forwardPatches',
      'inversePatches',
      'forwardBytes',
      'inverseBytes',
      'retainedReferences',
    ]) {
      assert.ok(
        items.every((item) => item[key] === first[key]),
        key
      );
      result[key] = first[key];
    }
    result.retainedReferenceRatio = median(
      items.map((item) => item.retainedReferenceRatio)
    );
    for (const key of timingMetrics)
      result[key] = median(items.map((item) => item[key]));
    return result;
  });
}

function markdown(report) {
  const lines = [
    '# Compact array patch targeted benchmark',
    '',
    `Node ${report.environment.node}; array size ${report.config.arraySize}; contiguous block ${report.config.batchSize}; ${report.config.runs} isolated processes per cell.`,
    '',
    'Times are milliseconds (medians of per-process medians). Replay includes JSON stringify, parse and forward apply. Heap is output-attributable retained heap; max RSS is process-level and includes the harness.',
    '',
    '| Scenario | Freeze | Strategy | Scenario class | Patches F/I | JSON bytes F/I | Create | Apply | Inverse apply | Replay | Refs | Heap/output KiB | Max RSS MiB |',
    '| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
  ];
  for (const row of report.summary) {
    lines.push(
      `| ${row.scenario} | ${row.autoFreeze ? 'on' : 'off'} | ${row.strategy} | ${row.scenarioClass} | ${row.forwardPatches}/${row.inversePatches} | ${row.forwardBytes}/${row.inverseBytes} | ${row.createMs.toFixed(3)} | ${row.applyMs.toFixed(3)} | ${row.inverseApplyMs.toFixed(3)} | ${row.stringifyParseApplyMs.toFixed(3)} | ${row.retainedReferences} | ${(row.retainedHeapBytesPerOutput / 1024).toFixed(1)} | ${(row.processMaxRssBytes / 1048576).toFixed(1)} |`
    );
  }
  return `${lines.join('\n')}\n`;
}

export function markdownPath(output) {
  return output.endsWith('.json')
    ? output.replace(/\.json$/, '.md')
    : `${output}.md`;
}

function runParent(values) {
  const runs = integer(values, 'runs');
  const arraySize = integer(values, 'array-size', 10);
  const batchSize = integer(values, 'batch-size');
  assert.ok(
    batchSize <= Math.floor(arraySize / 4),
    '--batch-size is too large'
  );
  const samples = integer(values, 'samples');
  const memoryIterations = integer(values, 'memory-iterations');
  assert.ok(['off', 'on', 'both'].includes(values.freeze));
  const freezes = values.freeze === 'both' ? ['off', 'on'] : [values.freeze];
  const filter = new RegExp(values.filter);
  const scenarios = SCENARIOS.filter(({ name }) => filter.test(name));
  assert.ok(scenarios.length > 0, 'No scenarios selected');
  const candidateDir = resolve(values['candidate-dir']);
  const variants = [
    { strategy: 'index', directory: candidateDir },
    { strategy: 'compact', directory: candidateDir },
  ];
  const records = [];
  for (let run = 0; run < runs; run += 1) {
    for (const [scenarioIndex, scenario] of scenarios.entries()) {
      for (const freeze of freezes) {
        const ordered = [...variants];
        if ((run + scenarioIndex) % 2) ordered.reverse();
        for (const variant of ordered) {
          const args = [
            '--expose-gc',
            scriptPath,
            '--worker',
            '--candidate-dir',
            variant.directory,
            '--scenario',
            scenario.name,
            '--strategy',
            variant.strategy,
            '--freeze',
            freeze,
            '--array-size',
            String(arraySize),
            '--batch-size',
            String(batchSize),
            '--samples',
            String(samples),
            '--memory-iterations',
            String(memoryIterations),
          ];
          if (values.check) args.push('--check');
          const child = spawnSync(process.execPath, args, {
            cwd: root,
            encoding: 'utf8',
            env: { ...process.env, NODE_ENV: 'production' },
            maxBuffer: 10 * 1024 * 1024,
            timeout: 120000,
          });
          if (child.status !== 0) {
            process.stderr.write(child.stderr);
            throw new Error(
              `Worker failed: ${scenario.name}/${variant.strategy}/${freeze}`
            );
          }
          records.push({ ...JSON.parse(child.stdout), run });
        }
      }
    }
  }
  const report = {
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    environment: {
      node: process.version,
      v8: process.versions.v8,
      platform: process.platform,
      arch: process.arch,
      cpu: cpus()[0]?.model,
    },
    candidate: identity(candidateDir),
    methodology: {
      processIsolation: 'one scenario/strategy/freeze/run per process',
      ordering: 'variant order alternates by run and scenario',
      productionArtifact: 'dist/mutative.cjs.production.min.js',
      patchOptions:
        'pathAsArray:false, arrayLengthAssignment:false; autoFreeze varies',
      timing:
        'per-process median, then median of independent process medians; fixture setup and validation excluded',
      replay: 'JSON stringify + parse + forward apply',
      memory:
        'retained live-output heap minus post-release heap, with three GC readings at each snapshot; max RSS includes the whole worker',
      coverage:
        'synthetic operation matrix, not real application telemetry or an insertion-plan hit-rate estimate',
      checkOnly: values.check,
    },
    config: {
      runs,
      arraySize,
      batchSize,
      samples,
      memoryIterations,
      freezes,
      filter: values.filter,
    },
    records,
    ...(values.check ? {} : { summary: summarize(records) }),
  };
  if (values.output) {
    const output = resolve(values.output);
    mkdirSync(dirname(output), { recursive: true });
    writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
    if (!values.check) writeFileSync(markdownPath(output), markdown(report));
  }
  if (values.check) {
    console.log(
      `Checked ${records.length} scenario/strategy/freeze cells on production artifacts.`
    );
  } else {
    console.log(markdown(report));
    if (values.output) console.log(`Report: ${resolve(values.output)}`);
  }
}

const optionDefinitions = {
  worker: { type: 'boolean', default: false },
  check: { type: 'boolean', default: false },
  'candidate-dir': { type: 'string', default: root },
  scenario: { type: 'string', default: '' },
  strategy: { type: 'string', default: 'index' },
  freeze: { type: 'string', default: 'off' },
  runs: { type: 'string', default: '3' },
  'array-size': { type: 'string', default: '10000' },
  'batch-size': { type: 'string', default: '1000' },
  samples: { type: 'string', default: '7' },
  'memory-iterations': { type: 'string', default: '4' },
  filter: { type: 'string', default: '.*' },
  output: {
    type: 'string',
    default: 'perf-testing/results/array-patch-compact.json',
  },
};

if (resolve(process.argv[1] || '') === scriptPath) {
  const { values } = parseArgs({ options: optionDefinitions });
  if (values.worker) {
    assert.ok(['index', 'compact'].includes(values.strategy));
    assert.ok(['off', 'on'].includes(values.freeze));
    runWorker(values);
  } else {
    runParent(values);
  }
}
