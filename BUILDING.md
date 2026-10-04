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

- `scripts/build-plugins.mjs` compiles TypeScript as one program, once for all six bundles. This retains cross-module const-enum inlining and TypeScript's ES2018 transformations, so object spread stays native and V8 can clone objects in one step. Emitted JavaScript and source maps stay in memory.
- Production CJS and UMD bundles use Terser, with top-level optimization for CJS and three compression passes. tsdown's built-in minification is disabled.

tsdown performs module bundling. Its output explicitly retains strict mode and omits namespace `Symbol.toStringTag` markers, matching the former output contract. Strict mode matters for behavior such as throwing when mutable patch application attempts to write to a frozen object.

`tsc` emits the declaration tree, and `scripts/write-package-entries.mjs` writes the CJS environment selector and ESM declaration facade. Source maps compose through TypeScript, tsdown and Terser to the shipped `src/*.ts` files.

`pnpm build:analyze` runs the same build and creates the ESM bundle analysis report in `stats.html`.

## Size checks

`pnpm size` runs both checks below, including in push, pull request and release workflows:

1. `size-limit` keeps the existing 5 kB limits for production CJS and ESM.
2. `pnpm size:compare` compares the build with the pre-migration Rollup measurements in `scripts/build-size-baseline.json`.

The baseline comparison measures:

- All six JavaScript artifacts, using raw bytes, gzip level 9 and Brotli.
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

`pnpm test:package` requires a completed build. It validates the file manifest, production error-code and warning stripping, and source-map paths and locations. It then packs and installs the tarball in a temporary consumer, runs publint and Are the Types Wrong, and exercises CJS, ESM, browser UMD, NodeNext and Bundler type resolution. The runtime checks include strict-mode behavior and confirm that warnings are printed in development and not in production. Temporary consumer files are removed after the check.

After changing the compiler or minifier, run these checks as well as the source tests. Source tests alone do not exercise the published JavaScript artifacts.

## Watch regression checks

`pnpm test:build-watch` starts tsdown in watch mode against a temporary TypeScript project. It verifies both CJS and ESM output after source edits, cross-file const-enum changes, a type error followed by recovery, and the addition and subsequent modification of a dependency. It checks executed output, not just rebuild messages. The watcher and temporary files are cleaned up on success or failure. Push, pull request and release workflows run this check.

The TypeScript plugin watches the program's source and configuration inputs. Each output variant holds its own compilation snapshot during a build; completed compilations are shared until an input changes. Dependencies whose imports were erased by const-enum inlining are also watched and invalidate their consumers.
