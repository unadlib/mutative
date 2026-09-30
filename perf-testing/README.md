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

The [local measurement archives](./reports/README.md) contain complete tables,
JSON, scale comparisons, result limitations, and suggested next workloads.
The [2026-09-30 expanded baseline](./reports/2026-09-30-m1-max-node24-expanded-summary.md)
records all 67 scenarios, three libraries, separate freeze/patch modes, allocation
and retained-output heap measurements, and passing local/GitHub budget controls
for the unoptimized source. The
[2026-10-01 expanded archive](./reports/2026-10-01-m1-max-node24-expanded-summary.md)
records the same matrix for the draft fast paths candidate, plus a local run of
the CI budget gate against `main`.

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

# Refresh the pinned comparison, review budgets.json's version policy, and rerun
pnpm add -D -E immer@latest
```

The runner never upgrades dependencies implicitly. Reports record the actual
installed versions, local Git revision and dirty state, production artifact
SHA-256 hashes, source hash, Node/V8 versions, CPU, RAM, configuration, and all
individual process results. The version check rejects stale installed Immer.
An intentional dependency upgrade must update the matching version in
`perf-testing/budgets.json` and commit the manifest, lockfile, policy, and refreshed
measurements together.

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
| Common array operations       | 11 operations × primitive, shallow-object, and nested-object elements                                                      |                                1 |
| Mutation density              | mutation-density-1pct, mutation-density-10pct, mutation-density-100pct                                                     |                                1 |

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

Full comparison suites remain opt-in. Performance budgets run in a separate CI
job; ordinary unit tests have no wall-clock thresholds. Existing benchmarks and
published package contents are unchanged.

## CI regression budgets

`Performance budgets` checks each PR and pushes to main on Node 24.16.0 /
Ubuntu 24.04. It builds the actual base and head checkouts and uses this same
harness for both artifacts. Measurements run sequentially on the same runner,
alternating base/candidate order and freeze/patch order across pairs. The fixed
v1/Immer controls belong to comparison reports; this gate measures candidate
against its immediate Git baseline so regression allowance does not accumulate
relative to an old release.

[budgets.json](./budgets.json) is the versioned policy: eight representative
small/read/mutation/array scenarios at 1,000 rows, both freeze and patch modes,
five latency pairs, and three independent memory pairs for two heavy cases.
A timing regression exceeds **1.30x** and **500 ns**; sampled allocation exceeds
**1.35x** and **8 KiB/output**; retained heap exceeds **1.35x** and **1 KiB/output**.
Both limits must be exceeded, using median paired ratios and median paired
deltas. These conservative initial tolerances accommodate noisy shared runners;
review observed control ranges before tightening them. RSS is recorded but has
no budget because snapshot deltas depend strongly on allocator/GC history.

Missing/duplicate cases, insufficient samples, differing environments/fixtures,
unstable artifact identities, mismatched patch counts, unpinned dependencies,
or enabling the array-method plugin fail the gate. Reports retain every pair
and decision. Mitata 1.0.34 collects at least 12 raw samples and can trim four
outliers, leaving a minimum of nine retained samples; the gate checks that
retained count instead of incorrectly rejecting valid slow-operation trials.
CI uploads artifacts even on failure. Unit tests exercise failure
paths, including the CLI's nonzero exit. The Node 22/24 build workflow also runs
all scenario/mode correctness checks using bounded fixtures (10/30 wide-object
properties and ten RTKQ requests), plus tool formatting and benchmark-tool tests.

```sh
# PR base checkout must already have its production build
pnpm benchmark:ci --base-dir /absolute/path/to/base-checkout
# Calibrate noise by comparing the same current build with itself
pnpm benchmark:ci --self-control
# Re-evaluate saved measurements without re-running workloads
node perf-testing/check-budgets.mjs perf-testing/results/ci/report.json
```

The gate is a workload-specific regression guard, not a universal performance
ranking. Enforcing it as a required merge check additionally depends on the
repository's GitHub branch-protection settings.

## Memory measurement

```sh
# Independent workers; compare memory separately from producer latency
pnpm benchmark:memory --patches both --filter '^(small-object-update|read-index|array-reverse-nested)$'
node perf-testing/run-memory.mjs --array-size 1000 --patches both --filter '^array-reverse-(primitive|nested)$' --output perf-testing/results/memory-array-1000.json
pnpm test:benchmarks
```

Every scenario/library/freeze/patch trial gets its own worker process, repeated
three times by default with alternating library/mode order. Each worker validates
its scenario and performs five warmup calls before two separate memory passes.
`--memory-iterations` controls outputs retained per pass (default 32);
`--sampling-interval` controls the allocation sampling interval (default 1024
bytes, minimum 128). Large patch-heavy cases may need fewer iterations to avoid
retaining an impractically large batch.

The first pass uses V8's [HeapProfiler allocation sampler](https://github.com/ChromeDevTools/devtools-protocol/blob/master/pdl/js_protocol.pdl)
and includes temporary objects collected by major/minor GC. Reported allocated
bytes are sampling estimates including profiler/loop overhead, not exact counts.
The second pass records batch-end heap/RSS, post-GC retained heap, explicit GC
duration, and a snapshot after releasing outputs. The preallocated holder retains
one output per iteration; patch-enabled cases retain the last producer tuple
including its state. Earlier tuples in a sequence are not retained. Retained heap
is a signed per-output difference between the post-GC live-output snapshot and
the snapshot after releasing outputs. This cancels persistent JIT/runtime-cache
growth during the pass; the original before delta and released-heap delta are
also recorded. A same-build control exposed a false regression with the original
before-only baseline, so only the output-attributable delta is gated. Small or
negative values can be noise. RSS is a
batch-end snapshot delta, not peak RSS or allocation per operation. Memory runs
never supply latency comparisons. JSON retains worker-level snapshots, ranges,
iteration/sample counts, patch counts, and build hashes.

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
