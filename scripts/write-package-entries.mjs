import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

writeFileSync(
  'dist/index.js',
  `
'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./mutative.cjs.production.min.js')
} else {
  module.exports = require('./mutative.cjs.development.js')
}
`
);

// Node.js imports the CJS entry, which reads `process.env.NODE_ENV` once,
// instead of the bundler ESM artifacts, which check it at every use. The
// entry takes the CJS exports object as its default import and names the
// exports itself: Node.js before 14.13, which `engines` allows, cannot name
// the exports of a CommonJS module.
const api = require('../dist/mutative.cjs.development');
// A bundler that resolves this entry and follows the `__esModule` convention
// would import `exports.default` instead of the exports object.
assert.ok(!('__esModule' in api), 'The CJS bundle must not set __esModule');
writeFileSync(
  'dist/index.mjs',
  `import mutative from './index.js';\n\nexport const { ${Object.keys(api).sort().join(', ')} } = mutative;\n`
);

// The ESM facade gives NodeNext a declaration with the same module kind as
// mutative.esm.mjs while reusing the complete declaration tree from tsc.
writeFileSync('dist/index.d.mts', "export * from './index.js';\n");
