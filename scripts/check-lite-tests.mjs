// Runs the test suite with the constants of `mutative/lite`, which leave out
// Map and Set drafts, patch generation and native array methods (see
// `vitest.lite.config.mts`). Every test must pass, or fail only because it
// needs one of those features: it threw an error of the lite build, or it
// checks a guarantee that only native array methods give.
//
// Usage: node scripts/check-lite-tests.mjs [test filters]

import { relative } from 'node:path';
import { startVitest } from 'vitest/node';

const liteError =
  /mutative\/lite does not (draft Maps or Sets|generate patches)|Minified Mutative error #2[23]\b/;

// Native array methods never read a property of the value that a search looks
// for, and native moves are what these tests count lookups of. Through the
// draft proxy, the methods return the same results.
const nativeArrayMethodTests = [
  ['test/array-methods-edge.test.ts', /does not inspect an external Proxy/],
  [
    'test/array-moved-elements.test.ts',
    /does not index the original array|is not searched for/,
  ],
];

const vitest = await startVitest('test', process.argv.slice(2), {
  config: 'vitest.lite.config.mts',
  watch: false,
  reporters: ['dot'],
});

let passed = 0;
const lite = [];
const native = [];
const unexpected = [];

function classify(file, name, errors) {
  const text = errors
    .flatMap((error) => [
      error.message,
      error.actual,
      error.expected,
      error.diff,
    ])
    .filter((part) => typeof part === 'string')
    .join('\n');
  const id = `${file} > ${name}`;
  if (liteError.test(text)) {
    lite.push(id);
  } else if (
    nativeArrayMethodTests.some(
      ([path, pattern]) => path === file && pattern.test(name)
    )
  ) {
    native.push(id);
  } else {
    unexpected.push(`${id}\n    ${text.split('\n')[0]}`);
  }
}

function visit(file, task, path) {
  const name = path ? `${path} > ${task.name}` : task.name;
  if (task.type === 'test') {
    if (task.result?.state === 'pass') passed += 1;
    else if (task.result?.state === 'fail') {
      classify(file, name, task.result.errors ?? []);
    }
    return;
  }
  // A suite fails on its own when a hook or its collection throws.
  if (task.result?.state === 'fail' && task.result.errors?.length) {
    classify(file, name, task.result.errors);
  }
  for (const child of task.tasks ?? []) visit(file, child, name);
}

for (const file of vitest.state.getFiles()) {
  const path = relative(process.cwd(), file.filepath);
  if (file.result?.errors?.length) classify(path, '(file)', file.result.errors);
  for (const task of file.tasks) visit(path, task, '');
}
const unhandled = vitest.state.getUnhandledErrors();
await vitest.close();

console.log(
  `\nmutative/lite: ${passed} tests passed, ${lite.length} failed with an error of the lite build, ${native.length} check native array methods.`
);
for (const id of native) console.log(`  native array methods: ${id}`);
if (unexpected.length || unhandled.length) {
  console.error(
    `\n${unexpected.length} tests failed without an error of the lite build:`
  );
  for (const message of unexpected) console.error(`  ${message}`);
  if (unhandled.length) {
    console.error(`${unhandled.length} unhandled errors.`);
  }
  process.exitCode = 1;
} else {
  process.exitCode = 0;
}
