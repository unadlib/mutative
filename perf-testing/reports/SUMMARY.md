# Performance summary

Measurements from 2026-10-06 and 2026-10-07 UTC of the source of `main` at [`2ab58fc`](https://github.com/unadlib/mutative/commit/2ab58fce1210b2b4724fcecce10ff0e1a864ddce). Since the source of the previous batch, `e6b6563`, `main` has added the cheap `current()` of changed arrays of [PR #180](https://github.com/unadlib/mutative/pull/180), the returned-value, frozen-array, Set and moved-element improvements of [PR #183](https://github.com/unadlib/mutative/pull/183), and the draft lifecycle, patch, Map and Set fixes of [PR #184](https://github.com/unadlib/mutative/pull/184); PRs #181, #182, #186 and #189 changed development builds, packaging and rarely used paths. The candidate and the pinned npm baseline both report Mutative 1.3.0. Immer is pinned to 11.1.18 and Mitata to 1.0.34. The main comparison runs Immer without its array-method plugin; a separate dataset below enables `enableArrayMethods`. The raw datasets of this batch were not archived; the identities and commands below reproduce them, and the [archive index](./README.md) describes the retention policy for batches that are.

The Set scenarios were measured again on 2026-10-09 UTC, after [PR #195](https://github.com/unadlib/mutative/pull/195) made Set drafts change their copy directly instead of mapping all their items: `set-add`, `set-delete`, `set-update` and `set-update-10pct` at 100 rows and `set-add` and `set-update` at 1,000 and 10,000 rows, every library in processes of its own, three runs each (312 trials from 96 processes), and the memory of `set-add` at every size. The results below use those cells in place of the earlier ones, except where [shared and isolated processes](#shared-and-isolated-processes) compares the cells of October 6 and 7; [Set drafts](#set-drafts) compares the change with `main`.

The patch application scenarios were measured again on 2026-10-09 UTC as well, after [PR #196](https://github.com/unadlib/mutative/pull/196) made `apply()` read the type of each draft from its state instead of asking its proxy: `apply-update-10pct`, `apply-reverse` and `apply-array-ops` at 100 rows and `apply-update-10pct` and `apply-reverse` at 1,000 and 10,000 rows, every library in processes of its own, three runs each (126 trials from 63 processes), and the memory of `apply-update-10pct` at 100 rows. The results below use those cells too, with the same exception; [Patch application](#patch-application) compares the change with `main`.

Four scenarios were added on 2026-10-09 UTC by [PR #198](https://github.com/unadlib/mutative/pull/198) for improvements of PRs #183 and #184 that only micro-benchmarks had measured: `set-read`, `map-forEach`, `shift-and-update` and `map-set-beside`. They ran with every library in processes of its own, three runs each, at 100, 1,000 and 10,000 rows (468 trials from 144 processes), and `shift-and-update` also with Immer's array-method plugin (72 trials from 18 processes). The results below include their cells, with the same exception; [Set reads, Map iteration, moved rows and unchanged collections](#set-reads-map-iteration-moved-rows-and-unchanged-collections) reports them.

This batch remeasures every scenario and replaces the cross-library comparison of 2026-10-03 and 2026-10-04, which the [history](#history) summarizes. Unlike earlier batches, every timing below comes from processes that each run one scenario with one library. With all libraries in one process, as earlier batches measured every scenario but the wide-object ones, each library ran slower by a different amount, which favored the candidate against Immer and hid much of the hand-written reducer's lead; [shared and isolated processes](#shared-and-isolated-processes) compares the two. The harness is unchanged since the previous batch except for the three `search-*` scenarios of PR #180, which now also run at 1,000 and 10,000 rows and with Immer's array-method plugin.

## Scope and method

Apple M1 Max, 64 GiB RAM, darwin/arm64 (kernel 25.6.0), Node 24.16.0, V8 13.6.233.17-node.49. Jobs ran sequentially with normal desktop activity.

- **Workloads.** 93 scenarios at 100 rows, of which 26 also ran at 1,000 and 10,000 rows: the 23 of the previous batch and the three searches. With the four scenarios added on October 9, which ran at every size, the results cover 97 scenarios, 30 of them at 1,000 and 10,000 rows. The [benchmark guide](../README.md#workloads-and-units) describes each one.
- **Libraries.** The current source, pinned npm Mutative 1.3.0, Immer 11.1.18, and the hand-written reducer that is every scenario's reference result. Each library runs both freeze modes and both patch modes, except that the hand-written reducer runs only without either, and patch application only without patch generation.
- **Timing.** Every scenario ran with every library in processes of its own (`--isolate`), three runs each, covering both freeze and patch modes in each process. Each benchmark first runs its workload for 30 ms on a throwaway fixture. These datasets hold 5,508 trials from 1,719 processes. As a control, the shared-process matrices of earlier batches were measured too, with Map and Set scenarios in processes of their own: 5,508 trials from 18 processes.
- **Isolation.** Code that ran earlier in a process changes how fast V8 runs a library. Copying objects with hundreds of properties took up to about 70 times as long after other code, and every library ran slower beside the others than alone. Isolated processes remove the influence of the other libraries and scenarios, not that of a real application's code.
- **Memory.** 1,110 isolated workers for 13 scenarios at 100 rows and 8 at 1,000 and 10,000 rows.

Each timing cell is one scenario, size, and mode. A candidate time below 95% of the comparator's counts as faster, above 105% as slower, and otherwise as within 5%. Geometric means are comparator time over candidate time, so values above 1 favor the candidate. Scenario counts are not an application-weighted score.

## Results

### Against Immer and Mutative 1.3.0

Cells faster / within 5% / slower, and the geometric mean of comparator time over candidate time. The Immer defaults row compares the candidate without auto-freeze with Immer with it, both without patches.

| Comparator | 100 rows | 1,000 and 10,000 rows | All |
| --- | ---: | ---: | ---: |
| Immer 11.1.18 | 374 / 7 / 1 of 382, 3.06 | 221 / 9 / 2 of 232, 4.68 | 595 / 16 / 3 of 614, 3.59 |
| Immer 11.1.18 with its defaults | 95 / 1 / 1 of 97, 6.28 | 58 / 0 / 2 of 60, 7.31 | 153 / 1 / 3 of 157, 6.66 |
| Pinned npm Mutative 1.3.0 | 348 / 33 / 1 of 382, 3.48 | 195 / 37 / 0 of 232, 6.02 | 543 / 70 / 1 of 614, 4.28 |
| Hand-written reducer | 7 / 0 / 87 of 94, 0.11 | 11 / 3 / 42 of 56, 0.13 | 18 / 3 / 129 of 150, 0.12 |

Against Immer by workload group, faster / within 5% / slower and geometric mean:

| Group | 100 rows | 1,000 rows | 10,000 rows |
| --- | ---: | ---: | ---: |
| Upstream workloads | 82 / 1 / 1, 2.03 | — | — |
| Reads | 20 / 0 / 0, 1.59 | 12 / 0 / 0, 1.60 | 12 / 0 / 0, 1.87 |
| No-op producers | 7 / 1 / 0, 1.69 | — | — |
| Small state | 12 / 0 / 0, 1.66 | — | — |
| Mutation density | 12 / 0 / 0, 2.10 | 4 / 0 / 0, 1.90 | 4 / 0 / 0, 1.92 |
| Array methods | 132 / 0 / 0, 5.75 | 20 / 0 / 0, 23.77 | 20 / 0 / 0, 31.12 |
| Moved elements | 4 / 0 / 0, 12.93 | 4 / 0 / 0, 21.84 | 4 / 0 / 0, 30.39 |
| Map and Set | 46 / 2 / 0, 2.26 | 25 / 3 / 0, 2.52 | 24 / 4 / 0, 2.51 |
| Object records | 11 / 1 / 0, 1.26 | 8 / 0 / 0, 2.34 | 8 / 0 / 0, 1.61 |
| Class instances | 6 / 2 / 0, 1.74 | 6 / 0 / 2, 1.61 | 6 / 2 / 0, 1.64 |
| Deep path | 4 / 0 / 0, 1.54 | — | — |
| Push and insert | 8 / 0 / 0, 2.01 | 4 / 0 / 0, 2.41 | 4 / 0 / 0, 3.34 |
| Patch application | 6 / 0 / 0, 4.08 | 4 / 0 / 0, 1.65 | 4 / 0 / 0, 1.58 |
| Returned values | 12 / 0 / 0, 3.83 | 12 / 0 / 0, 5.60 | 12 / 0 / 0, 8.85 |
| Searches | 12 / 0 / 0, 5.14 | 12 / 0 / 0, 8.33 | 12 / 0 / 0, 9.47 |

The 3 cells slower than Immer are `class-wide-update` with freeze on at 1,000 rows (411 µs and 415 µs against 239 µs and 238 µs) and `concat` with freeze and patches on at 100 rows (22.5 µs against 20.8 µs, a cell whose three candidate processes measured 19.2–22.8 µs); see the limits below. With each library's defaults, the candidate is slower only in `return-replace`, at every size: without auto-freeze it searches the returned state for drafts, which Immer's auto-freeze skips because the state is frozen (27.0 µs, 256 µs and 2.59 ms against 0.78–0.79 µs). The one cell slower than Mutative 1.3.0 is the same `concat` cell, against 18.3 µs.

### Large arrays

Against Immer without its array-method plugin, by size and mode, over the 30 scaling scenarios: cells faster / within 5% / slower, and geometric means of Immer time over candidate time. The moves are `array-shift-nested`, `array-unshift-nested`, `array-splice-insert-nested`, `array-reverse-nested` and `array-reverse-primitive`.

| Rows | Freeze | Patches | All scenarios | Geometric mean | Moves, geometric mean | Moves, range |
| ---: | --- | --- | ---: | ---: | ---: | ---: |
| 1,000 | off | off | 29 / 1 / 0 | 8.59 | 211 | 72.0–492 |
| 1,000 | off | on | 27 / 1 / 0 | 4.11 | 7.1 | 6.1–7.5 |
| 1,000 | on | off | 28 / 1 / 1 | 3.84 | 32.4 | 18.5–46.9 |
| 1,000 | on | on | 27 / 0 / 1 | 2.68 | 6.6 | 6.1–6.9 |
| 10,000 | off | off | 28 / 2 / 0 | 10.58 | 442 | 176–1,213 |
| 10,000 | off | on | 27 / 1 / 0 | 4.61 | 7.5 | 5.0–9.7 |
| 10,000 | on | off | 28 / 2 / 0 | 4.18 | 39.7 | 22.2–53.0 |
| 10,000 | on | on | 27 / 1 / 0 | 2.86 | 7.1 | 5.1–9.0 |

Immer time over candidate time for the moves at 10,000 rows, by freeze and patch mode:

| Scenario | Off, off | Off, on | On, off | On, on |
| --- | ---: | ---: | ---: | ---: |
| array-shift-nested | 1,213 | 9.7 | 49.1 | 9.0 |
| array-unshift-nested | 474 | 8.9 | 41.8 | 8.2 |
| array-splice-insert-nested | 176 | 6.4 | 22.2 | 6.0 |
| array-reverse-nested | 551 | 8.8 | 40.5 | 8.1 |
| array-reverse-primitive | 302 | 5.0 | 53.0 | 5.1 |

The gap widens with size. With freeze and patches off, the moves were 211 times faster at 1,000 rows and 442 times at 10,000 on geometric mean: the candidate moves elements natively on its copy, while Immer moves each element through its draft proxy. Removing the first of 10,000 rows took 7.10 µs against 8,605 µs. With patches, both libraries emit one patch per moved index, which bounds the gain to 5–10 times. At these sizes Immer was faster only in `class-wide-update` with freeze on at 1,000 rows, and within 5% in Map updates without freezing and `class-wide-update` with freeze on at 10,000 rows, which the limits below discuss, and in three cells of `set-read`, where both libraries only read the Set.

### Freeze off, patches on

With patches on and freeze off, the candidate was faster than Immer in 148 of 150 cells and within 5% in the other 2, the Map updates at 1,000 and 10,000 rows (geometric mean 3.30). It was faster than Mutative 1.3.0 in 132 and within 5% in 18 (4.59). In the 70 array-related cells, array methods, the update of a moved row, searches and the upstream array workloads at every size, it was faster than both in every cell: 4.44 times Immer and 13.23 times Mutative 1.3.0 on geometric mean.

Patches cost little when an update changes a few paths. They added a median 1% to the candidate's time at 1,000 and 10,000 rows and 20% at 100 rows. The former `benchmark:base` workload, `push-and-insert` at 10,000 rows, took 62.8 µs without patches and 63.3 µs with them; Mutative 1.3.0 went from 67.0 µs to 208 µs, and Immer from 162 µs to 364 µs. Moving elements is the exception: both libraries emit one patch per moved index, so `shift` at 10,000 rows produces 10,000 forward and 10,000 inverse patches in each. The candidate's time grows from 7.10 µs to 1,071 µs, against 10,376 µs for Immer producing the same patches.

Array methods on nested rows at 100 rows, in µs per call. The primitive and shallow shapes behave alike; over all 33 cells the candidate is 4.05 times faster than Immer (1.3–7.4) and 8.51 times faster than Mutative 1.3.0 (1.4–217).

| Operation | Candidate | Immer | Mutative 1.3.0 | Immer/candidate | 1.3.0/candidate |
| --- | ---: | ---: | ---: | ---: | ---: |
| push | 3.84 | 7.01 | 5.54 | 1.83 | 1.44 |
| pop | 1.50 | 6.14 | 3.71 | 4.08 | 2.46 |
| shift | 11.4 | 82.2 | 2,391 | 7.24 | 210.55 |
| unshift | 14.3 | 87.8 | 2,333 | 6.13 | 162.84 |
| splice, insert | 8.89 | 48.8 | 1,201 | 5.49 | 135.15 |
| splice, remove | 6.24 | 45.1 | 1,204 | 7.23 | 192.97 |
| splice, replace | 3.50 | 9.51 | 6.22 | 2.72 | 1.78 |
| fill | 4.27 | 8.11 | 6.97 | 1.90 | 1.63 |
| copyWithin | 2.45 | 5.70 | 74.8 | 2.33 | 30.54 |
| sort | 103 | 129 | 2,395 | 1.25 | 23.26 |
| reverse | 11.3 | 83.4 | 2,465 | 7.35 | 217.15 |

The array workloads of the upstream suite at 100 rows:

| Scenario | Candidate | Immer | Mutative 1.3.0 | Immer/candidate | 1.3.0/candidate |
| --- | ---: | ---: | ---: | ---: | ---: |
| add | 1.79 | 4.19 | 3.57 | 2.33 | 1.99 |
| remove | 11.6 | 84.9 | 2,983 | 7.33 | 257.69 |
| filter | 22.3 | 31.5 | 36.0 | 1.41 | 1.61 |
| concat | 0.79 | 1.00 | 1.05 | 1.27 | 1.33 |
| mapNested | 40.1 | 59.6 | 78.2 | 1.49 | 1.95 |
| sortById-reverse | 66.5 | 83.5 | 2,950 | 1.26 | 44.38 |
| reverse-array | 11.4 | 82.2 | 2,975 | 7.22 | 261.15 |
| update-multiple | 7.41 | 16.8 | 16.3 | 2.26 | 2.20 |
| remove-high | 19.8 | 49.6 | 602 | 2.51 | 30.43 |
| remove-reuse | 134 | 806 | 27,939 | 6.01 | 208.24 |
| mixed-sequence | 51.0 | 92.3 | 142 | 1.81 | 2.77 |

Moving elements at 1,000 and 10,000 rows, with Immer's array-method plugin from the plugin datasets for reference:

| Scenario | Rows | Candidate | Immer | Mutative 1.3.0 | Immer + plugin |
| --- | ---: | ---: | ---: | ---: | ---: |
| array-shift-nested | 1,000 | 109 | 798 | 25,196 | 125 |
| array-splice-insert-nested | 1,000 | 58.0 | 436 | 11,963 | 82.9 |
| array-reverse-nested | 1,000 | 110 | 809 | 26,537 | 124 |
| array-shift-nested | 10,000 | 1,071 | 10,376 | 273,162 | 1,380 |
| array-unshift-nested | 10,000 | 1,079 | 9,567 | 281,936 | 1,393 |
| array-splice-insert-nested | 10,000 | 703 | 4,478 | 132,028 | 934 |
| array-reverse-nested | 10,000 | 1,074 | 9,416 | 277,427 | 1,375 |
| array-reverse-primitive | 10,000 | 1,196 | 6,036 | 5,295 | 1,979 |

#### Why Immer's array-method plugin is not the main comparator

Immer's optional `enableArrayMethods()` also runs array methods on the draft's copy, and with patches it comes within 1.13–1.71 times of the candidate on the moves above. The comparisons nevertheless run Immer without it, because in Immer 11.1.18 the plugin breaks guarantees that its other configurations and Mutative keep. [`test/immer-array-methods.md`](../../test/immer-array-methods.md) reproduces four root causes:

- `shift`, `pop` and `splice` return raw base objects. Editing a removed object changes the previous state, or throws when that state is frozen.
- `reverse` and `sort` can expose original objects at inserted indices as raw values, with the same effect; inverse patches then restore the modified values instead of the original ones.
- After an insertion, edits to the shifted tail emit child patches before the array additions, so the forward patches cannot be replayed.
- Reordering a wrapper that holds a moved draft, or a negative `splice` index, leaves revoked drafts in the result and in patch values.

Of 4,913 three-step operation sequences, 123 violate at least one of these contracts with the plugin and none without it. The plugin also hands raw base elements to callbacks and comparators, which is why it beats the candidate in `find`, `findIndex`, `filter` and object `sort` cells: the callback reads the base without drafting it. The benchmark callbacks only read, so these results are correct with the plugin; recipes that edit removed objects or callback arguments are not.

### Searches of changed arrays

The `search-*` scenarios find the last row of an array of nested rows and update it after the producer changed the array: `search-draft` searches the draft after updating the first row, `search-current` searches a `current()` snapshot after the same update, and `search-current-shifted` searches a snapshot after `shift()`. Microseconds per scenario, medians of three runs, patches off:

| Scenario | Rows | Freeze | Mutative | Mutative 1.3.0 | Immer | Hand-written | Immer/Mutative |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| search-draft | 100 | off | 20.4 | 37.3 | 30.1 | 0.15 | 1.48 |
| search-draft | 100 | on | 22.9 | 40.2 | 38.0 | — | 1.66 |
| search-current | 100 | off | 12.3 | 43.6 | 238 | 0.14 | 19.36 |
| search-current | 100 | on | 14.9 | 46.0 | 34.9 | — | 2.35 |
| search-current-shifted | 100 | off | 3.58 | 147 | 97.4 | 0.13 | 27.23 |
| search-current-shifted | 100 | on | 5.86 | 151 | 105 | — | 17.97 |
| search-draft | 1,000 | off | 192 | 342 | 274 | 0.89 | 1.43 |
| search-draft | 1,000 | on | 211 | 361 | 345 | — | 1.63 |
| search-current | 1,000 | off | 24.3 | 333 | 2,287 | 0.88 | 94.16 |
| search-current | 1,000 | on | 42.4 | 357 | 259 | — | 6.11 |
| search-current-shifted | 1,000 | off | 22.7 | 1,406 | 928 | 0.86 | 40.85 |
| search-current-shifted | 1,000 | on | 41.4 | 1,435 | 999 | — | 24.14 |
| search-draft | 10,000 | off | 2,126 | 3,729 | 3,465 | 65.4 | 1.63 |
| search-draft | 10,000 | on | 2,258 | 3,881 | 4,057 | — | 1.80 |
| search-current | 10,000 | off | 176 | 3,441 | 22,888 | 21.9 | 129.80 |
| search-current | 10,000 | on | 354 | 3,618 | 2,449 | — | 6.92 |
| search-current-shifted | 10,000 | off | 257 | 15,874 | 11,230 | 64.7 | 43.74 |
| search-current-shifted | 10,000 | on | 432 | 16,115 | 11,913 | — | 27.58 |

A snapshot search was faster than the draft search at every size: 1.7 times at 100 rows, 7.9 times at 1,000 and 12 times at 10,000 with freeze off. The draft search drafts every row it visits, while `current()` copies the changed array from its current elements. After `shift()`, the search at 10,000 rows took 257 µs, against 772 µs when PR #180 was measured: updating the moved last row now finds its original index by searching the original array instead of building a map of all 10,000 original indices (PR #183). Immer's `current()` walks every unfrozen object, so with freeze off its snapshot searches are slower than its draft search.

### Set drafts

[PR #195](https://github.com/unadlib/mutative/pull/195) changed how a Set draft tracks its items. Its first change or iteration used to build a Map of all items, every change went through that Map, and finalization cleared the copy and added every item back from it, even when no item had to be replaced. A Set draft now adds and deletes items in its copy and maps only the items that drafts stand for, and finalization rebuilds the Set only once one of them changed. Mutative alone in processes of its own, the source of `main` at `e6af4b0` and that of the PR in alternating order, three runs each, µs per update:

| Scenario | Items | Freeze | Patches | `main` | PR #195 | PR/`main` |
| --- | ---: | --- | --- | ---: | ---: | ---: |
| set-add | 100 | off | off | 6.51 | 0.70 | 0.11 |
| set-add | 100 | on | off | 6.87 | 1.11 | 0.16 |
| set-add | 100 | off | on | 8.38 | 2.59 | 0.31 |
| set-delete | 100 | off | off | 6.40 | 0.69 | 0.11 |
| set-add | 1,000 | off | off | 66.9 | 1.29 | 0.02 |
| set-add | 10,000 | off | off | 987 | 33.2 | 0.03 |
| set-add | 10,000 | on | off | 1,000 | 62.6 | 0.06 |
| set-add | 10,000 | off | on | 1,396 | 452 | 0.32 |
| set-update | 100 | off | off | 8.27 | 3.39 | 0.41 |
| set-update | 10,000 | off | off | 1,053 | 542 | 0.52 |
| set-update-10pct | 100 | off | off | 10.90 | 6.98 | 0.64 |

Over all 32 cells, four Set scenarios at 100 rows and two at 1,000 and 10,000 rows in every mode, the PR took 0.28 of the time of `main` on geometric mean and was faster in each. Additions and deletions no longer copy the items into a Map and back, so without patches they now cost little more than copying the Set: `set-add` at 10,000 items allocated 325 KiB per update, against 2,878 KiB for Mutative 1.3.0. With patches, a Set that added or deleted items still compares all items to emit its own patches, which bounds that gain to about 3 times, and a changed item still rebuilds the Set in order. Against the other libraries the candidate was faster than Immer in every Set cell, 2.9–51.1 times, and faster than the hand-written reducer in `set-add` at 1,000 and 10,000 rows, where `Set.prototype.difference` copies the Set faster than the reducer's `new Set()`.

### Patch application

[PR #196](https://github.com/unadlib/mutative/pull/196) changed how `apply()` finds the type of each value on a patch path. It asked every draft on the path for its type twice, once for the step itself and once to read the next value, and `getType` tests `instanceof Map` and `instanceof Set`, which reach the `getPrototypeOf` trap of the draft's proxy; in a profile of `apply-update-10pct` at 1,000 rows, `getType` took 47% of the time. `apply()` now reads the type of a draft from its state, once per step. Other values are typed with `getType` as before, and a mutable application, which changes the objects of the application in place, reads nothing else from them. Mutative alone in processes of its own, the source of `main` at `4ca6345` and that of the PR in alternating order, three runs each, µs per patch application:

| Scenario | Rows | Freeze | `main` | PR #196 | PR/`main` |
| --- | ---: | --- | ---: | ---: | ---: |
| apply-update-10pct | 100 | off | 14.2 | 6.98 | 0.49 |
| apply-update-10pct | 100 | on | 18.5 | 11.3 | 0.61 |
| apply-update-10pct | 1,000 | off | 142 | 70.2 | 0.49 |
| apply-update-10pct | 1,000 | on | 176 | 105 | 0.60 |
| apply-update-10pct | 10,000 | off | 1,440 | 738 | 0.51 |
| apply-update-10pct | 10,000 | on | 1,766 | 1,079 | 0.61 |
| apply-reverse | 100 | off | 119 | 91.1 | 0.77 |
| apply-reverse | 100 | on | 137 | 110 | 0.80 |
| apply-reverse | 10,000 | off | 12,647 | 9,934 | 0.79 |
| apply-reverse | 10,000 | on | 14,540 | 11,694 | 0.80 |
| apply-array-ops | 100 | off | 3.83 | 2.98 | 0.78 |
| apply-array-ops | 100 | on | 6.32 | 5.42 | 0.86 |

Over all 14 cells, three patch application scenarios at 100 rows and two at 1,000 and 10,000 rows in both freeze modes, the PR took 0.68 of the time of `main` on geometric mean and was faster in each. Replacing nested values took half the time without auto-freeze and 0.6 of it with auto-freeze, so `apply-update-10pct`, where the candidate was 16–22% slower than Immer without auto-freeze, is now faster than Immer at every size, 1.6–2.0 times. Structural patches spend more of their time outside the path walk and gained less.

### Set reads, Map iteration, moved rows and unchanged collections

PRs #183 and #184 measured four of their improvements with micro-benchmarks only, so [PR #198](https://github.com/unadlib/mutative/pull/198) added a scenario for each. Microseconds per scenario, medians of three runs, patches off:

| Scenario | Rows | Freeze | Mutative | Mutative 1.3.0 | Immer | Hand-written | Immer/Mutative | 1.3.0/Mutative |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| set-read | 100 | off | 0.63 | 4.83 | 0.67 | 0.03 | 1.07 | 7.70 |
| set-read | 1,000 | off | 0.62 | 39.8 | 0.66 | 0.04 | 1.06 | 64.39 |
| set-read | 10,000 | off | 0.62 | 558 | 0.65 | 0.03 | 1.04 | 894 |
| map-forEach | 100 | off | 2.55 | 9.25 | 3.23 | 0.59 | 1.27 | 3.63 |
| map-forEach | 1,000 | off | 26.4 | 87.4 | 29.9 | 5.46 | 1.13 | 3.31 |
| map-forEach | 10,000 | off | 263 | 866 | 290 | 54.3 | 1.10 | 3.29 |
| shift-and-update | 100 | off | 1.60 | 84.2 | 71.8 | 0.07 | 44.98 | 52.71 |
| shift-and-update | 1,000 | off | 2.96 | 801 | 675 | 0.32 | 228 | 270 |
| shift-and-update | 10,000 | off | 15.9 | 9,610 | 8,768 | 1.40 | 553 | 606 |
| shift-and-update | 100 | on | 4.93 | 86.5 | 78.7 | — | 15.96 | 17.54 |
| shift-and-update | 1,000 | on | 32.3 | 831 | 748 | — | 23.18 | 25.77 |
| shift-and-update | 10,000 | on | 301 | 9,693 | 9,304 | — | 30.94 | 32.23 |
| map-set-beside | 100 | off | 8.89 | 17.0 | 23.0 | 4.34 | 2.58 | 1.91 |
| map-set-beside | 1,000 | off | 44.7 | 114 | 167 | 42.5 | 3.74 | 2.54 |
| map-set-beside | 10,000 | off | 576 | 1,537 | 2,013 | 594 | 3.50 | 2.67 |
| map-set-beside | 100 | on | 12.1 | 38.5 | 29.1 | — | 2.41 | 3.19 |
| map-set-beside | 1,000 | on | 66.4 | 309 | 201 | — | 3.03 | 4.65 |
| map-set-beside | 10,000 | on | 775 | 3,471 | 2,308 | — | 2.98 | 4.48 |

- `set-read` checks whether a Set of numbers holds its middle number and a missing one, and reads its size. Mutative 1.3.0 mapped every item of a Set draft as soon as the recipe read the Set, and copied the Set when a lookup missed; the candidate does neither until the recipe changes the Set (PR #183), as Immer does. Both took 0.6–0.7 µs at every size, and 4 of the 12 cells against Immer are within 5%.
- `map-forEach` sums a Map of numbers with `forEach()`. Mutative 1.3.0 called `get()` through the draft's proxy for each entry; the candidate reads each entry from the draft's state (PR #184), which takes 0.3 of the time, and 0.8–0.9 of Immer's. The hand-written reducer's native `forEach()` took a fifth of the candidate's time.
- `shift-and-update` removes the first row with `shift()` and updates the middle row. The candidate moves the rows natively on its copy and finds the moved row's original index by searching the original array from its end (PR #183), while Immer and Mutative 1.3.0 move every row through the draft's proxy. With Immer's array-method plugin, the candidate was faster in every cell, 1.1–24 times. With auto-freeze, finding the moved row takes longer; see the limits below.
- `map-set-beside` inserts a row into a Map of rows and a number into a Set of numbers, which copies both, and then updates a number beside them in nine more producers. Without auto-freeze the copies dominate in every library: at 10,000 rows the candidate was within 5% of the hand-written reducer. With auto-freeze, Mutative 1.3.0 walked both copies again in each later producer, since it froze Map and Set instances only by replacing their mutators; the candidate freezes the instances themselves (PR #184), so the later producers skip them, as Immer's do.

Each scenario detects the loss of the improvement it covers. Built from the commit that made each improvement and from the commit before it, with Mutative alone in three alternating processes at 1,000 rows, the earlier build took 62–65 times as long in `set-read` in every mode (39.8 µs against 0.62 µs without freezing or patches), 3.5 times in `map-forEach` (91.9 µs against 25.9 µs), 11 times in `shift-and-update` without freezing or patches (32.7 µs against 2.94 µs) and 1.5 times with freezing alone, and 2.0–2.3 times in `map-set-beside` with auto-freeze (311 µs against 135 µs without patches). The CI budgets fail a cell at 1.30 times.

### Selected times

Microseconds per complete scenario, medians of three runs.

| Scenario | Rows | Freeze | Patches | Mutative | Mutative 1.3.0 | Immer | Hand-written | Immer/Mutative |
| --- | ---: | --- | --- | ---: | ---: | ---: | ---: | ---: |
| small-object-update | 100 | off | off | 0.51 | 0.81 | 0.70 | 0.02 | 1.37 |
| read-index | 100 | off | off | 45.8 | 61.4 | 86.6 | 0.14 | 1.89 |
| rtkq-sequence | 100 | off | off | 1,018 | 1,830 | 1,159 | 355 | 1.14 |
| sortById-reverse | 100 | off | off | 53.0 | 93.7 | 70.4 | 1.22 | 1.33 |
| array-shift-nested | 100 | off | off | 0.72 | 80.0 | 69.3 | 0.05 | 96.76 |
| update-largeObject1 | 100 | off | off | 51.0 | 51.0 | 146 | 129 | 2.87 |
| update-largeObject1 | 100 | on | off | 132 | 138 | 231 | — | 1.75 |
| object-update | 100 | off | off | 3.16 | 6.12 | 3.45 | 2.14 | 1.09 |
| map-update | 100 | off | off | 4.55 | 5.19 | 4.95 | 3.66 | 1.09 |
| set-update | 100 | off | off | 3.39 | 8.98 | 42.0 | 2.14 | 12.37 |
| class-update | 100 | on | off | 3.86 | 5.22 | 9.24 | — | 2.40 |
| apply-array-ops | 100 | off | off | 2.99 | 115 | 100 | — | 33.57 |
| return-filter | 100 | off | off | 23.8 | 26.2 | 32.6 | 0.19 | 1.37 |
| search-current | 100 | off | off | 12.3 | 43.6 | 238 | 0.14 | 19.36 |
| array-splice-insert-nested | 1,000 | off | off | 4.90 | 394 | 352 | 2.03 | 71.98 |
| object-update | 1,000 | off | off | 51.9 | 53.2 | 127 | 129 | 2.45 |
| class-wide-update | 1,000 | on | off | 411 | 409 | 239 | — | 0.58 |
| map-update | 1,000 | off | off | 40.4 | 41.2 | 41.1 | 39.3 | 1.02 |
| array-shift-nested | 10,000 | off | off | 7.10 | 8,548 | 8,605 | 1.40 | 1212.71 |
| array-unshift-nested | 10,000 | off | off | 15.9 | 8,220 | 7,547 | 28.3 | 474.21 |
| array-reverse-nested | 10,000 | off | off | 13.7 | 8,627 | 7,555 | 9.68 | 551.48 |
| array-reverse-nested | 10,000 | off | on | 1,074 | 277,427 | 9,416 | — | 8.76 |
| read-index | 10,000 | off | off | 5,094 | 6,293 | 11,773 | 55.5 | 2.31 |
| set-update | 10,000 | off | off | 544 | 1,057 | 6,119 | 411 | 11.24 |
| object-update | 10,000 | off | off | 1,175 | 1,189 | 2,109 | 2,113 | 1.79 |
| apply-reverse | 10,000 | off | off | 9,918 | 13,772 | 13,889 | — | 1.40 |
| push-and-insert | 10,000 | off | on | 63.3 | 208 | 364 | — | 5.76 |
| return-replace | 10,000 | on | off | 0.53 | 2,630 | 0.79 | — | 1.48 |
| search-current-shifted | 10,000 | off | off | 257 | 15,874 | 11,230 | 64.7 | 43.74 |

### Against a hand-written reducer

The hand-written reducer is faster than the candidate in 129 of 150 cells, and across all 150 the candidate takes 8.3 times as long on geometric mean: the reducer copies only what each update changes and has no draft to create, track, or finalize. The candidate is faster in 18 cells. Fifteen copy wide objects: objects with 1,000 and 3,000 properties, records with 1,000 or 10,000 keys, and class instances with 100 or more fields, by 1.5–2.7 times. One inserts at the front of an array of 10,000 rows, where the reducer's spread copies every element and `unshift` runs natively on the draft's copy: 15.9 µs against 28.3 µs; at 100 and 1,000 rows the reducer was faster. Two add a number to a Set of 1,000 or 10,000 numbers, which the candidate copies with `Set.prototype.difference`, faster than the reducer's `new Set()`: 1.28 µs against 4.10 µs and 34.1 µs against 66.0 µs; at 100 numbers the reducer was faster, 0.44 µs against 0.70 µs. Copying a Map of 1,000 or 10,000 entries dominates `map-update` in both, which are within 5%, and so does copying a Map and a Set of 10,000 entries in `map-set-beside`. The hand-written reducer is the same spread-based code that validates every scenario; faster hand-written code exists for many of them.

### Shared and isolated processes

Earlier batches ran every scenario except the wide-object ones with all four libraries together, in one process per run and a second one for the Map and Set scenarios. This batch measured every cell both ways, and in a process of its own every library was faster, by different amounts. This comparison uses the cells of October 6 and 7, before the Set scenarios were measured again. Over all 566 cells, the shared-process times were longer on geometric mean by 1.08 times for the candidate, 1.15 times for Mutative 1.3.0 and 1.12 times for Immer, and over the 138 cells of the hand-written reducer by 1.67 times; at the 95th percentile by 1.26, 1.42, 1.45 and 5.67 times. In a shared process the recipes, the hand-written reducer and the libraries handle the objects of every scenario, so V8 optimizes them for many object shapes at once; in a process of its own each handles the shapes of one scenario. Small code gains the most: the hand-written reducer summed 100 rows in 0.14 µs alone and in 0.71 µs beside the others. Immer gained more than the candidate, most of all in Set updates: adding a number to a 100-item Set took Immer 5.9 µs alone and 14.0 µs beside the others, and the candidate 6.4 µs and 6.5 µs.

| Comparator | All in shared processes | Isolated processes |
| --- | ---: | ---: |
| Immer 11.1.18 | 551 / 12 / 3 of 566, 3.50 | 536 / 21 / 9 of 566, 3.37 |
| Immer 11.1.18 with its defaults | 142 / 0 / 3 of 145, 6.10 | 141 / 1 / 3 of 145, 5.98 |
| Pinned npm Mutative 1.3.0 | 497 / 61 / 8 of 566, 3.79 | 470 / 95 / 1 of 566, 3.57 |
| Hand-written reducer | 17 / 1 / 120 of 138, 0.16 | 16 / 2 / 120 of 138, 0.11 |

Most of the difference against Immer lies at 100 rows (3.08 shared, 2.92 isolated); at 1,000 and 10,000 rows the geometric means are 4.43 and 4.39. The isolated processes give the more even comparison between libraries, and every result above uses them. Each one measures a workload alone, as a microbenchmark does; in an application, the application's own code shares V8's state as the other libraries did here.

Inserting a property into the 1,000-property object also depended on the order of the code that ran before it in a shared process. With libraries in alternating orders in six processes, the hand-written reducer took 1.70–1.73 µs when it ran after the libraries and 130–133 µs when it ran first; Immer 2.69–2.70 µs after the hand-written reducer and 152–155 µs after Mutative; the candidate 53.9–57.6 µs first and 97.9–103 µs after the others. In processes of their own the candidate and Mutative 1.3.0 took 51.0 µs, Immer 146 µs, and the hand-written reducer 129 µs. A separate effect made the first timed run of a scenario in a process slower: updating a 100-key record took 12–15 µs in every library there and 3–4 µs afterwards. Priming each benchmark removed it.

### Memory

Sampled allocation of the candidate was below Mutative 1.3.0 in 107 of 114 memory cells. The exceptions are `noop-empty` in three modes and `small-object-update` with patches, by at most 0.2 KiB; and `map-update` at 10,000 entries, by 0.4% with patches and without freezing, and by 20–29% with auto-freeze (3.7 MiB against 2.9–3.1 MiB). That last difference depends on what a worker runs before it measures: in workers that validate only the measured patch mode, the current source and that of the previous batch both allocated 2.9 MiB, and the cell's time equals that of 1.3.0 (692 µs against 691 µs). It was below Immer in 77 of 114 cells: lower for reads, array moves, Set additions, returned filters, and patch application; higher for Map drafts (up to 2.3 times), the push-and-insert fixture (1.1–2.6 times), the 1,000-key record (113 against 16 KiB), and by a few KiB for no-op, small-object, record, and class-instance producers. Objects with more than 128 keys are copied into dictionary-mode objects, which also retain 48 KiB per output at 1,000 keys, against 8 KiB for the other libraries.

| Scenario | Rows | Patches | Candidate | Mutative 1.3.0 | Immer | Hand-written |
| --- | ---: | --- | ---: | ---: | ---: | ---: |
| read-index | 100 | off | 98.6 | 150.1 | 192.3 | 1.7 |
| push-and-insert | 100 | off | 115.2 | 1,365.6 | 66.0 | 19.3 |
| object-update | 1,000 | off | 112.9 | 1,311.7 | 15.9 | 10.9 |
| set-add | 10,000 | off | 325.4 | 2,878.1 | 1,606.8 | 321.7 |
| array-reverse-nested | 10,000 | off | 89.0 | 11,077.6 | 12,840.4 | 83.4 |
| array-reverse-nested | 10,000 | on | 3,028.5 | 268,460.6 | 15,102.0 | — |

Sampled KiB allocated per iteration with freeze off, medians of three isolated workers. With patches, nested reverse at 10,000 rows retains about 1,797 KiB per output, against 9,891 KiB for Mutative 1.3.0 and 1,797 KiB for Immer.

### Immer with `enableArrayMethods`

The plugin datasets rerun the array-related scenarios with Immer's array-method plugin enabled, measuring only the candidate and Immer (`--library both --immer-array-methods`), each in processes of its own: 52 scenarios at 100 rows and 16 at 1,000 and 10,000 rows, in both freeze and patch modes. All 656 combinations pass the correctness checks. These scenarios only read in their callbacks, so the plugin's documented behavior, raw objects handed to callbacks and returned from removals, does not change their results; [`test/immer-array-methods.md`](../../test/immer-array-methods.md) records the failures it causes when they write. The [freeze-off, patches-on section](#why-immers-array-method-plugin-is-not-the-main-comparator) explains why the main comparison leaves the plugin off.

| Comparator | Faster / within 5% / slower | Geometric mean Immer/candidate |
| --- | ---: | ---: |
| Immer 11.1.18 with `enableArrayMethods`, all plugin cells | 264 / 6 / 58 of 328 | 1.86 |
| Array-method scenarios only | 158 / 1 / 13 of 172 | 2.37 |

| Scenario | Rows | Freeze | Patches | Candidate | Immer + plugin | Immer/candidate |
| --- | ---: | --- | --- | ---: | ---: | ---: |
| array-shift-nested | 10,000 | off | off | 7.06 | 396 | 56.10 |
| array-shift-nested | 10,000 | off | on | 1,069 | 1,380 | 1.29 |
| array-shift-nested | 10,000 | on | off | 182 | 1,133 | 6.23 |
| array-reverse-nested | 10,000 | off | off | 13.8 | 385 | 27.97 |
| array-reverse-nested | 10,000 | off | on | 1,073 | 1,375 | 1.28 |
| array-splice-insert-nested | 10,000 | off | off | 20.9 | 414 | 19.79 |
| array-reverse-primitive | 10,000 | off | off | 13.7 | 369 | 26.93 |
| array-shift-nested | 1,000 | off | on | 110 | 125 | 1.14 |
| array-shift-nested | 100 | off | off | 0.73 | 2.58 | 3.55 |
| array-push-primitive | 100 | off | off | 1.08 | 0.79 | 0.73 |
| array-sort-nested | 100 | off | off | 90.3 | 8.46 | 0.09 |
| search-draft | 10,000 | off | off | 2,135 | 91.1 | 0.04 |
| read-missing | 10,000 | off | off | 2,006 | 69.4 | 0.03 |

Immer with the plugin is faster in 58 cells. Most are scenarios where the plugin hands raw base elements to a callback or comparator, which Mutative never does: `find` in `read-missing` (25–29 times at 1,000 and 10,000 rows), `findIndex` in `remove-high`, `remove-high-reuse` and `search-draft` (up to 23 times at 10,000 rows), `filter` in `filter` and `return-filter`, and sorts of objects in `sortById-reverse`, `array-sort-shallow` and `array-sort-nested`. The others are `push` and `pop` on 100 rows with freeze and patches off, which Mutative leaves on the proxy path: 1.1–1.3 µs against 0.7–1.0 µs, and `add`, which pushes a row. Every `shift`, `unshift`, `splice` and `reverse` cell is faster than Immer with the plugin; at 10,000 rows by 20–56 times with freeze and patches off, 5.5–11 times with freeze on, and 1.3–2.1 times with patches on. So is every cell of `shift-and-update`, by 1.1–24 times.

### Paired performance budget

The local budget gate compared the current build with itself at 1,000 rows, since this batch changes no Mutative source file. All 48 decisions passed: five latency pairs and three memory pairs per cell, both freeze and patch modes. Paired candidate/base median ratios span 0.970–1.023 for sampled allocation and 1.000 for retained heap. For latency they span 0.995–1.036 in 18 of the 32 cells; the 14 others are array moves with patches (1.17–1.26) or with freeze on (1.07–1.09), which four of the five candidate processes and one of the five base processes ran more slowly. The two builds were identical, so this is variance between processes, and it came close to the 1.30 budget. The timing matrices did not show it: the three process means of each of those cells at 1,000 rows stayed within 4% of each other.

### Changes since the previous batch

This comparison uses the shared-process matrices that the previous batch published, with the wide-object scenarios in processes of their own in both batches, so that each cell compares the same setup. Over the 530 cells that both batches measured, the candidate's time fell by 11% on geometric mean (previous/current time 1.12: 1.07 at 100 rows, 1.17 at 1,000 and 1.26 at 10,000). Immer and Mutative 1.3.0, whose artifacts did not change, measured 1.02 times faster than in the previous session, which bounds the drift between the two sessions. In 122 cells every process of this batch was faster than every process of the previous one, among them:

- Returned values with auto-freeze: `return-replace` took 0.57 µs at every size, against 30.0 µs, 291 µs and 2.9 ms. Production builds with auto-freeze skip a frozen returned value instead of searching it (PR #183).
- Patch generation: with patches and without freezing, `deep-update` took 3.98 µs instead of 7.77 µs, `object-update-10pct` 10.5 µs instead of 16.8 µs, `update` 1.72 µs instead of 2.17 µs, and `mutation-density-100pct` 81.8 µs instead of 110 µs at 100 rows and 9.29 ms instead of 11.6 ms at 10,000. A changed draft's patch path is checked once per level against its parent's copy instead of being resolved again from the root of the state (PR #184).
- Map reads: `map-read` took 31.6 µs instead of 39.4 µs at 100 rows and 3.56 ms instead of 4.33 ms at 10,000. Map drafts iterate without calling `get()` through the proxy (PR #184).
- Arrays with auto-freeze: most array operations on 100 rows with freeze on took about 10% less. Frozen arrays are copied with a spread (PR #183).
- Patch application: `apply-array-ops` took 4.36 µs instead of 6.87 µs. `apply()` copies object patch values with a spread (PR #184).
- `search-current-shifted` at 10,000 rows took 331 µs, against 772 µs when PR #180 was measured. The moved row's original index is found by searching the original array (PR #183).

In 10 cells every process was slower than every process of the previous batch: `add` and `reverse-array` with freeze and patches on at 100 rows (21.9 µs against 18.1 µs, and 27.6 µs against 24.4 µs), and at 1,000 rows `map-update` in all four modes, `set-add` in three and `map-read` in one, by 3–8%. They did not reproduce with Mutative alone in each process. Same-session runs of benchmark bundles built from `d3cb6e6`, whose production artifact is byte-identical to that of `e6b6563`, and from `2607b22`, `dd5118e`, `ba8d0cd`, `29ad35b` and `2ab58fc`, with Mutative alone in each process and rotating order, measured the previous and current sources within 2% of each other in the Map and Set cells at 1,000 rows, for example `map-update` 39.6 µs against 39.8 µs and `set-add` 66.7 µs against 66.5 µs, medians of three rounds; and `add` with freeze and patches on at 19.4 µs against 19.3 µs over five more rounds. In processes of their own, the candidate's Map and Set updates at 1,000 rows were as fast as those of Mutative 1.3.0 or up to 3.4% faster. These cells depend on the code that runs beside them in a process.

## Tradeoffs and limits

- Returned values: without auto-freeze, the candidate searches every object of a returned value for drafts, as Immer does: `return-replace` took 2.59 ms at 10,000 rows, against 5.63 ms for Immer without auto-freeze. Immer's default auto-freeze skips frozen values (0.79 µs), and so do production builds of the candidate with auto-freeze (0.53 µs). Wrapping the value in `rawReturn()` skips the search (0.26 µs).
- A Set draft copies the Set on its first change and rebuilds it in order once an item that the recipe read through an iterator changed: `set-update` took 544 µs at 10,000 items, against 411 µs for the hand-written reducer, which copies the Set once. With patches, a Set that added or deleted items compares every original item with its copy and every item of the copy with the original: `set-add` took 448 µs with patches at 10,000 items, against 34.1 µs without. Copying the Map dominates `map-update` at 10,000 entries in every library, about 520 µs.
- With auto-freeze, updating a row that `shift()` moved costs more than the move: `shift-and-update` took 301 µs at 10,000 rows, against 189 µs for `array-shift-nested`, which only removes the row, while without auto-freeze they took 15.9 µs and 7.10 µs. The candidate finds the moved row's original index with `lastIndexOf` on the original array, which is frozen then, and V8 runs `lastIndexOf` on a frozen array about 15 times as slowly: 116 µs against 7.9 µs to find an element in the middle of 10,000, while `indexOf` takes 1.1 µs on both.
- With auto-freeze, Immer updated a class instance with 1,000 fields faster: 239 µs against 411 µs. Without freezing the candidate is faster, 98 µs against 206 µs, so the difference lies in freezing the candidate's copy, which it makes property by property with descriptors where Immer 11 uses `Object.assign`.
- Even in processes of their own, some cells varied between processes of the same build by up to about 1.5 times, for example `remove-reuse` with freeze on (127–191 µs) and Immer's `map-read` at 10,000 rows; `class-wide-update` without freezing at 1,000 rows took either about 95 µs or about 200 µs in both Mutative builds. Medians of three processes absorb one outlier, not two; compare such cells through geometric means rather than one by one.
- Isolated processes measure each library without the other libraries and scenarios, not inside a real application, whose own code also changes V8's state; wide-object timings in particular depend on it, by up to about 70 times.
- Freeze-on inputs are already frozen, so freezing cold external data is excluded. Allocation is sampled, and small retained deltas are noisy. All measurements come from one machine and Node.js; browser engines may differ.
- Bundle size: as the README measures it with esbuild 0.24.0, importing only `create` bundles to 7.7 kB with Brotli against 3.6 kB for Immer's `produce`, and with patches, Map and Set support and array methods to 8.2 kB against 6.4 kB for Immer with its plugins. `size-limit` measures the production CJS artifact at 8.3 kB against its 8.4 kB cap (8,114 Brotli bytes), and the ESM consumers of `create` and of all exports at 7.27 kB and 8.16 kB against 7.4 kB and 8.3 kB.

## Native array method contract

The fast paths are made for data arrays. On them, values, own-property presence and patch replay match plain JS on a copy, and drafts, strict mode and unchanged calls behave as on the proxy path:

- `shift`, `unshift`, `splice` and `reverse` run natively on the draft's copy of a plain array without holes. Elements that are `undefined` are ordinary values and move natively. A hole reads as `undefined`, so an array in which the `includes` builtin finds no `undefined` has none; only arrays that hold `undefined` are checked index by index with the `in` operator, the HasProperty check of the native algorithms. The result is cached per draft until a length change or an assignment past the end.
- `indexOf`, `lastIndexOf` and `includes` run natively on the current array and give the proxy path's results, comparing elements as a read returns them. Drafts, values assigned in the recipe, non-draftable objects and primitives are found. An object of the base state is drafted on read and never found, whether or not it was read before, unless the recipe assigned or inserted it and it is not at its original index; search `original(draft)` to compare original objects. A native hit on such an object is skipped and the search continues past it. A hit on an inherited element, or on a base element of an array with holes, is decided by the proxy path. The search never reads a property of the value it is given.
- In strict mode, outside `unsafe()`, optimized calls on an array that may hold objects take the proxy path unchanged, so reading a non-draftable element fails exactly where it always did. Arrays of primitives, recognized with `typeof`, keep the native paths.
- Elements are moved and compared without being inspected. The proxy path inspects each element it reads, so an element that is itself a Proxy may see fewer calls to its internal methods on the native paths, never more and never at other times; for example, a revoked Proxy element that a native search passes over does not throw.
- `sort` and `join` run natively on arrays of primitives.
- Removed elements are returned as drafts, patches replay in both directions, and a call that changes nothing keeps the state. Calls that cannot change the array (`unshift()` without arguments, `reverse()` of one element, an empty `splice`) are settled before any element is read or copied, and a `splice` that replaces elements with equal values reads only the replaced range.
- A method recognizes its receiver by identity: the array whose method was read last, or an array of a live producer registered when another array's method was read after it. A borrowed method called on any other object runs the native method on it without reading a property first. The reference to the last array is released when its producer ends, by any path, and drafts of `create` without a recipe are only registered weakly.
- Sparse arrays, array subclasses, an own `constructor` or `Symbol.isConcatSpreadable`, arrays under a custom `mark`, every method with a callback, `at`, `slice`, `fill` and `copyWithin` use the proxy path. An argument that can run user code is converted on the proxy path, so a conversion that changes the array is observed as the native methods do.
- Index accessors are outside the contract: their values are read as data, and the number and order of getter calls, their re-entrant effects on the draft, and the identity of objects they return are not guaranteed to match element-by-element execution through the proxy. Plain JS on a copy is the reference for every supported input; the proxy path itself is not, because it turns `delete` into an `undefined` assignment.

## Source and artifact identity

The measured source is that of [`2ab58fc`](https://github.com/unadlib/mutative/commit/2ab58fce1210b2b4724fcecce10ff0e1a864ddce), with the harness of the same commit. Every dataset reports the same source and production hashes.

SHA-256 identities (`source` uses the sorted path/content algorithm in [`build.mjs`](../build.mjs); `production` is `dist/mutative.cjs.production.min.js`):

```text
Candidate source:     4f4ce89ca64753973262e952f3ade4bde8632d20941bee0b23f7cf6452a7cc94
Candidate production: f210318adca2f60d6d0c5bd807dcb76ff34d345120e779092facc264f453666d
Pinned v1 production: 15ad9df11178c64f80e66797ffe784a4eeedfb03759ca59ef61a64f4142fde41
Immer production:     30fec64eb16c235f5fe771ed7e4be08eb0f67cb46c44917424a6e643f3d677b9
```

The Set scenarios of 2026-10-09 measured the production artifact of PR #195, which its head builds unchanged, and compared it with `main` at `e6af4b0`:

```text
PR #195 production:   74adeacf19aaa8df15d94751824c3d8f12dd821f854eb8a9f137ee9daff41d05
main production:      b70312b6faedc295e645a4d81050ebb982878414fe7d4c15e7e5f55b7c27e7c5
```

The patch application scenarios of 2026-10-09 measured the production artifact of PR #196, which its head builds unchanged, and compared it with `main` at `4ca6345`:

```text
PR #196 production:   bd8ff3a63a6007bb800f8782985e6156c57aac1bbd0c8f7251708e863c2c19c9
main production:      74adeacf19aaa8df15d94751824c3d8f12dd821f854eb8a9f137ee9daff41d05
```

The four scenarios of PR #198 measured the source of `main` at `d96aa98` with the harness of that PR. Its production artifact is that of PR #196, since PR #197 changed only documentation:

```text
Candidate source:     763c08619d0a1892c3dfd9e4cbbc165763fcd71eb263481d2ca793deae09c5ff
Candidate production: bd8ff3a63a6007bb800f8782985e6156c57aac1bbd0c8f7251708e863c2c19c9
```

The comparison of each scenario with the commit before the improvement it covers built `538b7ae` and `715a41f` for `set-read`, `bad9902` and `13460fb` for `shift-and-update`, `00d4829` and `2168780` for `map-set-beside`, and `0bf2740` and `ce20399` for `map-forEach`.

## Reproduce

Use Node 24.16.0 and the frozen lockfile. Run the following sequentially from the repository root; timings will vary. The [benchmark guide](../README.md) explains workload semantics and options.

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm benchmark:immer:build
node perf-testing/ci.mjs --self-control

SCALE='^(read-index|read-forEach|read-missing|mutation-density-100pct|array-shift-nested|array-unshift-nested|array-splice-insert-nested|array-reverse-nested|array-reverse-primitive|shift-and-update|map-update|map-read|map-forEach|map-set-beside|set-add|set-read|set-update|object-update|object-delete|class-update|class-wide-update|apply-update-10pct|apply-reverse|return-replace|return-replace-raw|return-filter|search-draft|search-current|search-current-shifted|push-and-insert)$'
MEMORY='^(small-object-update|noop-empty|read-index|mutation-density-100pct|array-reverse-primitive|array-reverse-nested|map-update|set-add|object-update|class-update|apply-update-10pct|return-filter|push-and-insert)$'
MEMORY_SCALE='^(read-index|mutation-density-100pct|array-reverse-primitive|array-reverse-nested|map-update|set-add|object-update|push-and-insert)$'
PLUGIN='^(array-|shift-and-update|sortById-reverse|reverse-array|add$|remove$|remove-high$|update-multiple|concat|filter|mapNested|remove-reuse|remove-high-reuse|apply-array-ops|apply-reverse|return-filter|search-|push-and-insert$)'
PLUGIN_SCALE='^(read-index|read-forEach|read-missing|mutation-density-100pct|array-shift-nested|array-unshift-nested|array-splice-insert-nested|array-reverse-nested|array-reverse-primitive|shift-and-update|apply-reverse|return-filter|search-draft|search-current|search-current-shifted|push-and-insert)$'

node perf-testing/run-benchmarks.mjs --isolate --runs 3 --patches both --output perf-testing/results/isolated-default.json
node perf-testing/run-benchmarks.mjs --isolate --runs 3 --patches both --library both --immer-array-methods --filter "$PLUGIN" --output perf-testing/results/isolated-plugin-default.json
node perf-testing/run-memory.mjs --runs 3 --patches both --memory-iterations 32 --filter "$MEMORY" --output perf-testing/results/memory-default.json
for rows in 1000 10000; do
  iterations=16
  if [ "$rows" = 10000 ]; then iterations=8; fi
  node perf-testing/run-benchmarks.mjs --isolate --runs 3 --patches both --array-size "$rows" --filter "$SCALE" --output "perf-testing/results/isolated-$rows.json"
  node perf-testing/run-benchmarks.mjs --isolate --runs 3 --patches both --library both --immer-array-methods --array-size "$rows" --filter "$PLUGIN_SCALE" --output "perf-testing/results/isolated-plugin-$rows.json"
  node perf-testing/run-memory.mjs --runs 3 --patches both --array-size "$rows" --memory-iterations "$iterations" --filter "$MEMORY_SCALE" --output "perf-testing/results/memory-$rows.json"
done
```

The shared-process control, the process-order control, and the Immer plugin datasets in shared processes:

```sh
node perf-testing/run-benchmarks.mjs --runs 3 --patches both --output perf-testing/results/default.json
node perf-testing/run-benchmarks.mjs --runs 6 --freeze off --filter '^update-largeObject1$' --output perf-testing/results/object-order.json
node perf-testing/run-benchmarks.mjs --runs 3 --patches both --library both --immer-array-methods --filter "$PLUGIN" --output perf-testing/results/plugin-default.json
for rows in 1000 10000; do
  node perf-testing/run-benchmarks.mjs --runs 3 --patches both --array-size "$rows" --filter "$SCALE" --output "perf-testing/results/scale-$rows.json"
  node perf-testing/run-benchmarks.mjs --runs 3 --patches both --library both --immer-array-methods --array-size "$rows" --filter "$PLUGIN_SCALE" --output "perf-testing/results/plugin-$rows.json"
done
```

The comparison of sources in [changes since the previous batch](#changes-since-the-previous-batch) builds each source in a checkout of its own, as the PR #184 matrix in the history did, and runs the resulting bundles with Mutative alone, rotating their order:

```sh
# For each source, from a built checkout of it at $CHECKOUT:
MUTATIVE_PERF_CANDIDATE_DIR="$CHECKOUT" MUTATIVE_PERF_BUILD_DIR="perf-testing/dist/$NAME" node perf-testing/build.mjs
MUTATIVE_PERF_BUNDLE="perf-testing/dist/$NAME/immutability-benchmarks.mjs" node perf-testing/run-benchmarks.mjs --library mutative --runs 1 --array-size 1000 --freeze both --patches both --filter '^(map-update|set-add|set-update)$'
MUTATIVE_PERF_BUNDLE="perf-testing/dist/$NAME/immutability-benchmarks.mjs" node perf-testing/run-benchmarks.mjs --library mutative --runs 1 --freeze on --patches both --filter '^(add|reverse-array)$'
```

The comparison of each scenario of PR #198 with the commit before the improvement it covers builds both commits the same way, with the harness of PR #198, and runs that scenario alone in three rounds of alternating order:

```sh
MUTATIVE_PERF_BUNDLE="perf-testing/dist/$NAME/immutability-benchmarks.mjs" node perf-testing/run-benchmarks.mjs --library mutative --runs 1 --array-size 1000 --freeze both --patches both --filter '^set-read$'
```

## History

Earlier versions of this summary, in Git history, describe each round in detail. Cell counts compare the candidate with the named comparator: faster, within 5%, and slower.

- 2026-10-09, PR #198: the scenarios `set-read`, `map-forEach`, `shift-and-update` and `map-set-beside` cover improvements of PRs #183 and #184 that only micro-benchmarks had measured, and CI budgets them. Measured with every library in processes of its own at 100, 1,000 and 10,000 rows, their cells join the results: 595 / 16 / 3 of 614 against Immer (geometric mean 3.59), 153 / 1 / 3 of 157 with each library's defaults (6.66), 543 / 70 / 1 against 1.3.0 (4.28), and 18 / 3 / 129 against the hand-written reducer. Built from the commit before the improvement it covers, each scenario took at least 2.3 times as long in one or more modes, and `set-read` 62–65 times as long in every mode.
- 2026-10-09, PR #196: `apply()` reads the type of each draft on a patch path from its state instead of asking its proxy twice per step. Against `main` at `4ca6345`, Mutative alone, the PR took 0.68 of the time over 14 patch application cells, and `apply-update-10pct` 0.49–0.61 of it. The patch application scenarios, measured again with every library in processes of its own, replace the earlier cells: 551 / 12 / 3 of 566 against Immer (geometric mean 3.66), 142 / 0 / 3 of 145 with each library's defaults (6.76), and 495 / 70 / 1 against 1.3.0 (3.88). The production CJS artifact grew from 8,334 to 8,367 Brotli bytes.
- 2026-10-09, PR #195: Set drafts add and delete items in their copy, map only the items that drafts stand for and are rebuilt once, by their own producer, drafts of Set subclasses keep their items in order, and a Set draft that left its key keeps its changes, which 1.3.0 also lost. Against `main` at `e6af4b0`, Mutative alone, the PR took 0.28 of the time over 32 Set cells; `set-add` at 10,000 items took 33.2 µs instead of 987 µs. The Set scenarios, measured again with every library in processes of its own, replace the earlier cells: 548 / 12 / 6 of 566 against Immer (geometric mean 3.62), 142 / 0 / 3 of 145 with each library's defaults (6.62), 495 / 70 / 1 against 1.3.0 (3.84), and 18 / 2 / 118 against the hand-written reducer. The production CJS artifact grew from 8,201 to 8,334 Brotli bytes.
- 2026-10-05, PR #184 review fixes: the fixed source at `6b08f57` against `main` at `ba8d0cd`, Mutative only, all 93 scenarios at 100 rows in both freeze and patch modes, three runs each: fixed/main geometric mean 0.982 over 366 cells, 42 cells more than 5% faster and 6 more than 5% slower; the slower wide-object cells measured 0.77–1.02 in isolated processes. Map iteration with the iterator lifetime checks took 1–2.4% longer than without them and about 70% less than `main` for primitive entries. An update beside an unchanged frozen 10,000-entry Map or Set took 0.44 µs instead of 66.7 µs and 26.1 µs. The production CJS artifact grew from 8,079 to 8,106 Brotli bytes.
- 2026-10-04, PR #180 at `e70aeed`: `current()` copies changed array drafts from their current array and leaves moved base elements as they are, and strict mode warns once in development builds when a recipe leaves 1,000 or more drafts unchanged. The three `search-*` scenarios were added: a `current()` snapshot search at 10,000 rows took 209 µs instead of 3,262 µs, and 772 µs instead of 7,490 µs after `shift()`. Gate 48 of 48. The production CJS artifact grew from 8,031 to 8,104 Brotli bytes against `main`.
- 2026-10-03 and 2026-10-04, the source of `main` at `e6b6563` with the harness of PR #177, 90 scenarios at 100 rows and 23 at 1,000 and 10,000, in shared processes except for the wide-object scenarios: 508 / 11 / 11 of 530 cells against Immer (geometric mean 3.07), 133 / 0 / 3 of 136 with each library's defaults (6.01), 417 / 111 / 2 against pinned 1.3.0 (3.16), and 18 / 2 / 109 of 129 against the hand-written reducer (0.17). Immer was faster in `return-replace` with freeze on (2.9 ms against 0.9 µs at 10,000 rows), `apply-update-10pct` and `class-wide-update` with freeze on at 1,000 rows. With Immer's `enableArrayMethods`, 229 / 5 / 46 of 280 cells (1.63). Allocation below 1.3.0 in 104 of 114 memory cells; gate 48 of 48.
- 2026-10-03, PR #75 at `363b3da`, 67 scenarios: 339 / 1 / 0 of 340 cells against Immer with the plugin off (geometric mean 3.77; 6.21 over the array cells, 1.58 elsewhere), 335 / 4 / 1 against pinned 1.3.0 (5.48), 140 / 191 / 9 against the PR #174 archive (2.24). With Immer's `enableArrayMethods`, 211 / 1 / 36 cells (1.68). Allocation below 1.3.0 in 55 of 56 memory cells; gate 48 of 48. Three review rounds followed before the merge: search results that match the proxy path (`f85df41`), strict-mode calls on the proxy path and no element inspection the proxy path does not make (`06d9d6e`–`6e74707`), and release of the receiver cache when a producer ends (`8fe0d9a`). Harness A/B comparisons put each round within 2% of the previous source, except a search that meets an unread base object, which now checks the array for holes (about 9 µs at 10,000 rows). Between `363b3da` and the merge, the size baseline of the production CJS artifact grew from 7,799 to 8,041 Brotli bytes, and its `size-limit` cap rose from 6.5 kB to 6.7 kB.
- 2026-10-02, PR #75 at `6193657`: 340 / 0 / 0 cells against Immer (3.78), 335 / 5 / 0 against pinned 1.3.0 (5.50). That source excluded arrays holding `undefined` from the native path and matched a draft's original object in searches; the contract above replaced both.
- 2026-10-02 and 2026-10-03, local commits `c598b41`–`a1e3235` and `689c181`–`1ba1615` (never pushed or superseded): eligibility checks through property descriptors made 10,000-row moves slower than Immer with its plugin, and a per-element `in` scan and a WeakSet entry per array added 0.2–0.9 µs to 100-row operations. `473c149` and `6ce062b` removed both costs.
- 2026-10-01, PR #174 (draft fast paths) and 2026-09-30 baseline: see the [archive index](./README.md).
