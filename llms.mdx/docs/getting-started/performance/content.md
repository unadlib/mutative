# Performance (/docs/getting-started/performance)

Benchmark results against Immer and hand-written reducers across 97 workloads, and how to run the benchmarks.

Mutative is about 3.6x faster than Immer with matched settings and 6.6x faster with each library's defaults, across 97 benchmarked workloads. A hand-written reducer that copies only what it changes is faster still in most of them.

## Benchmark suite [#benchmark-suite]

The [benchmark suite](https://github.com/unadlib/mutative/tree/main/perf-testing) times 99 workloads: Immer's own performance tests, array methods, reads, Map and Set values, object records, class instances, a deep path, patch application, returned values, and searches. Its last full run measured 97 of them, and a focused run the two that return fresh data. It compares Mutative with Immer 11.1.18 and with reducers written by hand, after checking every result against those reducers. The [performance summary](https://github.com/unadlib/mutative/blob/main/perf-testing/reports/SUMMARY.md) has the complete results, the method, and their limits.

## Mutative vs Immer [#mutative-vs-immer]

> Mutative passed all of Immer's test cases.

With matched settings, both freezing or both not and both generating patches or both not, Mutative was faster than Immer in 595 of 614 measured cases, 3.6x on geometric mean. With each library's defaults, Mutative without auto-freeze and Immer with it, Mutative was faster in 154 of 157 cases, 6.6x on geometric mean. The other 3 return a state that Immer froze earlier: Immer skips frozen values when it searches a returned state for drafts, while Mutative, which does not freeze by default, searches it unless the recipe wraps it in [`rawReturn()`](/docs/api-reference/rawreturn#performance-compared-with-immer), which took 0.26 µs.

<PerformanceOverview />

Times are microseconds per update, medians of three runs on an Apple M1 Max with Node.js 24.16.0, each library in a process of its own; lower is better. Mutative, the first Immer column, and the hand-written reducers run without auto-freeze; the second Immer column shows Immer's default.

| Workload                            |   Rows | Mutative |  Immer | Immer, auto-freeze | Hand-written |
| ----------------------------------- | -----: | -------: | -----: | -----------------: | -----------: |
| Update one field of a small object  |      — |     0.51 |   0.69 |               0.95 |         0.02 |
| Update an array item found by ID    |    100 |     1.12 |   1.82 |               25.0 |         0.38 |
| 200 RTK Query-style updates         |      — |    1,001 |  1,133 |              4,795 |          352 |
| Read every row by index             | 10,000 |    4,756 |  9,584 |              9,687 |         57.7 |
| Remove the first row                | 10,000 |     7.04 |  7,408 |              8,137 |         1.40 |
| Update every row                    | 10,000 |    6,462 | 12,570 |             15,607 |          211 |
| Update one of 10,000 records        | 10,000 |    1,200 |  2,094 |              3,131 |        2,088 |
| Insert into a 1,000-property object |      — |     50.3 |    149 |                229 |          126 |
| Update a Map value                  | 10,000 |      518 |    526 |                733 |          519 |
| Add a number to a Set               | 10,000 |     29.5 |    904 |                975 |         61.2 |
| Update a class instance             | 10,000 |     2.92 |   3.44 |                668 |         1.42 |
| Update a value ten levels deep      |      — |     3.50 |   4.41 |               7.84 |         0.76 |
| Apply patches to 10% of rows        | 10,000 |      734 |  1,166 |              2,095 |            — |
| Search `current()` after `shift()`  | 10,000 |      257 | 11,255 |             11,846 |         64.8 |
| Return draft.filter()               | 10,000 |    2,658 |  4,251 |              4,736 |         77.7 |
| Return a new state                  | 10,000 |    2,604 |  5,718 |               0.79 |         0.02 |
| Return it with rawReturn()          | 10,000 |     0.26 |  5,703 |               0.79 |         0.02 |

Each library ran each workload in a process of its own. With all of them in one process every library ran slower, and not by the same amount: Mutative took 1.1 times as long on geometric mean, Immer 1.2 times, and the hand-written reducers 1.7 times. The search removes the first row with `shift()`, then finds the last row in a snapshot of the array and updates it. Immer has no `rawReturn()` and returns the same plain value in the last two rows; with auto-freeze, Mutative skips a returned state that is already frozen, as Immer does, taking 0.53 µs. Immer was faster in 6 of the 614 matched cases, all with auto-freeze: four updates of class instances with 100 to 10,000 fields, and two array updates at 100 rows whose runs overlapped those of Mutative.

## Large arrays [#large-arrays]

At 1,000 and 10,000 rows the gap grows. Against Immer without its array-method plugin, Mutative was faster in 222 of 232 cases at these sizes, 4.7x on geometric mean, and faster in every case that moves elements:

<ArrayScalingChart />

| Auto-freeze | Patches | All workloads, 1,000 rows | All workloads, 10,000 rows | Moves, 1,000 rows | Moves, 10,000 rows |
| ----------- | ------- | ------------------------: | -------------------------: | ----------------: | -----------------: |
| off         | off     |                      8.7x |                      10.8x |              209x |               430x |
| off         | on      |                      4.1x |                       4.5x |              7.1x |               7.3x |
| on          | off     |                      3.9x |                       4.2x |               32x |                39x |
| on          | on      |                      2.7x |                       2.8x |              6.6x |               6.8x |

Each value is the geometric mean of Immer's time over Mutative's; moves are `shift`, `unshift`, `splice` insertion, and `reverse`. Mutative moves elements natively on its copy, while Immer moves each one through its draft proxy: removing the first of 10,000 rows took 7.04 µs against 7,408 µs, 1,052x. With patches, both libraries emit one patch per moved index, which bounds the gain to 5-9x. The [performance summary](https://github.com/unadlib/mutative/blob/main/perf-testing/reports/SUMMARY.md) breaks these results down by scenario.

## With patches [#with-patches]

With patches on and auto-freeze off, Mutative was faster than Immer in 148 of 150 cases and within 5% in the other 2, 3.3x on geometric mean, and faster than Mutative 1.3.0 in 131 and within 5% in the rest, 4.6x. In every array case measured it was faster than both: 4.4x Immer and 13x Mutative 1.3.0 on geometric mean. Patches cost little when an update changes a few paths: pushing a row and inserting a property at 10,000 rows took 63.2 µs with patches against 63.8 µs without. Moving elements emits one patch per moved index in every library, so removing the first of 10,000 rows produces 10,000 forward and 10,000 inverse patches.

Times are microseconds per update with patches on and auto-freeze off:

<PatchComparisonChart />

| Workload                           |   Rows | Mutative |  Immer | Mutative 1.3.0 |
| ---------------------------------- | -----: | -------: | -----: | -------------: |
| Push a row and insert a property   | 10,000 |     63.2 |    360 |            210 |
| Update an array item found by ID   |    100 |     1.50 |   3.22 |           3.35 |
| 200 RTK Query-style updates        |      — |    1,140 |  1,470 |          2,116 |
| Remove the first row with `splice` |    100 |     11.5 |   83.6 |          2,982 |
| Insert a row in the middle         |    100 |     8.83 |   48.0 |          1,191 |
| Sort rows                          |    100 |      105 |    129 |          2,466 |
| Remove the first row with `shift`  | 10,000 |    1,063 |  8,943 |        265,439 |
| Reverse the rows                   | 10,000 |    1,071 |  9,424 |        280,542 |
| Update every row                   | 10,000 |    8,555 | 21,767 |         22,549 |
| Update one of 10,000 records       | 10,000 |    1,184 |  2,104 |          1,181 |

Immer's optional `enableArrayMethods()` plugin also runs array methods on the draft's copy, and with patches it comes within 1.13-1.70x of Mutative when moving elements of 1,000 or 10,000 rows. These comparisons leave it off because in Immer 11.1.18 it breaks guarantees that Immer otherwise keeps: `shift`, `pop` and `splice` return raw base objects, so editing a removed object changes the previous state; reordering can expose original objects the same way and leave revoked drafts in the result; and its forward patches can fail to replay. In [the audit](https://github.com/unadlib/mutative/blob/main/test/immer-array-methods.md), 123 of 4,913 three-step operation sequences break with the plugin and none without it. The [performance summary](https://github.com/unadlib/mutative/blob/main/perf-testing/reports/SUMMARY.md) reports Immer with the plugin separately.

## Mutative vs hand-written reducers [#mutative-vs-hand-written-reducers]

A hand-written reducer that copies only what it changes is faster than any library that drafts state, and it was faster than Mutative in 129 of the suite's 150 cases. Mutative was faster when copying wide objects, such as records with 1,000 keys or class instances with 100 fields, by 1.5-2.8x, when inserting at the front of 10,000 rows: 16 µs instead of 28 µs, and when adding a number to a Set of 1,000 or 10,000 numbers, which it copies faster than `new Set()` does: 30 µs instead of 61 µs at 10,000.

Spreads also become slow when code copies the same structure again and again. Mutative copies each object at most once per update, however many changes a recipe makes.

See [Performance tips](/docs/advanced-guides/performance-tips) for recipes that avoid needless drafts, searches, copies, freezing and patches.

## Run the benchmarks [#run-the-benchmarks]

From a clone of the repository:

```sh
pnpm install --frozen-lockfile
pnpm benchmark:immer:check
pnpm benchmark:immer
```

The [benchmark guide](https://github.com/unadlib/mutative/blob/main/perf-testing/README.md) describes the workloads, options, memory measurements, and CI regression budgets.
