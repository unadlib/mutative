import { defineConfig } from 'tsdown';
import { analyzer, unstableRolldownAdapter } from 'vite-bundle-analyzer';
import { typescript, terser } from './scripts/build-plugins.mjs';

const compiler = typescript();

// The fourth column fixes `__DEV__` at build time. The ESM artifacts, which
// bundlers resolve, leave it to the consumer (`null`): every check compares
// `process.env.NODE_ENV`, which bundlers replace, so production bundles drop
// the development code. A constant read once is not enough, as webpack keeps
// the development code of namespace and dynamic imports when the checks go
// through it. Node.js reads the variable once through the CJS entry instead,
// and browsers without a bundler load the production ESM artifact.
const variants = [
  ['cjs-production', 'cjs', 'mutative.cjs.production.min.js', false, true],
  ['umd-production', 'umd', 'mutative.umd.production.min.js', false, true],
  ['esm-production', 'esm', 'mutative.esm.production.min.mjs', false, true],
  ['cjs-development', 'cjs', 'mutative.cjs.development.js', true, false],
  ['esm', 'esm', 'mutative.esm.js', null, false],
  ['esm-mjs', 'esm', 'mutative.esm.mjs', null, false],
  ['umd-development', 'umd', 'mutative.umd.development.js', true, false],
];

export default defineConfig(
  variants.map(([name, format, fileName, development, minify]) => ({
    name,
    entry: 'src/index.ts',
    format,
    outDir: 'dist',
    clean: false,
    dts: false,
    exports: false,
    platform: format === 'cjs' ? 'node' : 'browser',
    target: 'es2018',
    sourcemap: true,
    minify: false,
    define: {
      __DEV__:
        development === null
          ? '(process.env.NODE_ENV !== "production")'
          : String(development),
    },
    globalName: format === 'umd' ? 'Mutative' : undefined,
    outputOptions: {
      entryFileNames: fileName,
      sourcemapExcludeSources: true,
      strict: true,
      generatedCode: { symbols: false },
    },
    plugins: [
      compiler(),
      ...(minify ? [terser()] : []),
      ...(process.env.ANALYZE === 'true' && name === 'esm'
        ? [
            unstableRolldownAdapter(
              analyzer({ analyzerMode: 'static', openAnalyzer: false })
            ),
          ]
        : []),
    ],
  }))
);
