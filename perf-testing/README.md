# Mutative benchmarks

This suite ports the workloads from `immerjs/immer/perf-testing` at [`061c2425e1c9dff89e4e4189d42af1b7839dfe0a`](https://github.com/immerjs/immer/tree/061c2425e1c9dff89e4e4189d42af1b7839dfe0a/perf-testing) and extends them with Map and Set values, object records, class instances, a deep path, a combined large-state update, patch application, producers that return a value, and searches of changed arrays. The upstream MIT license is retained in [LICENSE](./LICENSE). It is the repository's only benchmark suite.

It compares a **candidate production Mutative build**, the **exactly pinned Mutative v1.3.0 npm baseline** (`mutative-v1` alias), **Immer 11.1.18** in the root `package.json` and `pnpm-lock.yaml`, and a **hand-written reducer**: the spread-and-copy implementation that is also every scenario's reference result. Immer 11.1.18 was npm's `latest` on 2026-09-30. The candidate defaults to the current checkout. Its actual version, source revision, and production hash are reported; the current candidate is still 1.3.0 and must not be described as v2. Immer's `enableArrayMethods` plugin is enabled only when a run passes `--immer-array-methods`; such reports record `arrayMethodsEnabled: true` and the budget gate rejects them. Mutative's native array methods need no option. Immer's `enableMapSet` plugin is loaded only in processes that run Map or Set scenarios; see [fairness and interpretation](#fairness-and-interpretation). See the existing [array-method reproductions](../test/immer-array-methods.md).

The [performance summary](./reports/SUMMARY.md) records the results of `main`, limitations, source and artifact identities, and reproduction commands. The [archive index](./reports/README.md) links the complete original JSON and Markdown reports for the 2026-09-30 baseline and 2026-10-01 candidate, including timing, memory, object-order controls, and CI budgets; later batches follow the same retention policy. Generated reports stay in the ignored `perf-testing/results/` directory; only the summary and archive index are committed under `reports/`.

## Run

Use the repository's Node 22+ development toolchain. From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm benchmark:immer:check
pnpm benchmark:immer
```

`benchmark:immer` rebuilds Mutative and the benchmark bundle, then performs three independent runs sequentially. Each run is one Node process, or two when the selection mixes Map and Set scenarios with others, since those run in a process of their own. It alternates library, freeze, and patch order between runs. No other benchmark or test should run concurrently. Timing results are generated under the ignored `perf-testing/results/` directory, as JSON and Markdown. Report generation fails if any trial errors or the selected matrix is incomplete; benchmark errors do not produce a successful exit.

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

# One workload group, or a large state like the former `pnpm benchmark` script's
pnpm benchmark:immer --filter '^(map|set)-' --patches both
pnpm benchmark:immer --filter '^push-and-insert$' --array-size 50000 --patches both

# The hand-written reducer alone; it runs with freeze and patches off only
pnpm benchmark:immer --library vanilla --freeze off

# Each scenario and library in a process of its own (see wide objects below)
pnpm benchmark:immer --isolate --patches both --filter '^(update-largeObject1|object-update)$'

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

The runner never upgrades dependencies implicitly. Reports record the actual installed versions, local Git revision and dirty state, production artifact SHA-256 hashes, source hash, Node/V8 versions, CPU, RAM, configuration, and all individual process results. The version check rejects stale installed Immer. An intentional dependency upgrade must update the matching version in `perf-testing/budgets.json`. Commit the manifest, lockfile, policy, and refreshed summary together, with complete measurements linked from the archive index.

`--patches off|on|both` defaults to `off`, preserving the original plain-update benchmark. `benchmark:immer:check` checks both patch modes and both freeze modes (all selected scenarios with all four libraries, each in the modes it supports). `--library all` (the default) measures candidate, pinned v1, Immer, and the hand-written reducer; `--library both` retains the original candidate/Immer comparison. `--patches on` measures patch generation with automatic freezing off and on; `--patches both` additionally measures the plain-update baseline in the same processes. The JSON schema is version 2, with `enablePatches` on each trial and summary; the summarizer still reads the original version 1 archives as patches off.

## Workloads and units

| Group                                  | Scenarios                                                                                                                                |      Reducer calls per iteration |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------: |
| Single array operations                | add, remove, filter, update, concat, mapNested, update-high, update-multiple, remove-high, sortById-reverse, reverse-array               |                                1 |
| Single wide-object operations          | update-largeObject1, update-largeObject2                                                                                                 |                                1 |
| State reuse                            | update-reuse, update-high-reuse, remove-reuse, remove-high-reuse, update-largeObject1-reuse, update-largeObject2-reuse                   |                               10 |
| Mixed workflow                         | mixed-sequence                                                                                                                           |                                5 |
| Simulated RTK Query workflow           | rtkq-sequence                                                                                                                            | 200 (100 pending + 100 resolved) |
| Pure draft reads                       | read-index, read-forEach, read-iterator, read-missing, read-length                                                                       |                                1 |
| No-op producers                        | noop-empty, noop-same-value                                                                                                              |                                1 |
| Small state                            | small-object-update, small-array-1-update, small-array-10-update                                                                         |                                1 |
| Common array operations                | 11 operations × primitive, shallow-object, and nested-object elements                                                                    |                                1 |
| Moved elements                         | shift-and-update                                                                                                                         |                                1 |
| Mutation density                       | mutation-density-1pct, mutation-density-10pct, mutation-density-100pct                                                                   |                                1 |
| Map and Set values                     | map-update, map-update-10pct, map-insert, map-delete, map-read, map-forEach, set-add, set-delete, set-read, set-update, set-update-10pct |                                1 |
| Producers beside unchanged collections | map-set-beside                                                                                                                           |                               10 |
| Object records                         | object-update, object-update-10pct, object-delete                                                                                        |                                1 |
| Class instances                        | class-update, class-wide-update                                                                                                          |                                1 |
| Deep path                              | deep-update                                                                                                                              |                                1 |
| Large-state push and insert            | push-and-insert, push-and-insert-reuse                                                                                                   |                         1 and 10 |
| Patch application                      | apply-update-10pct, apply-array-ops, apply-reverse                                                                                       |                   1 `apply` call |
| Returned values                        | return-replace, return-replace-raw, return-filter                                                                                        |                                1 |
| Searches                               | search-draft, search-current, search-current-shifted                                                                                     |                                1 |

Defaults retain upstream's 100-row array, 10 nested items per row, 1,000/3,000 property objects, five updates in `update-multiple`, and ten state-reuse calls. The RTKQ scenario is a simulated reducer pattern, not Redux Toolkit execution. `--reuse-iterations` must not exceed `--array-size` so reused updates always target existing items.

Pure-read scenarios traverse nested values by index, `forEach`, and iterator, search for a missing value, or read only array length. Their scalar observations escape during timing and are checked against independent native-array results. Reads and no-ops must retain the original state identity and produce zero patches. Their fixtures contain only the array and an untouched small branch. Small-state fixtures contain a tiny object or exactly 1/10 array rows with one nested child; they do not include the upstream 1,000/3,000-property objects.

Additional `array-{operation}-{shape}` cases cover push, pop, shift, unshift, middle splice insertion/removal/replacement, fill, copyWithin, sort, and reverse. Each runs with primitive values, shallow objects, and nested objects. Splice and three-item fill/copy operations target the middle. Sorting starts from a deterministic shuffled permutation. `mutation-density-{1,10,100}pct` cases update nested values in 1%, 10%, or 100% of rows in one producer call. These fixtures also omit wide objects. Use `--array-size` to measure scaling while keeping the element shape and other configuration fixed.

`shift-and-update` removes the first row of an array of nested rows with `shift()`, which moves every other row, and then updates the nested value of the middle row. A draft of a moved row needs the row's index in the original array, which differs from its new index.

`update` uses `find` at index 0; `update-high` searches around 80% of the array. `remove` uses `splice(0, 1)`; `remove-high` searches by ID before splicing. The wide-object scenarios **insert properties**, rather than edit existing ones. `concat` retains upstream's prepend-500-then-truncate behavior: at array size 100 it replaces all rows. `filter` retains 50% of the rows; upstream's single `filter(0)` produced an empty array and its unused percentage calculation was removed. Fixtures are deterministic instead of using `Math.random()`.

Map and Set scenarios use a `Map` of `--array-size` rows keyed by number, a `Map` of as many numbers, a `Set` of as many numbers, or a `Set` of as many objects. They update the nested value of the middle row or of the first 10% of rows, insert a key, delete the middle key, sum every nested value through `values()`, or sum the numbers with `forEach()`; or they add a number, delete the middle number, look up the middle number and a missing one and read the size without changing the Set, or update the first object or the first 10% of objects through the Set's iterator. `map-set-beside` runs as many producers as the state reuse scenarios, ten by default, on the evolving state: the first inserts a row into such a `Map` and adds a number to such a `Set`, which copies both, and the others increment a number beside them. With auto-freeze, the input is pre-frozen like any other, but the copies are new: the first producer freezes them, and the others find them frozen. Mutative 1.3.0 only replaced the mutators of the `Map` and `Set` instances it froze, so each of its producers walked both copies again.

Object records hold the same rows under string keys (`id0`, `id1`, ...) and update the middle row or the first 10% of rows, or delete the middle key. Class scenarios update the middle instance of an array of class instances, or one field of an instance with `--array-size` fields. `deep-update` increments a value ten levels down a tree with ten keys per level; it does not scale with `--array-size`.

`push-and-insert` pushes a row onto the upstream fixture's array and inserts a property into its 1,000-property object in one producer call, the workload of the former `pnpm benchmark` script; `push-and-insert-reuse` repeats it on the evolving state ten times.

The `apply-*` scenarios time Mutative's `apply()` and Immer's `applyPatches()` on an array of nested rows. They replace the nested value of the first 10% of rows; insert, remove and replace rows; or replace every row with a detached copy of its mirror, as the forward patches of a reversal would. Both libraries deep-clone patch values while applying them. These scenarios run with patches off, and the hand-written reducer does not run them.

The `return-*` scenarios return a value from the producer instead of changing the draft. `return-replace` returns a copy of the state with replaced rows, and both libraries search it for drafts. `return-replace-raw` wraps the same value in Mutative's `rawReturn()`, which skips that search; Immer has no equivalent and receives the plain value. `return-filter` returns `draft.filter()` of a root array, whose drafts the libraries must resolve to their original rows.

The `search-*` scenarios find the last row of an array of nested rows and update it after the producer has changed the array: `search-draft` and `search-current` first update the first row, and `search-current-shifted` removes it with `shift()`. `search-draft` calls `findIndex` on the draft, which drafts every row it visits; the other two search the library's `current()` snapshot of the array and update the match through the draft.

## Fairness and interpretation

- Both libraries run production artifacts with the selected patch mode. Each gets the same recipe, action values, and fixture structure.
- With patches enabled, Mutative uses `enablePatches: { arrayLengthAssignment: false }`. Immer uses `produceWithPatches` after one-time `enablePatches` setup. Both return forward and inverse patches using array paths and index removals. This intentionally disables Mutative's default array-length patch shortcut to match Immer's removal format. Immer's array-method plugin is off unless `--immer-array-methods` is passed.
- Patch generation is timed at **every reducer call**, including all calls in reuse, mixed, and RTKQ scenarios. Each `[state, patches, inversePatches]` tuple escapes via `do_not_optimize`; tuples are not accumulated. Replay, JSON serialization, and patch-consuming application work are outside timing, except in the `apply-*` scenarios, which time patch application alone. Reports include forward/inverse operation counts per full scenario.
- The hand-written reducer is the reference implementation of every scenario: spreads, `slice`, `map`, and new `Map` and `Set` copies, with plain loops for the values that recipes read through drafts. It runs with freeze and patches off only, since it neither freezes nor produces patches. It is an ordinary reducer, not the fastest possible code.
- Immer needs `enableMapSet()` for Map and Set values. Once loaded, Immer calls the plugin while finalizing every draft: `small-object-update` measured about 4% slower with it (0.67 µs instead of 0.64 µs), 100-row reads and updates unchanged. Map and Set scenarios therefore run in a process of their own within each run, and memory workers load the plugin only for them, so other scenarios measure Immer without it. Reports record `immerMapSetEnabled`.
- Immer drafts the class instances through a static `immerable` property; Mutative through its `mark` option, which returns `immutable` for those classes and is passed to `apply` as well. Mutative copies such an instance property by property with its descriptors; Immer 11 copies it with `Object.assign` onto its prototype, since its `useStrictShallowCopy` option is off by default.
- Objects with hundreds of properties are sensitive to the object shapes V8 keeps from the code that ran earlier in the same process. Inserting a property into the 1,000-property object took the hand-written reducer 1.7 µs when it ran after the libraries and 130–133 µs when it ran first; Immer took 2.7 µs after the hand-written reducer and 152–155 µs after Mutative. Alternating the library order between runs does not cancel such effects. `--isolate` gives each scenario and library a process of its own, so every measurement follows only its own validation and priming. Code that runs beside a library changes its speed in other scenarios too: with all libraries and scenarios in one process, every library ran slower, by different amounts, so the summary reports isolated results for every scenario and keeps the shared-process runs as a control.
- Auto-freeze **off** means unfrozen inputs and payloads for both libraries.
- Auto-freeze **on** means deeply pre-frozen inputs and payloads, and actual output freezing enabled for both libraries. This measures ongoing immutable state updates; it excludes the first full-graph freeze of cold external data. Map and Set inputs are frozen like Immer's results: replaced mutators and `Object.freeze`. The candidate freezes collection instances too. The pinned Mutative v1 baseline only replaces their mutators, and the checks accept either form.
- Every trial owns its input graph. Each timed sample starts at the same immutable base. Reuse and mixed scenarios evolve the returned state only within that sample; state does not grow across measurement samples.
- Before timing, each benchmark runs its workload for 30 ms on a throwaway fixture, then measures a fresh one. Without this, the first timed run of a scenario in a process could meet V8 state that later runs do not: updating a 100-key record took 12–15 µs in every library there and 3–4 µs afterwards.
- Fixture/action construction, configuration, and correctness verification are outside timing. Natural garbage collection during measurement is included. Mitata uses its default warmup/calibration and collects garbage once after warmup. Heap sampling is disabled for these latency measurements.
- Every result escapes via Mitata's `do_not_optimize`. Before timing, an independent manual immutable reducer checks values, input/action immutability, untouched-branch structural sharing, output freeze mode, absence of leaked drafts, and repeatability for every library/freeze/scenario combination.
- Patch-enabled checks additionally verify every intermediate result, forward replay, inverse replay, and native `apply`/`applyPatches` replay without mutating inputs or patch values. An independent plain-JavaScript path consumer preserves the RTKQ fixture's own `undefined` fields, which JSON serialization would drop, as well as Map keys, Set values, and class prototypes; generated patch values are checked for leaked drafts too.
- Map and Set results are compared by their data and iteration order, without the mutators that freezing replaces. Patch replays compare Map and Set contents without order: a Set patch adds at the end, and Immer removes and re-adds a changed Set value where Mutative replaces a nested field.

These choices repair upstream's no-op Mutative freeze setter, configuration changes in the timed loop, freeze contamination of reused single-op fixtures, and fixture construction inside sequence timings. Consequently these numbers should not be compared directly to upstream's previous timings.

Markdown tables report microseconds per **complete scenario iteration**, using the median of independent-process mean times. `I/M` is Immer time / Mutative time: above 1 favors Mutative; below 1 favors Immer. JSON retains per-process means, p50, p99, min/max, sample counts, and ticks. Mitata can batch samples, so sample p99 is not single-request tail latency. No cross-scenario overall score is generated because equal weighting of unrelated workloads is arbitrary.

Full comparison suites remain opt-in. Performance budgets run in separate CI jobs; ordinary unit tests have no wall-clock thresholds. Published package contents are unchanged.

## CI regression budgets

`Performance budgets` checks each PR and pushes to main on Node 24.16.0 / Ubuntu 24.04, in one job per budget group. Each job builds the actual base and head checkouts and uses this same harness for both artifacts. Measurements run sequentially on the job's runner, alternating base/candidate order and freeze/patch order across pairs. The fixed v1/Immer controls belong to comparison reports; this gate measures candidate against its immediate Git baseline so regression allowance does not accumulate relative to an old release.

[budgets.json](./budgets.json) is the versioned policy: 34 of the 93 scenarios at 1,000 rows, both freeze and patch modes, five latency pairs, and three independent memory pairs, in four groups whose jobs take 6–8 minutes each. `core` holds eight representative small/read/mutation/array scenarios; `collections` the Map and Set scenarios; `objects` the object records, class instances, the deep path, and push and insert; `apply-return-search` patch application, which runs with patches off only, returned values, and the `current()` searches. Memory budgets cover the heaviest cases: `mutation-density-100pct` and `array-reverse-nested` in `core`, and `map-update-10pct`, `set-update-10pct`, `object-update-10pct`, `class-wide-update`, `push-and-insert-reuse`, `apply-reverse`, `return-replace`, and `search-draft`. A timing regression exceeds **1.30x** and **500 ns**; sampled allocation exceeds **1.35x** and **8 KiB/output**; retained heap exceeds **1.35x** and **1 KiB/output**. Both limits must be exceeded. These tolerances accommodate noisy shared runners; review observed control ranges, as below, before tightening them. RSS is recorded but has no budget because snapshot deltas depend strongly on allocator/GC history.

Timing compares the fastest of the five processes of each build; memory compares the medians of paired ratios and deltas. On GitHub runners about one process in six ran the array moves 20–38% slower throughout, base and candidate builds alike, so the medians of five paired ratios, which the gate compared before, failed when three or four slow processes fell to the candidate: in 4 of 113 runs from September 30 to October 8, 2026, one of them between byte-identical builds at 1.30–1.32. Compared by their fastest processes, the same runs pass all 112 that the gate can evaluate, at most 1.08 in those four. Applied to 60 runs between identical builds, a simulated candidate slowdown of 1.35x exceeds the budget in 98% of the cells and one of 1.5x in all of them, against 96% and 99% for the medians of pairs, which also flag 0.15% of the cells without a slowdown.

Before the `collections`, `objects`, and `apply-return-search` groups were budgeted, `--self-control` compared identical builds on 30 GitHub runners, 10 per group, on October 8, 2026. All 30 runs pass the current policy. The largest ratios were 1.11 for timing, `class-update` without freezing or patches at 3.4 µs, below the 500 ns floor; 1.21 for allocation, 1.3 KiB more of the 6.9 KiB per output of `return-replace` with auto-freeze, below the 8 KiB floor; and 1.05 for retained heap. Over all 252 ways to split each run's ten processes between the two builds, the fastest-process ratio exceeded 1.20 only for `object-delete` with auto-freeze, at most 1.26. `class-wide-update` without freezing ran up to 3.9 times slower in processes that ran its freeze-on cells first, an order that both processes of a pair share. Smaller cases have no memory budget because the retained heap of `deep-update` with patches, 1.8 KiB per output, measured 13–36 KiB in 23 of 120 processes of both builds.

Missing/duplicate cases, unknown groups or scenarios, scenarios budgeted in two groups, insufficient samples, differing environments/fixtures, unstable artifact identities, mismatched patch counts, unpinned dependencies, or enabling the array-method plugin fail the gate. Reports retain every pair and decision. Mitata 1.0.34 collects at least 12 raw samples and can trim four outliers, leaving a minimum of nine retained samples; the gate checks that retained count instead of incorrectly rejecting valid slow-operation trials. CI uploads artifacts even on failure. Unit tests exercise failure paths, including the CLI's nonzero exit, and check that the workflow runs every group. The Node 22/24 build workflow also runs all scenario/mode correctness checks using bounded fixtures (10/30 wide-object properties and ten RTKQ requests), plus tool formatting and benchmark-tool tests.

```sh
# PR base checkout must already have its production build; runs every group in turn
pnpm benchmark:ci --base-dir /absolute/path/to/base-checkout
# One group, as each CI job runs it
pnpm benchmark:ci --base-dir /absolute/path/to/base-checkout --group collections
# Calibrate noise by comparing the same current build with itself
pnpm benchmark:ci --self-control --group objects
# Re-evaluate saved measurements without re-running workloads
node perf-testing/check-budgets.mjs perf-testing/results/ci/core/report.json
```

The gate is a workload-specific regression guard, not a universal performance ranking. Enforcing it as a required merge check additionally depends on the repository's GitHub branch-protection settings.

## Memory measurement

```sh
# Independent workers; compare memory separately from producer latency
pnpm benchmark:memory --patches both --filter '^(small-object-update|read-index|array-reverse-nested)$'
node perf-testing/run-memory.mjs --array-size 1000 --patches both --filter '^array-reverse-(primitive|nested)$' --output perf-testing/results/memory-array-1000.json
pnpm test:benchmarks
```

Every scenario/library/freeze/patch trial gets its own worker process, repeated three times by default with alternating library/mode order; combinations a scenario does not support, such as the hand-written reducer with freezing, are skipped. Each worker validates its scenario and performs five warmup calls before two separate memory passes, and loads Immer's MapSet plugin only for a Map or Set scenario. `--memory-iterations` controls outputs retained per pass (default 32); `--sampling-interval` controls the allocation sampling interval (default 1024 bytes, minimum 128). Large patch-heavy cases may need fewer iterations to avoid retaining an impractically large batch.

The first pass uses V8's [HeapProfiler allocation sampler](https://github.com/ChromeDevTools/devtools-protocol/blob/master/pdl/js_protocol.pdl) and includes temporary objects collected by major/minor GC. Reported allocated bytes are sampling estimates including profiler/loop overhead, not exact counts. The second pass records batch-end heap/RSS, post-GC retained heap, explicit GC duration, and a snapshot after releasing outputs. The preallocated holder retains one output per iteration; patch-enabled cases retain the last producer tuple including its state. Earlier tuples in a sequence are not retained. Retained heap is a signed per-output difference between the post-GC live-output snapshot and the snapshot after releasing outputs. This cancels persistent JIT/runtime-cache growth during the pass; the original before delta and released-heap delta are also recorded. A same-build control exposed a false regression with the original before-only baseline, so only the output-attributable delta is gated. Small or negative values can be noise. RSS is a batch-end snapshot delta, not peak RSS or allocation per operation. Memory runs never supply latency comparisons. JSON retains worker-level snapshots, ranges, iteration/sample counts, patch counts, and build hashes.

## CPU profiling

The upstream profiling and source-map analysis workflow is also ported. Profiling shares the benchmark's fixtures, recipes, validation, production inputs, and freeze rules; it does not maintain a separate copy of the workloads.

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

The profiler accepts one patch mode (`--patches off|on`, default `off`) per process and records it in the filename and metadata. It profiles the selected scenarios that run in that library and mode, each with its own runtime; a selection that includes Map or Set scenarios loads Immer's MapSet plugin for the whole profile. The profiler starts after correctness checks, fixture setup, warmup, and an explicit GC. It samples at a requested 1 ms interval and writes a standard `.cpuprofile` plus metadata and a source-map snapshot under the ignored results directory. Keep these three files together when moving profiles; the analyzer uses the saved map so rebuilding the bundle does not change historical source locations. Metadata also records the profiled bundle's SHA-256. Chrome DevTools can open the profile directly. The CLI analyzer maps frames back to source using Node's built-in `SourceMap`, and reports exclusive time by library/harness/GC plus the top functions with exclusive and inclusive times. Unlike the upstream analyzer, it needs no extra source-map dependency or historical-version aliases. Profiling has instrumentation overhead; use the benchmark reports for latency comparisons, and profiles to investigate hotspots.
