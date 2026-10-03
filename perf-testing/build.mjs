import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const directory = dirname(fileURLToPath(import.meta.url));
const root = dirname(directory);
const require = createRequire(import.meta.url);
const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const immerManifestPath = require.resolve('immer/package.json');
const immerManifest = JSON.parse(readFileSync(immerManifestPath, 'utf8'));
const v1ManifestPath = require.resolve('mutative-v1/package.json');
const v1Manifest = JSON.parse(readFileSync(v1ManifestPath, 'utf8'));
assert.equal(
  `npm:mutative@${v1Manifest.version}`,
  manifest.devDependencies['mutative-v1'],
  'Install the pinned Mutative v1 baseline'
);
assert.ok(v1Manifest.version.startsWith('1.'), 'The baseline must be v1');
const candidateRoot = resolve(process.env.MUTATIVE_PERF_CANDIDATE_DIR ?? root);
const candidateManifest = JSON.parse(
  readFileSync(join(candidateRoot, 'package.json'), 'utf8')
);
assert.equal(candidateManifest.name, 'mutative', 'Candidate must be Mutative');
const mitataManifest = JSON.parse(
  readFileSync(require.resolve('mitata/package.json'), 'utf8')
);
assert.equal(
  mitataManifest.version,
  manifest.devDependencies.mitata,
  'Install the pinned Mitata version'
);
assert.equal(
  immerManifest.version,
  manifest.devDependencies.immer,
  'Install the pinned Immer version'
);
const inputs = {
  mutative: join(candidateRoot, 'dist/mutative.cjs.production.min.js'),
  'mutative-v1': join(
    dirname(v1ManifestPath),
    'dist/mutative.cjs.production.min.js'
  ),
  immer: join(dirname(immerManifestPath), 'dist/immer.production.mjs'),
};
const sha256 = (data) => createHash('sha256').update(data).digest('hex');
const git = (...args) =>
  execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const candidateGit = (...args) =>
  execFileSync('git', args, { cwd: candidateRoot, encoding: 'utf8' }).trim();
const sourcePaths = candidateGit('ls-files', 'src').split('\n').sort();
const sourceHash = createHash('sha256');
for (const sourcePath of sourcePaths) {
  sourceHash
    .update(sourcePath)
    .update('\0')
    .update(readFileSync(join(candidateRoot, sourcePath)))
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
    mutative: candidateManifest.version,
    'mutative-v1': v1Manifest.version,
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
  candidate: {
    root: candidateRoot,
    gitRevision: candidateGit('rev-parse', 'HEAD'),
    gitStatus: candidateGit('status', '--porcelain'),
    version: candidateManifest.version,
    source: candidateRoot === root ? 'current checkout' : 'external checkout',
  },
};

await build({
  absWorkingDir: root,
  entryPoints: [
    join(directory, 'immutability-benchmarks.mjs'),
    join(directory, 'immutability-profiling.mjs'),
    join(directory, 'immutability-memory.mjs'),
  ],
  outdir: resolve(
    process.env.MUTATIVE_PERF_BUILD_DIR ?? join(directory, 'dist')
  ),
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
  `Benchmark inputs: candidate Mutative ${candidateManifest.version}, pinned Mutative v1 ${v1Manifest.version}, pinned Immer ${immerManifest.version}; production. Immer's array-method plugin is off unless a run passes --immer-array-methods.`
);
