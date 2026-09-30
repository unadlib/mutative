# Candidate Mutative vs pinned Mutative v1 and Immer

This suite ports the workloads from `immerjs/immer/perf-testing` at
[`061c2425e1c9dff89e4e4189d42af1b7839dfe0a`](https://github.com/immerjs/immer/tree/061c2425e1c9dff89e4e4189d42af1b7839dfe0a/perf-testing).
The upstream MIT license is retained in [LICENSE](./LICENSE).

It compares a **candidate production Mutative build**, the **exactly pinned
Mutative v1.3.0 npm baseline** (`mutative-v1` alias), and **Immer 11.1.18** in the
root `package.json` and `pnpm-lock.yaml`. Immer 11.1.18 was npm's `latest` on
2026-09-30. The candidate defaults to the current checkout. Its actual version,
source revision, and production hash are reported; the current candidate is
still 1.3.0 and must not be described as v2. Neither the benchmark
nor its runtime imports or calls `enableArrayMethods`; the plugin stays disabled.
See the existing [array-method reproductions](../test/immer-array-methods.md).

The [2026-09-30 local measurement archive](./reports/README.md) contains complete
tables, JSON, scale comparisons, result limitations, and suggested next workloads.

## Run

Use the repository's Node 22+ development toolchain. From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm benchmark:immer:check
pnpm benchmark:immer
```

`benchmark:immer` rebuilds Mutative and the benchmark bundle, then runs three
independent Node processes sequentially. It alternates library, freeze, and
patch order between processes. No other benchmark or test should run concurrently. Timing
results are generated under the ignored `perf-testing/results/` directory, as
JSON and Markdown. Report generation fails if any trial errors or the selected
matrix is incomplete; benchmark errors do not produce a successful exit.

```sh
# One complete process, or a focused/scaled comparison
pnpm benchmark:immer --runs 1
pnpm benchmark:immer --filter '^(update|update-high|mapNested)$' --array-size 10000
pnpm benchmark:immer --freeze off --output perf-testing/results/unfrozen.json
pnpm benchmark:immer --patches on --output perf-testing/results/patches.json
# Both freeze modes and patch modes, including a contemporaneous plain baseline
pnpm benchmark:immer --patches both --output perf-testing/results/patch-matrix.json
pnpm benchmark:immer --list
pnpm benchmark:immer --help

# Reuse an already built bundle without rebuilding
node perf-testing/run-benchmarks.mjs --runs 3

# Exactly the original two-library comparison, or the fixed v1 baseline alone
pnpm benchmark:immer --library both
pnpm benchmark:immer --library mutative-v1

# Build a v2 checkout first, then reuse this harness with that production artifact
# Reports read its real package version and Git revision; no v2 code is invented.
MUTATIVE_PERF_CANDIDATE_DIR=/absolute/path/to/v2-checkout pnpm benchmark:immer

# Refresh the explicitly pinned comparison version, then rerun and commit its lockfile
pnpm add -D -E immer@latest
```

The runner never upgrades dependencies implicitly. Reports record the actual
installed versions, local Git revision and dirty state, production artifact
SHA-256 hashes, source hash, Node/V8 versions, CPU, RAM, configuration, and all
individual process results. The version check rejects stale installed Immer.

`--patches off|on|both` defaults to `off`, preserving the original plain-update
benchmark. `benchmark:immer:check` checks both patch modes and both freeze modes
(all selected scenarios with three libraries).
`--library all` (the default) measures candidate, pinned v1, and Immer;
`--library both` retains the original candidate/Immer comparison.
`--patches on` measures patch
generation with automatic freezing off and on; `--patches both` additionally
measures the plain-update baseline in the same processes. The JSON schema is
version 2, with `enablePatches` on each trial and summary; the summarizer still
reads the original version 1 archives as patches off.

## Workloads and units

| Group                         | Scenarios                                                                                                                  |      Reducer calls per iteration |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------: |
| Single array operations       | add, remove, filter, update, concat, mapNested, update-high, update-multiple, remove-high, sortById-reverse, reverse-array |                                1 |
| Single wide-object operations | update-largeObject1, update-largeObject2                                                                                   |                                1 |
| State reuse                   | update-reuse, update-high-reuse, remove-reuse, remove-high-reuse, update-largeObject1-reuse, update-largeObject2-reuse     |                               10 |
| Mixed workflow                | mixed-sequence                                                                                                             |                                5 |
| Simulated RTK Query workflow  | rtkq-sequence                                                                                                              | 200 (100 pending + 100 resolved) |
| Pure draft reads              | read-index, read-forEach, read-iterator, read-missing, read-length                                                         |                                1 |
| No-op producers               | noop-empty, noop-same-value                                                                                                |                                1 |
| Small state                   | small-object-update, small-array-1-update, small-array-10-update                                                           |                                1 |

Defaults retain upstream's 100-row array, 10 nested items per row, 1,000/3,000
property objects, five updates in `update-multiple`, and ten state-reuse calls.
The RTKQ scenario is a simulated reducer pattern, not Redux Toolkit execution.
`--reuse-iterations` must not exceed `--array-size` so reused updates always
target existing items.

Pure-read scenarios traverse nested values by index, `forEach`, and iterator,
search for a missing value, or read only array length. Their scalar observations
escape during timing and are checked against independent native-array results.
Reads and no-ops must retain the original state identity and produce zero patches.
Their fixtures contain only the array and an untouched small branch. Small-state
fixtures contain a tiny object or exactly 1/10 array rows with one nested child;
they do not include the upstream 1,000/3,000-property objects.

Additional `array-{operation}-{shape}` cases cover push, pop, shift, unshift,
middle splice insertion/removal/replacement, fill, copyWithin, sort, and reverse.
Each runs with primitive values, shallow objects, and nested objects. Splice and
three-item fill/copy operations target the middle. Sorting starts from a
deterministic shuffled permutation. `mutation-density-{1,10,100}pct` cases update
nested values in 1%, 10%, or 100% of rows in one producer call. These fixtures
also omit wide objects. Use `--array-size` to measure scaling while keeping the
element shape and other configuration fixed.

`update` uses `find` at index 0; `update-high` searches around 80% of the array.
`remove` uses `splice(0, 1)`; `remove-high` searches by ID before splicing.
The wide-object scenarios **insert properties**, rather than edit existing ones.
`concat` retains upstream's prepend-500-then-truncate behavior: at array size
100 it replaces all rows. `filter` retains 50% of the rows; upstream's single
`filter(0)` produced an empty array and its unused percentage calculation was
removed. Fixtures are deterministic instead of using `Math.random()`.

## Fairness and interpretation

- Both libraries run production artifacts with the selected patch mode. Each
  gets the same recipe, action values, and fixture structure.
- With patches enabled, Mutative uses `enablePatches: { arrayLengthAssignment: false }`.
  Immer uses `produceWithPatches` after one-time `enablePatches` setup.
  Both return forward and inverse patches using array paths and index
  removals. This intentionally disables Mutative's default array-length patch
  shortcut to match Immer's removal format. The array-method plugin stays off.
- Patch generation is timed at **every reducer call**, including all calls in
  reuse, mixed, and RTKQ scenarios. Each `[state, patches, inversePatches]` tuple
  escapes via `do_not_optimize`; tuples are not accumulated. Replay, JSON
  serialization, and patch-consuming application work are outside timing.
  Reports include forward/inverse operation counts per full scenario.
- Auto-freeze **off** means unfrozen inputs and payloads for both libraries.
- Auto-freeze **on** means deeply pre-frozen inputs and payloads, and actual
  output freezing enabled for both libraries. This measures ongoing immutable
  state updates; it excludes the first full-graph freeze of cold external data.
- Every trial owns its input graph. Each timed sample starts at the same
  immutable base. Reuse and mixed scenarios evolve the returned state only
  within that sample; state does not grow across measurement samples.
- Fixture/action construction, configuration, and correctness verification are
  outside timing. Natural garbage collection during measurement is included.
  Mitata uses its default warmup/calibration and collects garbage once after
  warmup. Heap sampling is disabled for these latency measurements.
- Every result escapes via Mitata's `do_not_optimize`. Before timing, an
  independent manual immutable reducer checks values, input/action immutability,
  untouched-branch structural sharing, output freeze mode, absence of leaked
  drafts, and repeatability for every library/freeze/scenario combination.
- Patch-enabled checks additionally verify every intermediate result, forward
  replay, inverse replay, and native `apply`/`applyPatches` replay without
  mutating inputs or patch values. An independent plain-JavaScript path consumer
  preserves the RTKQ fixture's own `undefined` fields, which JSON serialization
  would drop; generated patch values are checked for leaked drafts too.

These choices repair upstream's no-op Mutative freeze setter, configuration
changes in the timed loop, freeze contamination of reused single-op fixtures,
and fixture construction inside sequence timings. Consequently these numbers
should not be compared directly to upstream's previous timings.

Markdown tables report microseconds per **complete scenario iteration**, using
the median of independent-process mean times. `I/M` is Immer time / Mutative
time: above 1 favors Mutative; below 1 favors Immer. JSON retains per-process
means, p50, p99, min/max, sample counts, and ticks. Mitata can batch samples, so
sample p99 is not single-request tail latency. No cross-scenario overall score
is generated because equal weighting of unrelated workloads is arbitrary.

The suite is opt-in and has no noisy wall-clock threshold in normal unit tests.
It does not change the existing benchmarks or the published package contents.

## CPU profiling

The upstream profiling and source-map analysis workflow is also ported. Profiling
shares the benchmark's fixtures, recipes, validation, production inputs, and
freeze rules; it does not maintain a separate copy of the workloads.

```sh
# One library, freeze, and patch mode per process; default: Mutative, both off
pnpm profile:immer --library mutative --freeze off --filter '^rtkq-sequence$' --iterations 1000
pnpm profile:immer --library immer --freeze off --filter '^rtkq-sequence$' --iterations 1000
pnpm profile:immer --library mutative --freeze on --filter '^update-largeObject2$'
pnpm profile:immer --library immer --freeze on --patches on --filter '^update-multiple$'

# Analyze an explicit file, or the newest profile in perf-testing/results
pnpm profile:immer:analyze perf-testing/results/example.cpuprofile
pnpm profile:immer:analyze
```

The profiler accepts one patch mode (`--patches off|on`, default `off`) per
process and records it in the filename and metadata. The profiler starts after
correctness checks, fixture setup, warmup, and an explicit GC. It samples at a
requested 1 ms interval and writes a standard
`.cpuprofile` plus metadata and a source-map snapshot under the ignored results
directory. Keep these three files together when moving profiles; the analyzer
uses the saved map so rebuilding the bundle does not change historical source
locations. Metadata also records the profiled bundle's SHA-256. Chrome DevTools
can open the profile directly. The CLI analyzer maps frames back to source using
Node's built-in `SourceMap`, and reports exclusive time by library/harness/GC
plus the top functions with exclusive and inclusive times. Unlike the upstream
analyzer, it needs no extra source-map dependency or historical-version aliases.
Profiling has instrumentation overhead; use the benchmark reports for latency
comparisons, and profiles to investigate hotspots.
