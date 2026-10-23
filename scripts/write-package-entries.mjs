import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// The entries of `mutative` and of `mutative/lite`, with the prefix of their
// bundles and the exports of their CJS development bundle.
for (const [entry, prefix, api] of [
  ['index', 'mutative', require('../dist/mutative.cjs.development')],
  ['lite', 'mutative.lite', require('../dist/mutative.lite.cjs.development')],
]) {
  writeFileSync(
    `dist/${entry}.js`,
    `
'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./${prefix}.cjs.production.min.js')
} else {
  module.exports = require('./${prefix}.cjs.development.js')
}
`
  );

  // A bundler that resolves the Node.js ESM entry and follows the
  // `__esModule` convention would import `exports.default` instead of the
  // exports object.
  assert.ok(!('__esModule' in api), 'The CJS bundle must not set __esModule');
  // Node.js imports the CJS entry, which reads `process.env.NODE_ENV` once,
  // instead of the bundler ESM artifacts, which check it at every use. The
  // entry takes the CJS exports object as its default import and names the
  // exports itself: Node.js before 14.13, which `engines` allows, cannot name
  // the exports of a CommonJS module.
  writeFileSync(
    `dist/${entry}.mjs`,
    `import mutative from './${entry}.js';\n\nexport const { ${Object.keys(api).sort().join(', ')} } = mutative;\n`
  );

  // The ESM facade gives NodeNext a declaration with the same module kind as
  // the ESM artifact while reusing the complete declaration tree from tsc.
  writeFileSync(`dist/${entry}.d.mts`, `export * from './${entry}.js';\n`);
}
