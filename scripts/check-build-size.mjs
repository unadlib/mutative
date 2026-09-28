import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brotliCompressSync, gzipSync } from 'node:zlib';
import { build, version as esbuildVersion } from 'esbuild';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const baselinePath = join(root, 'scripts/build-size-baseline.json');
const artifacts = [
  'mutative.cjs.production.min.js',
  'mutative.umd.production.min.js',
  'mutative.cjs.development.js',
  'mutative.umd.development.js',
  'mutative.esm.js',
  'mutative.esm.mjs',
];
const scenarios = {
  create: {
    imports: '{ create }',
    body: 'console.log(create({ count: 1 }, draft => { draft.count += 1; }));',
  },
  patches: {
    imports: '{ create, apply }',
    body: `const base = { count: 1 };
      const [next, patches, inverse] = create(base, draft => { draft.count += 1; }, { enablePatches: true });
      console.log(next, apply(base, patches), apply(next, inverse));`,
  },
  all: { imports: '* as api', body: 'console.log(api);' },
};

function sizes(code) {
  const bytes = Buffer.from(code);
  return {
    raw: bytes.length,
    gzip: gzipSync(bytes, { level: 9 }).length,
    brotli: brotliCompressSync(bytes).length,
  };
}

async function measure(directory) {
  const results = {};
  for (const name of artifacts) {
    results[`artifact/${name}`] = sizes(
      readFileSync(join(directory, 'dist', name))
    );
  }
  const manifest = JSON.parse(
    readFileSync(join(directory, 'package.json'), 'utf8')
  );
  for (const mode of ['import', 'require']) {
    const condition = manifest.exports['.'][mode];
    const entry = resolve(
      directory,
      typeof condition === 'string' ? condition : condition.default
    );
    for (const [name, scenario] of Object.entries(scenarios)) {
      const imports =
        mode === 'import'
          ? `import ${scenario.imports} from ${JSON.stringify(entry)};`
          : `const ${name === 'all' ? 'api' : scenario.imports} = require(${JSON.stringify(entry)});`;
      const result = await build({
        stdin: {
          contents: `${imports}\n${scenario.body}`,
          resolveDir: directory,
        },
        bundle: true,
        write: false,
        minify: true,
        treeShaking: true,
        target: 'es2015',
        platform: 'browser',
        format: 'esm',
        legalComments: 'none',
        define: { 'process.env.NODE_ENV': '"production"' },
      });
      results[`consumer/${mode}/${name}`] = sizes(
        result.outputFiles[0].contents
      );
    }
  }
  return results;
}

const args = process.argv.slice(2);
if (args[0] === '--measure' && args.length === 2) {
  // Print measurements only. Updating an accepted baseline is a separate,
  // reviewed change; ordinary builds and checks must never rewrite it.
  console.log(
    JSON.stringify(
      {
        esbuild: esbuildVersion,
        measurements: await measure(resolve(args[1])),
      },
      null,
      2
    )
  );
} else {
  assert.ok(
    args.length === 0 || (args[0] === '--check' && args.length === 2),
    'Usage: node scripts/check-build-size.mjs [--measure|--check <checkout>]'
  );
  const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
  assert.equal(
    esbuildVersion,
    baseline.esbuild,
    'Changing the consumer bundler requires a baseline review'
  );
  const current = await measure(args.length ? resolve(args[1]) : root);
  assert.deepEqual(Object.keys(current), Object.keys(baseline.measurements));
  const failures = [];
  const rows = [];
  for (const [name, actual] of Object.entries(current)) {
    const previous = baseline.measurements[name];
    rows.push({
      case: name,
      gzip: actual.gzip,
      'gzip delta': actual.gzip - previous.gzip,
      brotli: actual.brotli,
      'brotli delta': actual.brotli - previous.brotli,
    });
    for (const metric of ['raw', 'gzip', 'brotli']) {
      const growth = actual[metric] - previous[metric];
      // Require BOTH limits: small bundles cannot grow by a large percentage,
      // and large bundles cannot consume an arbitrarily large byte allowance.
      const allowance = Math.min(
        baseline.budget.maxGrowthBytes,
        (previous[metric] * baseline.budget.maxGrowthPercent) / 100
      );
      if (growth > allowance) {
        failures.push(
          `${name} ${metric}: ${previous[metric]} -> ${actual[metric]} (+${growth} bytes, allowed ${Math.floor(allowance)})`
        );
      }
    }
  }
  console.table(rows);
  assert.equal(
    failures.length,
    0,
    `Build size regressed from ${baseline.reference.revision}:\n${failures.join('\n')}`
  );
  console.log('Artifact and consumer size checks passed.');
}
