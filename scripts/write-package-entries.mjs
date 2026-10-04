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
// exports are named because `export *` from CommonJS also re-exports the
// `module.exports` name that Node.js adds.
const names = Object.keys(require('../dist/mutative.cjs.development'));
writeFileSync(
  'dist/index.mjs',
  `export { ${names.sort().join(', ')} } from './index.js';\n`
);

// The ESM facade gives NodeNext a declaration with the same module kind as
// mutative.esm.mjs while reusing the complete declaration tree from tsc.
writeFileSync('dist/index.d.mts', "export * from './index.js';\n");
