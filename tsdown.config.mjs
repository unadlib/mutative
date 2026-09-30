import { defineConfig } from 'tsdown';
import { analyzer, unstableRolldownAdapter } from 'vite-bundle-analyzer';
import { typescript, terser } from './scripts/build-plugins.mjs';

const compiler = typescript();

const variants = [
  ['cjs-production', 'cjs', 'mutative.cjs.production.min.js', false, true],
  ['umd-production', 'umd', 'mutative.umd.production.min.js', false, true],
  ['cjs-development', 'cjs', 'mutative.cjs.development.js', true, false],
  ['esm-development', 'esm', 'mutative.esm.js', true, false],
  ['esm-node-development', 'esm', 'mutative.esm.mjs', true, false],
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
    define: { __DEV__: String(development) },
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
      ...(process.env.ANALYZE === 'true' && name === 'esm-development'
        ? [
            unstableRolldownAdapter(
              analyzer({ analyzerMode: 'static', openAnalyzer: false })
            ),
          ]
        : []),
    ],
  }))
);
