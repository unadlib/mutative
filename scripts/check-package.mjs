import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { SourceMap } from 'node:module';
import { build } from 'esbuild';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const temporaryDirectory = mkdtempSync(join(tmpdir(), 'mutative-package-'));

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function run(command, args, cwd, env = process.env) {
  execFileSync(command, args, { cwd, env, stdio: 'inherit' });
}

try {
  const bundles = [
    'mutative.cjs.production.min.js',
    'mutative.umd.production.min.js',
    'mutative.esm.production.min.mjs',
    'mutative.cjs.development.js',
    'mutative.esm.js',
    'mutative.esm.mjs',
    'mutative.umd.development.js',
  ];
  const declarations = walk(join(root, 'src'))
    .filter((path) => path.endsWith('.ts'))
    .map((path) => relative(join(root, 'src'), path).replace(/\.ts$/, '.d.ts'));
  const expected = [
    'index.js',
    'index.mjs',
    'index.d.mts',
    ...declarations,
    ...bundles.flatMap((name) => [name, `${name}.map`]),
  ].sort();
  const actual = walk(join(root, 'dist'))
    .map((path) => relative(join(root, 'dist'), path))
    .sort();
  assert.deepEqual(
    actual,
    expected,
    'dist must contain the complete public build'
  );

  for (const field of [
    'main',
    'module',
    'umd:main',
    'unpkg',
    'jsdelivr',
    'jsnext:main',
    'react-native',
    'types',
  ]) {
    assert.ok(existsSync(join(root, manifest[field])), `${field} must exist`);
  }
  for (const branch of ['import', 'require']) {
    for (const condition of ['types', 'default']) {
      const target = manifest.exports['.'][branch][condition];
      assert.ok(
        existsSync(join(root, target)),
        `${branch}.${condition} must exist`
      );
    }
  }

  for (const name of bundles.filter((name) => name.includes('production'))) {
    const code = readFileSync(join(root, 'dist', name), 'utf8');
    assert.doesNotMatch(
      code,
      /__DEV__|ErrorCode|InvalidBaseState|console\.warn|\bprocess\b/
    );
    assert.match(code, /Minified Mutative error/);
  }

  // The ESM artifacts that bundlers resolve leave the environment to the
  // consumer: every development check compares `process.env.NODE_ENV`, which
  // bundlers replace, and nothing else reads `process`.
  for (const name of bundles.filter(
    (name) => name.startsWith('mutative.esm.') && !name.includes('production')
  )) {
    const code = readFileSync(join(root, 'dist', name), 'utf8');
    const checks = code.match(/process\.env\.NODE_ENV !== "production"/g);
    assert.ok(checks?.length, `${name} must check the environment`);
    assert.equal(code.match(/\bprocess\b/g).length, checks.length, name);
  }

  // Both the TypeScript transform and the minifier must map back to the
  // shipped TypeScript sources, not to intermediate JavaScript files.
  for (const name of bundles) {
    const code = readFileSync(join(root, 'dist', name), 'utf8');
    const map = JSON.parse(
      readFileSync(join(root, 'dist', `${name}.map`), 'utf8')
    );
    for (const source of map.sources) {
      assert.ok(
        source.startsWith('../src/'),
        `${name}: unexpected source ${source}`
      );
      assert.ok(
        existsSync(join(root, 'dist', source)),
        `${name}: missing source ${source}`
      );
    }
    const marker = name.includes('production')
      ? 'Minified Mutative error'
      : 'current() is only used for Draft';
    const offset = code.indexOf(marker);
    assert.ok(offset >= 0, `${name}: missing diagnostic marker`);
    const lines = code.slice(0, offset).split('\n');
    const entry = new SourceMap(map).findEntry(
      lines.length - 1,
      lines.at(-1).length
    );
    assert.equal(entry.originalSource, '../src/error.ts');
    const sourceLine = readFileSync(join(root, 'src/error.ts'), 'utf8').split(
      '\n'
    )[entry.originalLine];
    assert.ok(
      sourceLine.includes(marker),
      `${name}: incorrect source map location`
    );
  }

  const [pack] = JSON.parse(
    execFileSync(
      'npm',
      ['pack', '--json', '--pack-destination', temporaryDirectory],
      {
        cwd: root,
        encoding: 'utf8',
      }
    )
  );
  const packedFiles = new Set(pack.files.map((file) => file.path));
  for (const path of expected) {
    assert.ok(packedFiles.has(`dist/${path}`), `${path} must be packed`);
  }
  for (const path of walk(join(root, 'src'))) {
    assert.ok(
      packedFiles.has(`src/${relative(join(root, 'src'), path)}`),
      `${path} must be packed for source maps`
    );
  }
  const archive = join(temporaryDirectory, pack.filename);
  run('pnpm', ['exec', 'publint', archive, '--strict'], root);
  run('pnpm', ['exec', 'attw', archive, '--format', 'ascii'], root);

  const consumer = join(temporaryDirectory, 'consumer');
  mkdirSync(consumer);
  run(
    'npm',
    [
      'install',
      '--prefix',
      consumer,
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      '--package-lock=false',
      archive,
    ],
    root
  );

  const installed = join(consumer, 'node_modules', 'mutative');
  const expectedExports = [
    'apply',
    'castDraft',
    'castImmutable',
    'castMutable',
    'create',
    'current',
    'isDraft',
    'isDraftable',
    'makeCreator',
    'markSimpleObject',
    'original',
    'rawReturn',
    'unsafe',
  ];
  for (const mode of ['development', 'production']) {
    run(
      process.execPath,
      [
        '-e',
        `const assert = require('node:assert/strict');
         const api = require('mutative');
         assert.deepEqual(Object.keys(api).sort(), ${JSON.stringify(expectedExports)});
         assert.equal(api.create({ count: 1 }, (draft) => { draft.count = 2; }).count, 2);
         assert.throws(() => api.apply(Object.freeze({ count: 1 }), [{ op: 'replace', path: ['count'], value: 2 }], { mutable: true }), TypeError);
         assert.equal(require('mutative/dist/mutative.cjs.production.min.js').create({ count: 1 }, (draft) => { draft.count = 2; }).count, 2);
         assert.equal(require('mutative/dist/mutative.umd.production.min.js').create({ count: 1 }, (draft) => { draft.count = 2; }).count, 2);
         assert.throws(() => api.current({}), /${mode === 'production' ? 'Minified Mutative error #7' : 'current\\(\\) is only used for Draft'}/);
         const warnings = [];
         console.warn = (message) => warnings.push(message);
         api.rawReturn(1);
         assert.equal(warnings.length, ${mode === 'production' ? 0 : 1});`,
      ],
      consumer,
      { ...process.env, NODE_ENV: mode }
    );

    const umdName =
      mode === 'production'
        ? 'mutative.umd.production.min.js'
        : 'mutative.umd.development.js';
    const context = {};
    vm.runInNewContext(
      readFileSync(join(installed, 'dist', umdName), 'utf8'),
      context
    );
    assert.deepEqual(Object.keys(context.Mutative).sort(), expectedExports);
    assert.equal(
      vm.runInNewContext(
        'Mutative.create({ count: 1 }, (draft) => { draft.count = 2; }).count',
        context
      ),
      2
    );
    assert.throws(
      () => context.Mutative.current({}),
      mode === 'production'
        ? /Minified Mutative error #7/
        : /current\(\) is only used for Draft/
    );
    assert.throws(
      () =>
        vm.runInNewContext(
          "Mutative.apply(Object.freeze({ count: 1 }), [{ op: 'replace', path: ['count'], value: 2 }], { mutable: true })",
          context
        ),
      { name: 'TypeError' }
    );
  }

  for (const mode of ['development', 'production']) {
    run(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        `import assert from 'node:assert/strict';
         import * as api from 'mutative';
         import { createRequire } from 'node:module';
         // Node.js resolves the CJS entry, so import and require share one instance.
         assert.equal(createRequire(import.meta.url)('mutative').create, api.create);
         assert.deepEqual(Object.keys(api).sort(), ${JSON.stringify(expectedExports)});
         assert.equal(api.create({ count: 1 }, (draft) => { draft.count = 2; }).count, 2);
         assert.throws(() => api.apply(Object.freeze({ count: 1 }), [{ op: 'replace', path: ['count'], value: 2 }], { mutable: true }), TypeError);
         assert.throws(() => api.current({}), /${mode === 'production' ? 'Minified Mutative error #7' : 'current\\(\\) is only used for Draft'}/);
         const warnings = [];
         console.warn = (message) => warnings.push(message);
         api.rawReturn(1);
         assert.equal(warnings.length, ${mode === 'production' ? 0 : 1});
         const deep = await import('mutative/dist/mutative.esm.mjs');
         assert.equal(deep.create({ count: 1 }, (draft) => { draft.count = 2; }).count, 2);
         const browser = await import('mutative/dist/mutative.esm.production.min.mjs');
         assert.deepEqual(Object.keys(browser).sort(), ${JSON.stringify(expectedExports)});
         assert.equal(browser.create({ count: 1 }, (draft) => { draft.count = 2; }).count, 2);
         assert.throws(() => browser.current({}), /Minified Mutative error #7/);
         browser.rawReturn(1);
         assert.equal(warnings.length, ${mode === 'production' ? 0 : 1});`,
      ],
      consumer,
      { ...process.env, NODE_ENV: mode }
    );

    // Bundlers replace `process.env.NODE_ENV`: a production bundle of the
    // ESM entry drops the development code, and a development bundle keeps it.
    const { outputFiles } = await build({
      stdin: {
        contents: "import { current } from 'mutative';\nconsole.log(current);",
        resolveDir: consumer,
      },
      bundle: true,
      write: false,
      minify: true,
      format: 'esm',
      platform: 'browser',
      define: { 'process.env.NODE_ENV': JSON.stringify(mode) },
    });
    const bundle = outputFiles[0].text;
    assert.doesNotMatch(bundle, /\bprocess\b/);
    assert.equal(
      bundle.includes('current() is only used for Draft'),
      mode === 'development',
      `${mode} bundle of the ESM entry`
    );

    // Bundlers that target Node.js resolve the Node.js ESM entry, which takes
    // the exports object of the CJS entry as its default import.
    const nodeBundle = await build({
      stdin: {
        contents: `import * as api from 'mutative';
import { create } from 'mutative';
if (api.create !== create || Object.keys(api).length !== ${expectedExports.length}) throw new Error('exports');
console.log(create({ count: 1 }, (draft) => { draft.count = 2; }).count);`,
        resolveDir: consumer,
      },
      bundle: true,
      write: false,
      format: 'esm',
      platform: 'node',
    });
    writeFileSync(
      join(consumer, 'node-bundle.mjs'),
      nodeBundle.outputFiles[0].text
    );
    assert.equal(
      execFileSync(process.execPath, ['node-bundle.mjs'], {
        cwd: consumer,
        encoding: 'utf8',
        env: { ...process.env, NODE_ENV: mode },
      }).trim(),
      '2',
      `${mode} Node.js bundle of the ESM entry`
    );
  }

  const example = `import { create, type Draft, type Patch } from 'mutative';
const next = create({ count: 1 }, (draft: Draft<{ count: number }>) => {
  draft.count = 2;
});
const count: number = next.count;
declare const patch: Patch;
void count;
void patch;
`;
  writeFileSync(join(consumer, 'consumer.mts'), example);
  writeFileSync(join(consumer, 'consumer.cts'), example);
  writeFileSync(join(consumer, 'consumer.ts'), example);
  const compiler = join(root, 'node_modules', 'typescript', 'bin', 'tsc');
  run(
    process.execPath,
    [
      compiler,
      '--noEmit',
      '--strict',
      '--target',
      'es2018',
      '--module',
      'NodeNext',
      '--moduleResolution',
      'NodeNext',
      'consumer.mts',
      'consumer.cts',
    ],
    consumer
  );
  run(
    process.execPath,
    [
      compiler,
      '--noEmit',
      '--strict',
      '--target',
      'es2018',
      '--module',
      'ESNext',
      '--moduleResolution',
      'Bundler',
      'consumer.ts',
    ],
    consumer
  );
  console.log(
    `Packed consumer checks passed for ${pack.name}@${pack.version}.`
  );
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
