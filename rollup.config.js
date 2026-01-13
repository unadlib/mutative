import fs from 'fs';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import pkg from './package.json';
import { adapter as analyzerAdapterForRollup, analyzer } from 'vite-bundle-analyzer';

export default [
  {
    input: 'src/index.ts',
    output: [
      {
        format: 'cjs',
        file: 'dist/mutative.cjs.production.min.js',
        sourcemap: true,
        plugins: [terser()],
      },
      {
        format: 'umd',
        name: pkg.name
          .split('-')
          .map(([s, ...rest]) => [s.toUpperCase(), ...rest].join(''))
          .join(''),
        file: pkg.unpkg,
        sourcemap: true,
        plugins: [terser()],
      },
    ],
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        declaration: true,
        declarationDir: 'dist',
      }),
      replace({
        __DEV__: 'false',
        preventAssignment: true,
      }),
    ],
  },
  {
    input: 'src/index.ts',
    output: [
      {
        format: 'cjs',
        file: 'dist/mutative.cjs.development.js',
        sourcemap: true,
      },
      {
        format: 'es',
        file: 'dist/mutative.esm.js',
        sourcemap: true,
      },
      {
        format: 'es',
        file: 'dist/mutative.esm.mjs',
        sourcemap: true,
      },
      {
        format: 'umd',
        name: pkg.name
          .split('-')
          .map(([s, ...rest]) => [s.toUpperCase(), ...rest].join(''))
          .join(''),
        file: pkg.unpkg.replace('.production.min.js', '.development.js'),
        sourcemap: true,
      },
    ],
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        declaration: true,
        declarationDir: 'dist',
      }),
      replace({
        __DEV__: 'true',
        preventAssignment: true,
      }),
      process.env.ANALYZE === 'true' && analyzerAdapterForRollup(analyzer({
        analyzerMode: 'static',
        openAnalyzer: true,
      })),
      {
        name: 'create-cjs-index',
        buildEnd: () => {
          fs.writeFileSync(
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
        },
      },
    ],
  },
];
