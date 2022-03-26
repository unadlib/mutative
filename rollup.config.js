import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';

const isProduction = process.env.NODE_ENV === 'production';
const input = './dist/index.js';

export default isProduction
  ? {
      input,
      output: [
        {
          format: 'cjs',
          exports: 'auto',
          file: 'dist/index.cjs.js',
          sourcemap: true,
        },
        {
          format: 'umd',
          name: pkg.name
            .split('-')
            .map(([s, ...rest]) => [s.toUpperCase(), ...rest].join(''))
            .join(''),
          file: pkg.unpkg,
          sourcemap: true,
        },
      ],
      plugins: [
        resolve(),
        commonjs(),
        replace({
          __DEV__: 'false',
          preventAssignment: true,
        }),
        terser(),
      ],
    }
  : {
      input,
      output: [
        {
          format: 'cjs',
          exports: 'auto',
          file: 'dist/index.cjs.development.js',
          sourcemap: true,
        },
      ],
      plugins: [
        resolve(),
        commonjs(),
        replace({
          __DEV__: 'true',
          preventAssignment: true,
        }),
      ],
    };
