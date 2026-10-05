import { spawn, execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const fixture = mkdtempSync(join(tmpdir(), 'mutative-watch-'));
let child;
let log = '';
let completed = 0;
let exited = false;
let pending;
const changed = () => pending?.();

async function until(predicate, description) {
  if (predicate()) return;
  await new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => finish(new Error(`Timed out: ${description}\n${log}`)),
      30000
    );
    const finish = (error) => {
      clearTimeout(timer);
      pending = undefined;
      if (error) reject(error);
      else resolve();
    };
    pending = () => {
      if (predicate()) finish();
      else if (exited)
        finish(new Error(`Watcher exited: ${description}\n${log}`));
    };
    pending();
  });
}

function verify(value) {
  execFileSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `
    import assert from 'node:assert/strict';
    import { createRequire } from 'node:module';
    import { value } from ${JSON.stringify(pathToFileURL(join(fixture, 'dist/esm.mjs')).href)};
    assert.equal(value(), ${value});
    assert.equal(createRequire(import.meta.url)(${JSON.stringify(join(fixture, 'dist/cjs.cjs'))}).value(), ${value});
  `,
    ],
    { stdio: 'pipe' }
  );
}

async function edit(file, text, expected) {
  const before = completed;
  writeFileSync(join(fixture, file), text);
  await rebuilt(expected, before, `both variants rebuild after ${file}`);
}

async function rebuilt(expected, before, description) {
  let outputError;
  try {
    await until(() => {
      if (completed < before + 2) return false;
      // Queued rebuilds can finish after the next edit starts. Their logs
      // do not establish that both variants contain the latest source.
      try {
        verify(expected);
        return true;
      } catch (error) {
        outputError = error;
        return false;
      }
    }, description);
  } catch (error) {
    if (outputError) error.cause = outputError;
    throw error;
  }
}

try {
  mkdirSync(join(fixture, 'src'));
  writeFileSync(
    join(fixture, 'package.json'),
    '{"private":true,"type":"module"}'
  );
  writeFileSync(
    join(fixture, 'tsconfig.json'),
    JSON.stringify({
      include: ['src'],
      compilerOptions: {
        target: 'ES2015',
        module: 'ESNext',
        moduleResolution: 'node',
        strict: true,
        types: [],
        skipLibCheck: true,
      },
    })
  );
  writeFileSync(
    join(fixture, 'src/index.ts'),
    "export { value } from './value';\n"
  );
  writeFileSync(
    join(fixture, 'src/constants.ts'),
    'export const enum Counter { Current = 1 }\n'
  );
  writeFileSync(
    join(fixture, 'src/value.ts'),
    "import { Counter } from './constants'; export function value(): number { return Counter.Current; }\n"
  );
  writeFileSync(
    join(fixture, 'tsdown.config.mjs'),
    `
    import { typescript } from ${JSON.stringify(pathToFileURL(join(root, 'scripts/build-plugins.mjs')).href)};
    const compiler = typescript();
    export default ['esm', 'cjs'].map(format => ({
      name: format, entry: 'src/index.ts', format, dts: false, exports: false,
      clean: false, plugins: [compiler()],
      outputOptions: { entryFileNames: format === 'esm' ? 'esm.mjs' : 'cjs.cjs', strict: true },
    }));
  `
  );
  child = spawn(
    process.execPath,
    [join(root, 'node_modules/tsdown/dist/run.mjs'), '--watch'],
    {
      cwd: fixture,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, NO_COLOR: '1' },
    }
  );
  const onData = (chunk) => {
    log += chunk.toString();
    completed = (log.match(/Rebuilt in/g) ?? []).length;
    changed();
  };
  child.stdout.on('data', onData);
  child.stderr.on('data', onData);
  child.on('error', (error) => {
    log += String(error);
    exited = true;
    changed();
  });
  child.on('exit', () => {
    exited = true;
    changed();
  });
  await rebuilt(1, 0, 'initial build');
  await edit(
    'src/value.ts',
    "import { Counter } from './constants'; export function value(): number { return Counter.Current + 10; }\n",
    11
  );
  await edit(
    'src/constants.ts',
    'export const enum Counter { Current = 2 }\n',
    12
  );

  // A failed compilation must not poison the cache or prevent recovery.
  writeFileSync(
    join(fixture, 'src/constants.ts'),
    'export const enum Counter { Current = missingName }\n'
  );
  await until(() => log.includes('Cannot find name'), 'type error is reported');
  await edit(
    'src/constants.ts',
    'export const enum Counter { Current = 3 }\n',
    13
  );

  // Re-read the program graph when a new module is introduced, then watch it.
  writeFileSync(join(fixture, 'src/extra.ts'), 'export const extra = 20;\n');
  await edit(
    'src/value.ts',
    "import { Counter } from './constants'; import { extra } from './extra'; export function value(): number { return Counter.Current + extra; }\n",
    23
  );
  await edit('src/extra.ts', 'export const extra = 30;\n', 33);
  console.log(
    'Watch checks passed: source edits, const enums, error recovery, and new dependencies in both formats.'
  );
} finally {
  if (child && !exited) {
    await new Promise((resolve) => {
      const timer = setTimeout(() => child.kill('SIGKILL'), 5000);
      child.once('exit', () => {
        clearTimeout(timer);
        resolve();
      });
      child.kill('SIGTERM');
    });
  }
  rmSync(fixture, { recursive: true, force: true });
}
