# Building and validating Mutative

Use Node.js 22 or 24 for development and the pnpm version declared in `package.json`. The published library's Node.js runtime requirement is separate from the build toolchain requirement.

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm size
pnpm test:package
pnpm test:build-watch
pnpm type-check
pnpm test
pnpm lint
pnpm format --check
```

## Build pipeline

`tsdown.config.mjs` produces the existing CJS, ESM and UMD entry points. The pipeline deliberately retains two parts of the previous build:

- `scripts/build-plugins.mjs` compiles TypeScript as one program, once for all seven bundles. This retains cross-module const-enum inlining and TypeScript's ES2018 transformations, so object spread stays native and V8 can clone objects in one step. Emitted JavaScript and source maps stay in memory.
- Production CJS, UMD and ESM bundles use Terser, with top-level optimization for CJS and three compression passes. tsdown's built-in minification is disabled.

tsdown performs module bundling. Its output explicitly retains strict mode and omits namespace `Symbol.toStringTag` markers, matching the former output contract. Strict mode matters for behavior such as throwing when mutable patch application attempts to write to a frozen object.

The CJS and UMD bundles fix `__DEV__` at build time, and `dist/index.js` selects the CJS development or production bundle from `process.env.NODE_ENV`. The ESM bundles that bundlers resolve, `mutative.esm.js` and `mutative.esm.mjs`, leave the choice to the consumer: every development check is `process.env.NODE_ENV !== "production"`, which bundlers replace, so production bundles drop the development messages, warnings and checks. The checks do not go through a constant read once, because webpack then keeps the development code of namespace imports and dynamic `import()`. They must also stay unguarded: with a `typeof process !== 'undefined'` guard, esbuild and Terser keep the development code. A `process.env` read takes about 150 ns in Node.js, and some checks run for every draft or frozen value, so the `node` import condition resolves `dist/index.mjs`, which takes the exports object of the CJS entry as its default import and exports its functions by name: Node.js reads the variable once, and `import` and `require` share one instance. A re-export by name, `export { create } from './index.js'`, would need Node.js 14.13, the first version that detects the names a CommonJS module exports, while `engines` allows 14.0. Browsers that load an ESM file without a bundler have no `process`; `mutative.esm.production.min.mjs` is a minified production build for them that does not read it.

Bundlers that target Node.js resolve the same CJS entry, for example esbuild with `platform: 'node'`, or tsup when it bundles dependencies. Unless they define `process.env.NODE_ENV`, its selector keeps both CJS bundles: a minified esbuild bundle that imports `create` grows from 25.5 KB to 54.7 KB, or from 8.3 KB to 12.3 KB with Brotli. webpack in production mode defines the variable and keeps only the production bundle. Server bundles rarely mind the size; defining `process.env.NODE_ENV` as `production`, or leaving Mutative external, avoids it.

`tsc` emits the declaration tree, and `scripts/write-package-entries.mjs` writes the CJS environment selector, the Node.js ESM entry and the ESM declaration facade. It fails if the CJS bundle sets `__esModule`: bundlers that follow that convention would then import `exports.default` through the Node.js ESM entry. Source maps compose through TypeScript, tsdown and Terser to the shipped `src/*.ts` files.

`pnpm build:analyze` runs the same build and creates the ESM bundle analysis report in `stats.html`.

## Size checks

`pnpm size` runs both checks below, including in push, pull request and release workflows:

1. `size-limit` bundles what a consumer imports with webpack in production mode and checks its Brotli size against the limit in `package.json`: all exports of the production CJS artifact, and `create` and all exports of the ESM entry. Each check names its imports: without them, webpack drops the unused exports of the entry and measures only module initialization. Each limit is the size at its last refresh plus 1%, rounded up to 0.1 kB.
2. `pnpm size:compare` compares the build with the pre-migration Rollup measurements in `scripts/build-size-baseline.json`.

The baseline comparison measures:

- All seven JavaScript artifacts, using raw bytes, gzip level 9 and Brotli.
- ESM import and production CJS require consumers using the declared package entry points. Each mode covers `create`, patch generation/application and the complete API. The imports are used so bundlers cannot discard the application.
- Consumer bundles produced by a pinned esbuild version, with identical ES2018 targets, minification and production environment definitions.

Every measurement must stay within **both 1% and 64 bytes** of its baseline; the smaller allowance applies. This tolerates minor code-generation differences while preventing a substantial regression from being hidden by a larger absolute limit. It does not promise byte-identical output. `size-limit` reports the result of its own bundling pipeline, so its numbers are not interchangeable with direct artifact gzip sizes or the consumer measurements.

To measure an already-built checkout without changing any baseline:

```sh
node scripts/check-build-size.mjs --measure /path/to/checkout
```

To apply the committed baseline checks to another built checkout:

```sh
node scripts/check-build-size.mjs --check /path/to/checkout
```

The reference revision and build commands are recorded in the baseline JSON. To reproduce it, check that revision out into a separate worktree, install with its frozen lockfile, build it, and run `--measure` from the current checkout. This uses the same pinned consumer bundler for both builds.

A legitimate API expansion or measurement-tool upgrade may require a new baseline. Review the raw, compressed and consumer deltas, update the reference metadata and measurements together, and explain the accepted change in the commit. Normal builds and checks never update the baseline automatically.

## Package checks

`pnpm test:package` requires a completed build. It validates the file manifest, production error-code and warning stripping, the per-check environment comparisons of the ESM bundles, and source-map paths and locations. It then packs and installs the tarball in a temporary consumer, runs publint and Are the Types Wrong, and exercises CJS, ESM, browser UMD, NodeNext and Bundler type resolution. The runtime checks include strict-mode behavior and confirm that CJS and Node.js ESM print warnings in development and not in production, and that Node.js `import` and `require` share one instance. An esbuild bundle of the ESM entry must keep the development messages in development and drop them in production, and an esbuild bundle for Node.js, which resolves the Node.js ESM entry, must run with all exports. Temporary consumer files are removed after the check.

After changing the compiler or minifier, run these checks as well as the source tests. Source tests alone do not exercise the published JavaScript artifacts.

`scripts/check-minimum-node.mjs` checks a packed tarball on the oldest Node.js version that `engines` allows and fails on any other version. It installs the tarball with that version's npm and, in development and production, loads the CJS entry with `require` and the Node.js ESM entry with static and dynamic `import`, checks that both expose the same functions of one instance, and runs a short runtime test of objects, native array methods, Map and Set drafts, auto-freeze, patches, strict mode, marks and async recipes. It is written for Node.js 14.0, without `node:` specifiers, `assert/strict` or top-level `await`. CI builds and packs with Node.js 24 and runs it with Node.js 14.0.0. To run it locally, put a Node.js 14.0 binary and its npm first on `PATH`:

```sh
pnpm pack --pack-destination /tmp
PATH=/path/to/node-v14.0.0/bin:$PATH node scripts/check-minimum-node.mjs /tmp/mutative-*.tgz
```

## Watch regression checks

`pnpm test:build-watch` starts tsdown in watch mode against a temporary TypeScript project. It verifies both CJS and ESM output after source edits, cross-file const-enum changes, a type error followed by recovery, and the addition and subsequent modification of a dependency. It checks executed output, not just rebuild messages. The watcher and temporary files are cleaned up on success or failure. Push, pull request and release workflows run this check.

The TypeScript plugin watches the program's source and configuration inputs. Each output variant holds its own compilation snapshot during a build; completed compilations are shared until an input changes. Dependencies whose imports were erased by const-enum inlining are also watched and invalidate their consumers.
