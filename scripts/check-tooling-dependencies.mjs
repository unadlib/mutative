// Exercise the APIs used by tools whose transitive dependencies are overridden.
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { rimraf, rimrafSync } from 'rimraf';

const require = createRequire(import.meta.url);
const commitizenRequire = createRequire(
  require.resolve('commitizen/package.json')
);
const glob = commitizenRequire('glob');
const findup = require('commitizen/dist/configLoader/findup.js').default;
const { glob: typedocGlob } = await import(
  pathToFileURL(
    join(
      dirname(require.resolve('typedoc/package.json')),
      'dist/lib/utils/fs.js'
    )
  )
);
const fixture = await mkdtemp(join(tmpdir(), 'mutative-tooling-'));

try {
  await mkdir(join(fixture, 'nested/deep'), { recursive: true });
  for (const file of [
    'package.json',
    '.czrc',
    'a.txt',
    'b.md',
    'literal[1].txt',
    'nested/c.txt',
    'nested/deep/d.txt',
  ]) {
    await writeFile(join(fixture, file), '{}');
  }

  const options = { cwd: fixture };
  for (const [pattern, extra, expected] of [
    [
      '**/*.txt',
      {},
      ['a.txt', 'literal[1].txt', 'nested/c.txt', 'nested/deep/d.txt'],
    ],
    ['*.{txt,md}', {}, ['a.txt', 'b.md', 'literal[1].txt']],
    ['@(a|b).*', {}, ['a.txt', 'b.md']],
    ['literal\\[1\\].txt', {}, ['literal[1].txt']],
    [
      '*.txt',
      { matchBase: true },
      ['a.txt', 'literal[1].txt', 'nested/c.txt', 'nested/deep/d.txt'],
    ],
    ['.czrc', {}, ['.czrc']],
  ]) {
    assert.deepEqual(
      glob.sync(pattern, { ...options, ...extra }).sort(),
      expected
    );
    assert.deepEqual(
      (await glob.glob(pattern, { ...options, ...extra })).sort(),
      expected
    );
  }
  assert.equal(
    findup(['.czrc'], { cwd: join(fixture, 'nested/deep') }, () => true),
    join(fixture, '.czrc')
  );
  assert.equal(
    findup(['package.json', '.czrc'], { cwd: fixture, nocase: true }, (path) =>
      path.endsWith('.czrc')
    ),
    join(fixture, '.czrc')
  );
  await mkdir(join(fixture, 'node_modules'), { recursive: true });
  await writeFile(join(fixture, 'node_modules/ignored.txt'), 'ignored');
  for (const [pattern, expected] of [
    [
      '**/*.txt',
      ['a.txt', 'literal[1].txt', 'nested/c.txt', 'nested/deep/d.txt'],
    ],
    ['{nested/*.txt,*.md}', ['b.md', 'nested/c.txt']],
  ]) {
    assert.deepEqual(
      typedocGlob(join(fixture, pattern), fixture).sort(),
      expected.map((file) => join(fixture, file)).sort()
    );
  }
  await rm(join(fixture, 'node_modules'), { recursive: true });

  // Both rimraf APIs must still expand globs and preserve nonmatching files.
  assert.equal(
    await rimraf(join(fixture, 'nested/**/*.txt'), { glob: true }),
    true
  );
  assert.deepEqual(glob.sync('nested/**/*.txt', options), []);
  assert.equal(rimrafSync(join(fixture, '*.txt'), { glob: true }), true);
  assert.deepEqual(glob.sync('**/*.txt', options), []);
  assert.equal(await readFile(join(fixture, 'b.md'), 'utf8'), '{}');
  console.log(
    'Commitizen config discovery, TypeDoc glob matching, and rimraf compatibility passed.'
  );
} finally {
  await rm(fixture, { recursive: true, force: true });
}
