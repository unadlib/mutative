# Contributing (/docs/extra-topics/contributing)

Set up the repository, run its checks, and contribute code, benchmarks and docs.

Mutative's goal is efficient immutable updates. The focus is on performance and on APIs that make development easier, and pull requests that help with either are welcome. For a larger change, open an [issue](https://github.com/unadlib/mutative/issues) or a [discussion](https://github.com/unadlib/mutative/discussions) first.

### Development Workflow [#development-workflow]

* Clone the [repository](https://github.com/unadlib/mutative), and use Node.js 22 or 24 with the pnpm version that `package.json` declares.
* Run `pnpm install` to install all the dependencies.
* Run `pnpm test` to run the tests, or `pnpm test --watch` for an interactive test watcher.
* Run `pnpm format`, `pnpm lint` and `pnpm type-check` before you commit.
* Run `pnpm commit` to write a commit message in the [Conventional Commits](https://www.conventionalcommits.org/) format.
* Create a pull request.

### Builds, packages and benchmarks [#builds-packages-and-benchmarks]

[Building and validating Mutative](https://github.com/unadlib/mutative/blob/main/BUILDING.md) describes the build pipeline, the package checks, the bundle size limits and the generated API reference. [The benchmark suite](https://github.com/unadlib/mutative/blob/main/perf-testing/README.md) compares the current build with Mutative 1.3.0, Immer and hand-written reducers, and describes the regression budgets that CI checks: run `pnpm benchmark:immer:check` to validate every workload and `pnpm benchmark:immer` to measure them.

### Docs [#docs]

* The website lives in [`website/`](https://github.com/unadlib/mutative/tree/main/website). Run `pnpm start:docs` from the repository root to preview it, and `pnpm build` in `website/` to export it and check its links.
* Code examples that import from `mutative`, and from no other module than `mutative` and `immer`, run as tests, with Vitest's `expect`: keep such examples complete, and leave the imports out of fragments that are not meant to run.
* `pnpm build:doc` regenerates the API reference in [`docs/`](https://github.com/unadlib/mutative/tree/main/docs) from the TSDoc comments of the source, and CI checks that it is up to date.
* Write each Markdown paragraph and list item on a single line.
