import { parseArgs } from 'node:util';
import { DEFAULT_CONFIG } from './workloads.mjs';

export function readOptions(defaults = {}) {
  const { values } = parseArgs({
    options: {
      runs: { type: 'string', default: '3' },
      filter: { type: 'string', default: '.*' },
      freeze: { type: 'string', default: defaults.freeze ?? 'both' },
      patches: { type: 'string', default: defaults.patches ?? 'off' },
      library: { type: 'string', default: defaults.library ?? 'all' },
      'array-size': {
        type: 'string',
        default: String(DEFAULT_CONFIG.arraySize),
      },
      'nested-array-size': {
        type: 'string',
        default: String(DEFAULT_CONFIG.nestedArraySize),
      },
      'object-size-1': {
        type: 'string',
        default: String(DEFAULT_CONFIG.largeObjectSize1),
      },
      'object-size-2': {
        type: 'string',
        default: String(DEFAULT_CONFIG.largeObjectSize2),
      },
      'reuse-iterations': {
        type: 'string',
        default: String(DEFAULT_CONFIG.reuseStateIterations),
      },
      'rtkq-count': {
        type: 'string',
        default: String(DEFAULT_CONFIG.rtkqCount),
      },
      output: { type: 'string' },
      iterations: { type: 'string', default: '1000' },
      check: { type: 'boolean', default: false },
      list: { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
  });
  if (values.help) {
    console.log(`Usage: pnpm ${defaults.command ?? 'benchmark:immer'} [options]
  --runs N                 Independent processes (default: 3)
  --filter REGEX           Scenario names (default: all 21 scenarios)
  --freeze both|off|on     Matched auto-freeze modes (default: ${defaults.freeze ?? 'both'})
  --patches both|off|on    Generate forward and inverse patches (default: ${defaults.patches ?? 'off'})
  --library all|both|mutative|mutative-v1|immer (default: ${defaults.library ?? 'all'})
                           all = candidate + pinned v1 + Immer; both = candidate + Immer
  --array-size N           Default: 100; minimum: 10
  --nested-array-size N    Default: 10
  --object-size-1 N        Default: 1000
  --object-size-2 N        Default: 3000
  --reuse-iterations N     Default: 10
  --rtkq-count N           Default: 100 (200 reducer calls)
  --output PATH            Report JSON path; also writes Markdown
  --check                  Validate workloads without timing
  --list                   List scenario names and reducer-call counts
  --iterations N           Profiling only (default: 1000)

Auto-freeze on uses pre-frozen inputs and payloads. Patches use array paths
and index removals in both libraries; application and serialization are not
timed. Array-method plugins are never enabled. Setup is excluded from timing.`);
    process.exit(0);
  }

  const integer = (key, minimum = 1) => {
    const value = Number(values[key]);
    if (!Number.isSafeInteger(value) || value < minimum) {
      throw new Error(`--${key} must be an integer >= ${minimum}`);
    }
    return value;
  };
  if (!['both', 'off', 'on'].includes(values.freeze)) {
    throw new Error('--freeze must be both, off, or on');
  }
  if (!['both', 'off', 'on'].includes(values.patches)) {
    throw new Error('--patches must be both, off, or on');
  }
  if (
    !['all', 'both', 'mutative', 'mutative-v1', 'immer'].includes(
      values.library
    )
  ) {
    throw new Error(
      '--library must be all, both, mutative, mutative-v1, or immer'
    );
  }
  // Validate now so an invalid regular expression fails before spawning workers.
  RegExp(values.filter);
  if (integer('reuse-iterations') > integer('array-size', 10)) {
    throw new Error('--reuse-iterations must not exceed --array-size');
  }
  return {
    runs: integer('runs'),
    iterations: integer('iterations'),
    filter: values.filter,
    freezes:
      values.freeze === 'both' ? [false, true] : [values.freeze === 'on'],
    patches:
      values.patches === 'both' ? [false, true] : [values.patches === 'on'],
    libraries:
      values.library === 'all'
        ? ['mutative', 'mutative-v1', 'immer']
        : values.library === 'both'
          ? ['mutative', 'immer']
          : [values.library],
    config: {
      arraySize: integer('array-size', 10),
      nestedArraySize: integer('nested-array-size'),
      largeObjectSize1: integer('object-size-1'),
      largeObjectSize2: integer('object-size-2'),
      multiUpdateCount: DEFAULT_CONFIG.multiUpdateCount,
      reuseStateIterations: integer('reuse-iterations'),
      rtkqCount: integer('rtkq-count'),
    },
    output: values.output,
    check: values.check,
    list: values.list,
  };
}
