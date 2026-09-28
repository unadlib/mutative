import { writeFileSync } from 'node:fs';

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

// The ESM facade gives NodeNext a declaration with the same module kind as
// mutative.esm.mjs while reusing the complete declaration tree from tsc.
writeFileSync('dist/index.d.mts', "export * from './index.js';\n");
