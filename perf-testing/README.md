# Mutative vs latest stable Immer

This suite ports the workloads from `immerjs/immer/perf-testing` at
[`061c2425e1c9dff89e4e4189d42af1b7839dfe0a`](https://github.com/immerjs/immer/tree/061c2425e1c9dff89e4e4189d42af1b7839dfe0a/perf-testing).
The upstream MIT license is retained in [LICENSE](./LICENSE).

It compares the **current checkout's production Mutative build** with the
**installed, exactly pinned Immer release** in the root `package.json` and
`pnpm-lock.yaml`. Immer 11.1.18 was npm's `latest` on 2026-09-30. Historical Immer
versions and unrelated immutable libraries are omitted. Neither the benchmark
nor its runtime imports or calls `enableArrayMethods`; the plugin stays disabled.
See the existing [array-method reproductions](../test/immer-array-methods.md).

## Run

Use the repository's Node 22+ development toolchain. From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm benchmark:immer:check
pnpm benchmark:immer
```

`benchmark:immer` rebuilds Mutative and the benchmark bundle, then runs three
independent Node processes sequentially. It alternates library and freeze order
between processes. No other benchmark or test should run concurrently. Timing
results are generated under the ignored `perf-testing/results/` directory, as
JSON and Markdown. Report generation fails if any trial errors or the selected
matrix is incomplete; benchmark errors do not produce a successful exit.

```sh
# One complete process, or a focused/scaled comparison
pnpm benchmark:immer --runs 1
pnpm benchmark:immer --filter '^(update|update-high|mapNested)$' --array-size 10000
pnpm benchmark:immer --freeze off --output perf-testing/results/unfrozen.json
pnpm benchmark:immer --list
pnpm benchmark:immer --help

# Reuse an already built bundle without rebuilding
node perf-testing/run-benchmarks.mjs --runs 3

# Refresh the explicitly pinned comparison version, then rerun and commit its lockfile
pnpm add -D -E immer@latest
```

The runner never upgrades dependencies implicitly. Reports record the actual
installed versions, local Git revision and dirty state, production artifact
SHA-256 hashes, source hash, Node/V8 versions, CPU, RAM, configuration, and all
individual process results. The version check rejects stale installed Immer.

## Workloads and units

| Group                         | Scenarios                                                                                                                  |      Reducer calls per iteration |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------: |
| Single array operations       | add, remove, filter, update, concat, mapNested, update-high, update-multiple, remove-high, sortById-reverse, reverse-array |                                1 |
| Single wide-object operations | update-largeObject1, update-largeObject2                                                                                   |                                1 |
| State reuse                   | update-reuse, update-high-reuse, remove-reuse, remove-high-reuse, update-largeObject1-reuse, update-largeObject2-reuse     |                               10 |
| Mixed workflow                | mixed-sequence                                                                                                             |                                5 |
| Simulated RTK Query workflow  | rtkq-sequence                                                                                                              | 200 (100 pending + 100 resolved) |

Defaults retain upstream's 100-row array, 10 nested items per row, 1,000/3,000
property objects, five updates in `update-multiple`, and ten state-reuse calls.
The RTKQ scenario is a simulated reducer pattern, not Redux Toolkit execution.
`--reuse-iterations` must not exceed `--array-size` so reused updates always
target existing items.

`update` uses `find` at index 0; `update-high` searches around 80% of the array.
`remove` uses `splice(0, 1)`; `remove-high` searches by ID before splicing.
The wide-object scenarios **insert properties**, rather than edit existing ones.
`concat` retains upstream's prepend-500-then-truncate behavior: at array size
100 it replaces all rows. `filter` retains 50% of the rows; upstream's single
`filter(0)` produced an empty array and its unused percentage calculation was
removed. Fixtures are deterministic instead of using `Math.random()`.

## Fairness and interpretation

- Both libraries run production artifacts with patches disabled. Each gets the
  same recipe, action values, and fixture structure.
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
# One library and freeze mode per process; default: Mutative with freeze off
pnpm profile:immer --library mutative --freeze off --filter '^rtkq-sequence$' --iterations 1000
pnpm profile:immer --library immer --freeze off --filter '^rtkq-sequence$' --iterations 1000
pnpm profile:immer --library mutative --freeze on --filter '^update-largeObject2$'

# Analyze an explicit file, or the newest profile in perf-testing/results
pnpm profile:immer:analyze perf-testing/results/example.cpuprofile
pnpm profile:immer:analyze
```

The profiler starts after correctness checks, fixture setup, warmup, and an
explicit GC. It samples at a requested 1 ms interval and writes a standard
`.cpuprofile` plus metadata under the ignored results directory. Chrome DevTools
can open the profile directly. The CLI analyzer maps frames back to source using
Node's built-in `SourceMap`, and reports exclusive time by library/harness/GC
plus the top functions with exclusive and inclusive times. Unlike the upstream
analyzer, it needs no extra source-map dependency or historical-version aliases.
Profiling has instrumentation overhead; use the benchmark reports for latency
comparisons, and profiles to investigate hotspots.
