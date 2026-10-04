import { defineConfig } from 'tsdown';
import { analyzer, unstableRolldownAdapter } from 'vite-bundle-analyzer';
import { typescript, terser } from './scripts/build-plugins.mjs';

const compiler = typescript();

// The fourth column fixes `__DEV__` at build time. The ESM artifacts, which
// bundlers resolve, leave it to the consumer (`null`): they read
// `process.env.NODE_ENV`, which bundlers replace, so production bundles drop
// the development code.
const variants = [
  ['cjs-production', 'cjs', 'mutative.cjs.production.min.js', false, true],
  ['umd-production', 'umd', 'mutative.umd.production.min.js', false, true],
  ['cjs-development', 'cjs', 'mutative.cjs.development.js', true, false],
  ['esm', 'esm', 'mutative.esm.js', null, false],
  ['esm-node', 'esm', 'mutative.esm.mjs', null, false],
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
    define: development === null ? undefined : { __DEV__: String(development) },
    globalName: format === 'umd' ? 'Mutative' : undefined,
    outputOptions: {
      entryFileNames: fileName,
      // Read once: a `process.env` read takes about 150 ns in Node.js, and
      // some checks run for every draft or frozen value.
      intro:
        development === null
          ? "const __DEV__ = process.env.NODE_ENV !== 'production';"
          : undefined,
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
