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
