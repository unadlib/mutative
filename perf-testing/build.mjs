import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const directory = dirname(fileURLToPath(import.meta.url));
const root = dirname(directory);
const require = createRequire(import.meta.url);
const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const immerManifestPath = require.resolve('immer/package.json');
const immerManifest = JSON.parse(readFileSync(immerManifestPath, 'utf8'));
const mitataManifest = JSON.parse(
  readFileSync(require.resolve('mitata/package.json'), 'utf8')
);
assert.equal(
  immerManifest.version,
  manifest.devDependencies.immer,
  'Install the pinned Immer version'
);
const inputs = {
  mutative: join(root, 'dist/mutative.cjs.production.min.js'),
  immer: join(dirname(immerManifestPath), 'dist/immer.production.mjs'),
};
const sha256 = (data) => createHash('sha256').update(data).digest('hex');
const git = (...args) =>
  execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const sourcePaths = git('ls-files', 'src').split('\n').sort();
const sourceHash = createHash('sha256');
for (const sourcePath of sourcePaths) {
  sourceHash
    .update(sourcePath)
    .update('\0')
    .update(readFileSync(join(root, sourcePath)))
    .update('\0');
}
const gitStatus = git('status', '--porcelain');
const buildInfo = {
  builtAt: new Date().toISOString(),
  gitRevision: git('rev-parse', 'HEAD'),
  gitDirty: Boolean(gitStatus),
  gitStatus,
  mutativeSourceSha256: sourceHash.digest('hex'),
  versions: {
    mutative: manifest.version,
    immer: immerManifest.version,
    mitata: mitataManifest.version,
  },
  productionInputs: Object.fromEntries(
    Object.entries(inputs).map(([name, input]) => [
      name,
      { path: relative(root, input), sha256: sha256(readFileSync(input)) },
    ])
  ),
  arrayMethodsEnabled: false,
};

await build({
  absWorkingDir: root,
  entryPoints: [
    join(directory, 'immutability-benchmarks.mjs'),
    join(directory, 'immutability-profiling.mjs'),
  ],
  outdir: join(directory, 'dist'),
  outExtension: { '.js': '.mjs' },
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node22',
  sourcemap: true,
  external: ['mitata'],
  alias: inputs,
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    __BENCHMARK_BUILD__: JSON.stringify(buildInfo),
  },
  logLevel: 'info',
});
console.log(
  `Benchmark inputs: local Mutative ${manifest.version}, installed Immer ${immerManifest.version}; production, array methods disabled.`
);
