---
sidebar_position: 5
---

# Performance

Mutative is about 3x faster than Immer with matched settings and 6x faster with each library's defaults, across 90 benchmarked workloads. A hand-written reducer that copies only what it changes is faster still in most of them.

## Benchmark suite

The [benchmark suite](https://github.com/unadlib/mutative/tree/main/perf-testing) times 90 workloads: Immer's own performance tests, array methods, reads, Map and Set values, object records, class instances, a deep path, patch application, and returned values. It compares Mutative with Immer 11.1.18 and with reducers written by hand, after checking every result against those reducers. The [performance summary](https://github.com/unadlib/mutative/blob/main/perf-testing/reports/SUMMARY.md) has the complete results, the method, and their limits.

## Mutative vs Immer

> Mutative passed all of Immer's test cases.

With matched settings, both freezing or both not and both generating patches or both not, Mutative was faster than Immer in 508 of 530 measured cases, 3.1x on geometric mean. With each library's defaults, Mutative without auto-freeze and Immer with it, Mutative was faster in 133 of 136 cases, 6.0x on geometric mean.

Times are microseconds per update, medians of three runs on an Apple M1 Max with Node.js 24.16.0; lower is better. Mutative, the first Immer column, and the hand-written reducers run without auto-freeze; the second Immer column shows Immer's default.

| Workload | Rows | Mutative | Immer | Immer, auto-freeze | Hand-written |
| --- | ---: | ---: | ---: | ---: | ---: |
| Update one field of a small object | — | 0.65 | 1.02 | 1.32 | 0.05 |
| Update an array item found by ID | 100 | 1.33 | 1.99 | 25.9 | 0.84 |
| 200 RTK Query-style updates | — | 1,031 | 1,180 | 5,209 | 361 |
| Read every row by index | 10,000 | 5,210 | 11,253 | 11,513 | 135 |
| Remove the first row | 10,000 | 7.37 | 8,292 | 9,125 | 1.43 |
| Update every row | 10,000 | 7,008 | 12,803 | 16,454 | 243 |
| Update one of 10,000 records | 10,000 | 1,242 | 2,172 | 3,222 | 2,177 |
| Insert into a 1,000-property object | — | 53.0 | 151 | 238 | 131 |
| Update a Map value | 10,000 | 553 | 557 | 774 | 548 |
| Add a number to a Set | 10,000 | 1,013 | 1,502 | 1,605 | 72.4 |
| Update a class instance | 10,000 | 3.19 | 3.74 | 673 | 1.49 |
| Update a value ten levels deep | — | 3.70 | 4.75 | 8.27 | 0.87 |
| Apply patches to 10% of rows | 10,000 | 1,558 | 1,465 | 2,440 | — |
| Return draft.filter() | 10,000 | 2,444 | 4,188 | 4,645 | 80.2 |
| Return a new state | 10,000 | 2,914 | 8,272 | 0.89 | 0.06 |
| Return it with rawReturn() | 10,000 | 0.30 | 7,865 | 0.89 | 0.06 |

The record and 1,000-property rows ran each library in a process of its own, because code that ran earlier in a process changes how fast V8 copies such wide objects. Immer has no `rawReturn()` and returns the same plain value in the last two rows. Immer was faster in 11 of the 530 matched cases: when returning a new state built from frozen data, which Immer does not search for drafts; when applying patches that replace nested values, by 5-7%; and, with auto-freeze, when updating a class instance with 1,000 fields.

## Large arrays

At 1,000 and 10,000 rows the gap grows. Against Immer without its array-method plugin, Mutative was faster in 164 of 176 cases at these sizes, 3.5x on geometric mean, and faster in every case that moves elements:

| Auto-freeze | Patches | All workloads, 1,000 rows | All workloads, 10,000 rows | Moves, 1,000 rows | Moves, 10,000 rows |
| --- | --- | ---: | ---: | ---: | ---: |
| off | off | 7.3x | 8.8x | 212x | 472x |
| off | on | 3.9x | 4.2x | 6.7x | 7.7x |
| on | off | 2.6x | 2.3x | 32x | 35x |
| on | on | 1.9x | 1.7x | 6.2x | 6.8x |

Each value is the geometric mean of Immer's time over Mutative's; moves are `shift`, `unshift`, `splice` insertion, and `reverse`. Mutative moves elements natively on its copy, while Immer moves each one through its draft proxy: removing the first of 10,000 rows took 7.37 µs against 8,292 µs, 1,125x. With patches, both libraries emit one patch per moved index, which bounds the gain to 6-8x. The [performance summary](https://github.com/unadlib/mutative/blob/main/perf-testing/reports/SUMMARY.md) breaks these results down by scenario.

## With patches

With patches on and auto-freeze off, Mutative was faster than Immer in 126 of 129 cases and never slower, 3.1x on geometric mean, and faster than Mutative 1.3.0 in 103 and within 5% in the rest, 3.7x. In every array case measured it was faster than both: 4.0x Immer and 13x Mutative 1.3.0 on geometric mean. Patches cost little when an update changes a few paths: pushing a row and inserting a property at 10,000 rows took 65.2 µs with patches against 64.8 µs without. Moving elements emits one patch per moved index in every library, so removing the first of 10,000 rows produces 10,000 forward and 10,000 inverse patches.

Times are microseconds per update with patches on and auto-freeze off:

| Workload | Rows | Mutative | Immer | Mutative 1.3.0 |
| --- | ---: | ---: | ---: | ---: |
| Push a row and insert a property | 10,000 | 65.2 | 370 | 212 |
| Update an array item found by ID | 100 | 2.17 | 3.57 | 3.85 |
| 200 RTK Query-style updates | — | 1,325 | 1,520 | 2,172 |
| Remove the first row with `splice` | 100 | 13.5 | 86.5 | 3,108 |
| Insert a row in the middle | 100 | 9.91 | 51.3 | 1,297 |
| Sort rows | 100 | 108 | 217 | 2,622 |
| Remove the first row with `shift` | 10,000 | 1,227 | 10,117 | 282,588 |
| Reverse the rows | 10,000 | 1,226 | 10,167 | 286,207 |
| Update every row | 10,000 | 11,591 | 22,553 | 21,851 |
| Update one of 10,000 records | 10,000 | 1,236 | 2,165 | 1,230 |

Immer's optional `enableArrayMethods()` plugin also runs array methods on the draft's copy, and with patches it comes within 1.05-1.74x of Mutative when moving elements of 1,000 or 10,000 rows. These comparisons leave it off because in Immer 11.1.18 it breaks guarantees that Immer otherwise keeps: `shift`, `pop` and `splice` return raw base objects, so editing a removed object changes the previous state; reordering can expose original objects the same way and leave revoked drafts in the result; and its forward patches can fail to replay. In [the audit](https://github.com/unadlib/mutative/blob/main/test/immer-array-methods.md), 123 of 4,913 three-step operation sequences break with the plugin and none without it. The [performance summary](https://github.com/unadlib/mutative/blob/main/perf-testing/reports/SUMMARY.md) reports Immer with the plugin separately.

## Mutative vs hand-written reducers

A hand-written reducer that copies only what it changes is faster than any library that drafts state, and it was faster than Mutative in 109 of the suite's 129 cases. Mutative was faster when copying wide objects, such as records with 1,000 keys or class instances with 100 fields, by 1.5-2.8x with each measured in a process of its own, and when moving elements of large arrays: inserting at the front of 10,000 rows took 16 µs instead of 86 µs.

Spreads also become slow when code copies the same structure again and again. Mutative copies each object at most once per update, however many changes a recipe makes.

## Run the benchmarks

From a clone of the repository:

```sh
pnpm install --frozen-lockfile
pnpm benchmark:immer:check
pnpm benchmark:immer
```

The [benchmark guide](https://github.com/unadlib/mutative/blob/main/perf-testing/README.md) describes the workloads, options, memory measurements, and CI regression budgets.
