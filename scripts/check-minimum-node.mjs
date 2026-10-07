// Checks a packed tarball on the oldest Node.js version that `engines`
// allows: the CJS entry with `require`, the Node.js ESM entry with static and
// dynamic `import`, one shared instance, and a runtime test, in development
// and production. It only uses what Node.js 14.0 provides: no `node:`
// specifiers, no `assert/strict`, no top-level `await` and no `fs.rmSync`.
//
// Usage: node scripts/check-minimum-node.mjs <mutative-x.y.z.tgz>

import { strict as assert } from 'assert';
import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const tarball = process.argv[2];
assert.ok(tarball, 'Usage: node scripts/check-minimum-node.mjs <tarball>');

// Written into the consumer and run there. The runtime test returns the
// promise of an async recipe.
const files = {
  'runtime-test.cjs': `'use strict';
const assert = require('assert').strict;

module.exports = (api, mode) => {
  const roundTrip = (base, recipe) => {
    const [state, patches, inverse] = api.create(base, recipe, {
      enablePatches: true,
    });
    assert.deepEqual(api.apply(base, patches), state);
    assert.deepEqual(api.apply(state, inverse), base);
    return state;
  };
  const base = {
    a: { b: 1 },
    list: [{ id: 0 }, { id: 1 }, { id: 2 }],
    map: new Map([['k', { v: 1 }]]),
    set: new Set([{ v: 1 }]),
  };
  const state = roundTrip(base, (draft) => {
    draft.a.b = 2;
    draft.list.unshift(base.list[2]);
    assert.equal(draft.list[0], base.list[2]);
    assert.equal(draft.list.indexOf(base.list[2]), 0);
    draft.list.reverse();
    draft.list.splice(1, 1);
    draft.list[0].id = 9;
    draft.map.get('k').v = 2;
    draft.map.set('j', { v: 3 });
    assert.deepEqual(Array.from(draft.map.keys()), ['k', 'j']);
    for (const item of draft.set) item.v = 2;
    draft.set.add({ v: 3 });
    assert.deepEqual(api.current(draft.a), { b: 2 });
    assert.equal(api.original(draft.a), base.a);
  });
  assert.equal(state.a.b, 2);
  assert.equal(base.list[0].id, 0);
  assert.equal(state.map.get('k').v, 2);
  assert.equal(state.set.size, 2);
  const frozen = api.create(
    base,
    (draft) => {
      draft.map.set('i', {});
    },
    { enableAutoFreeze: true }
  );
  assert.ok(Object.isFrozen(frozen.map) && Object.isFrozen(frozen.a));
  const [regrown, , inverse] = api.create(
    [1, 2, 3],
    (draft) => {
      draft.pop();
      draft.reverse();
      draft.length = 3;
    },
    { enablePatches: true }
  );
  assert.deepEqual(Array.from(api.apply(regrown, inverse)), [1, 2, 3]);
  const strict = api.create(
    base,
    (draft) => {
      api.unsafe(() => {
        draft.list.unshift(base.list[1]);
      });
    },
    { strict: true }
  );
  assert.equal(strict.list[0], base.list[1]);
  class Point {
    constructor() {
      this.x = { v: 1 };
    }
  }
  const create = api.makeCreator({
    mark: (target) => (target instanceof Point ? 'immutable' : undefined),
  });
  const point = { point: new Point() };
  const moved = create(point, (draft) => {
    draft.point.x.v = 2;
  });
  assert.ok(moved.point instanceof Point);
  assert.equal(point.point.x.v, 1);
  const [draft, finalize] = api.create({ count: 1 });
  draft.count = 2;
  assert.deepEqual(finalize(), { count: 2 });
  assert.deepEqual(
    api.create(base, () => api.rawReturn({ replaced: true })),
    { replaced: true }
  );
  assert.throws(
    () => api.current({}),
    mode === 'production'
      ? /Minified Mutative error #7/
      : /current\\(\\) is only used for Draft/
  );
  const warn = console.warn;
  const warnings = [];
  console.warn = (message) => warnings.push(message);
  api.rawReturn(1);
  console.warn = warn;
  assert.equal(warnings.length, mode === 'production' ? 0 : 1);
  return api
    .create({ a: { b: 1 } }, async (draft) => {
      await Promise.resolve();
      draft.a.b = 2;
    })
    .then((result) => assert.equal(result.a.b, 2));
};
`,
  'check.cjs': `'use strict';
const api = require('mutative');

require('./runtime-test.cjs')(api, process.env.NODE_ENV).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
`,
  'check.mjs': `import assert from 'assert';
import { createRequire } from 'module';
import * as api from 'mutative';
import { create } from 'mutative';

const require = createRequire(import.meta.url);
const cjs = require('mutative');
// The ESM entry exports the functions of the CJS entry by name.
assert.deepStrictEqual(Object.keys(api).sort(), Object.keys(cjs).sort());
for (const name of Object.keys(cjs)) assert.strictEqual(api[name], cjs[name]);
assert.strictEqual(create, cjs.create);
require('./runtime-test.cjs')(api, process.env.NODE_ENV)
  .then(() => import('mutative'))
  .then((dynamic) => assert.strictEqual(dynamic.create, cjs.create))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
`,
};

function removeDirectory(directory) {
  if (fs.rmSync) fs.rmSync(directory, { recursive: true, force: true });
  else fs.rmdirSync(directory, { recursive: true });
}

const consumer = fs.mkdtempSync(
  path.join(os.tmpdir(), 'mutative-minimum-node-')
);
try {
  fs.writeFileSync(
    path.join(consumer, 'package.json'),
    JSON.stringify({ name: 'consumer', private: true })
  );
  execFileSync(
    'npm',
    ['install', '--no-audit', '--no-fund', '--silent', path.resolve(tarball)],
    { cwd: consumer, stdio: 'inherit' }
  );
  const manifest = JSON.parse(
    fs.readFileSync(
      path.join(consumer, 'node_modules', 'mutative', 'package.json'),
      'utf8'
    )
  );
  const floor = /^>=(\d+)\.(\d+)/.exec(manifest.engines.node);
  const [major, minor] = process.versions.node.split('.').map(Number);
  assert.ok(
    floor && Number(floor[1]) === major && Number(floor[2]) === minor,
    `Run this check with Node.js ${manifest.engines.node.slice(2)}, the oldest version that engines allows, not ${process.version}`
  );
  for (const [name, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(consumer, name), content);
  }
  for (const mode of ['development', 'production']) {
    for (const file of ['check.cjs', 'check.mjs']) {
      execFileSync(process.execPath, [file], {
        cwd: consumer,
        env: { ...process.env, NODE_ENV: mode },
        stdio: 'inherit',
      });
    }
  }
  console.log(
    `Minimum Node.js checks passed on ${process.version} for ${path.basename(tarball)}.`
  );
} finally {
  removeDirectory(consumer);
}
