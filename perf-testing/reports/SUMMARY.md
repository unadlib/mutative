# Performance summary

Measurements from 2026-10-12 UTC of the source of `main` after PR #204, which [source and artifact identity](#source-and-artifact-identity) identifies. Since the previous batch, which measured `main` after PR #198, `main` has changed how array drafts look up moved elements in [PR #200](https://github.com/unadlib/mutative/pull/200) and [PR #202](https://github.com/unadlib/mutative/pull/202) and hardened `apply()` and the development checks in [PR #201](https://github.com/unadlib/mutative/pull/201); PRs #199, #203 and #204 changed only documentation and types. The candidate and the pinned npm baseline both report Mutative 1.3.0. Immer is pinned to 11.1.18 and Mitata to 1.0.34. The main comparison runs Immer without its array-method plugin; a separate dataset below enables `enableArrayMethods`. The raw datasets of this batch were not archived; the identities and commands below reproduce them, and the [archive index](./README.md) describes the retention policy for batches that are.

This batch remeasures every scenario with the method of the previous one: every timing below comes from processes that each run one scenario with one library, and the shared-process matrices are kept as a control, which [shared and isolated processes](#shared-and-isolated-processes) compares. It replaces the batch of 2026-10-09 and 2026-10-10 together with the `shift-and-update` cells that PR #200 measured again, which the [history](#history) summarizes; [changes since the previous batch](#changes-since-the-previous-batch) compares them with this batch.

## Scope and method

Apple M1 Max, 64 GiB RAM, darwin/arm64 (kernel 25.6.0), Node 24.16.0, V8 13.6.233.17-node.49. Jobs ran sequentially with normal desktop activity.

- **Workloads.** 97 scenarios at 100 rows, of which 30 also ran at 1,000 and 10,000 rows. The [benchmark guide](../README.md#workloads-and-units) describes each one.
- **Libraries.** The current source, pinned npm Mutative 1.3.0, Immer 11.1.18, and the hand-written reducer that is every scenario's reference result. Each library runs both freeze modes and both patch modes, except that the hand-written reducer runs only without either, and patch application only without patch generation.
- **Timing.** Every scenario ran with every library in processes of its own (`--isolate`), three runs each, covering both freeze and patch modes in each process. Each benchmark first runs its workload for 30 ms on a throwaway fixture. These datasets hold 5,976 trials from 1,863 processes. As a control, the shared-process matrices of earlier batches were measured too, with Map and Set scenarios in processes of their own: 5,976 trials from 18 processes.
- **Isolation.** Code that ran earlier in a process changes how fast V8 runs a library. Copying objects with hundreds of properties took up to about 70 times as long after other code, and every library ran slower beside the others than alone. Isolated processes remove the influence of the other libraries and scenarios, not that of a real application's code.
- **Memory.** 1,110 isolated workers for 13 scenarios at 100 rows and 8 at 1,000 and 10,000 rows.

Each timing cell is one scenario, size, and mode. A candidate time below 95% of the comparator's counts as faster, above 105% as slower, and otherwise as within 5%. Geometric means are comparator time over candidate time, so values above 1 favor the candidate. Scenario counts are not an application-weighted score.

## Results

### Against Immer and Mutative 1.3.0

Cells faster / within 5% / slower, and the geometric mean of comparator time over candidate time. The Immer defaults row compares the candidate without auto-freeze with Immer with it, both without patches.

| Comparator | 100 rows | 1,000 and 10,000 rows | All |
| --- | ---: | ---: | ---: |
| Immer 11.1.18 | 373 / 6 / 3 of 382, 3.04 | 222 / 7 / 3 of 232, 4.70 | 595 / 13 / 6 of 614, 3.58 |
| Immer 11.1.18 with its defaults | 96 / 0 / 1 of 97, 6.20 | 58 / 0 / 2 of 60, 7.40 | 154 / 0 / 3 of 157, 6.63 |
| Pinned npm Mutative 1.3.0 | 341 / 34 / 7 of 382, 3.45 | 194 / 36 / 2 of 232, 6.07 | 535 / 70 / 9 of 614, 4.27 |
| Hand-written reducer | 7 / 0 / 87 of 94, 0.11 | 11 / 3 / 42 of 56, 0.13 | 18 / 3 / 129 of 150, 0.12 |

Against Immer by workload group, faster / within 5% / slower and geometric mean:

| Group | 100 rows | 1,000 rows | 10,000 rows |
| --- | ---: | ---: | ---: |
| Upstream workloads | 82 / 0 / 2, 2.00 | — | — |
| Reads | 20 / 0 / 0, 1.59 | 12 / 0 / 0, 1.60 | 12 / 0 / 0, 2.00 |
| No-op producers | 6 / 2 / 0, 1.67 | — | — |
| Small state | 12 / 0 / 0, 1.65 | — | — |
| Mutation density | 12 / 0 / 0, 2.08 | 4 / 0 / 0, 1.90 | 4 / 0 / 0, 2.16 |
| Array methods | 132 / 0 / 0, 5.71 | 20 / 0 / 0, 23.71 | 20 / 0 / 0, 30.09 |
| Moved elements | 4 / 0 / 0, 14.22 | 4 / 0 / 0, 26.78 | 4 / 0 / 0, 40.03 |
| Map and Set | 46 / 2 / 0, 2.27 | 25 / 3 / 0, 2.53 | 25 / 3 / 0, 2.38 |
| Object records | 11 / 1 / 0, 1.26 | 8 / 0 / 0, 2.38 | 8 / 0 / 0, 1.60 |
| Class instances | 6 / 1 / 1, 1.72 | 6 / 0 / 2, 1.63 | 6 / 1 / 1, 1.64 |
| Deep path | 4 / 0 / 0, 1.52 | — | — |
| Push and insert | 8 / 0 / 0, 1.95 | 4 / 0 / 0, 2.61 | 4 / 0 / 0, 3.39 |
| Patch application | 6 / 0 / 0, 4.16 | 4 / 0 / 0, 1.65 | 4 / 0 / 0, 1.58 |
| Returned values | 12 / 0 / 0, 3.83 | 12 / 0 / 0, 5.58 | 12 / 0 / 0, 8.79 |
| Searches | 12 / 0 / 0, 5.07 | 12 / 0 / 0, 8.27 | 12 / 0 / 0, 9.39 |

The 6 cells slower than Immer all have freeze on. Four are `class-wide-update`: at 1,000 rows by 1.7 times (402 µs and 414 µs against 237 µs and 238 µs), see the limits below, and without patches at 100 and 10,000 rows by 5% (24.5 µs against 23.2 µs, and 3,653 µs against 3,478 µs). The other two are `add` and `concat` at 100 rows (21.0 µs against 20.0 µs, and 21.1 µs against 18.8 µs), cells in which the three processes of both libraries overlapped: the candidate measured 18.7–21.3 µs and 19.2–22.6 µs, Immer 18.8–25.2 µs and 18.5–25.4 µs. With each library's defaults, the candidate is slower only in `return-replace`, at every size: without auto-freeze it searches the returned state for drafts, which Immer's auto-freeze skips because the state is frozen (26.2 µs, 257 µs and 2.60 ms against 0.78–0.79 µs). The 9 cells slower than Mutative 1.3.0, by 8–18%, also all have freeze on: `add`, `concat`, `update-largeObject1` and `push-and-insert` at 100 rows and `object-delete` at 1,000 rows. In these cells the processes of each library varied by up to 1.4 times, and those of the two libraries overlapped except in `concat` with patches (20.5–21.1 µs against 17.1–20.2 µs); built from the source of the previous batch and from this one, the candidate took the same time in them within the spread of its processes, as [changes since the previous batch](#changes-since-the-previous-batch) shows.

### Replacement returns with `rawReturn()` and default freeze settings

For a replacement value that contains no drafts, Mutative's `rawReturn()` skips the search through that value. The following comparison uses each library's default freeze setting: candidate `return-replace-raw` with auto-freeze off, and Immer `return-replace` with auto-freeze on. Both have patches off, and Immer's array-method plugin is off. Both recipes return a new root with replaced rows; only the Mutative recipe wraps it in `rawReturn()`.

Microseconds per call, using the same batch's medians of three independent-process means. The source cells are in `isolated-rest-default.json`, `isolated-1000.json`, and `isolated-10000.json`. Ratios and time reductions are calculated from the unrounded values.

| Rows | Mutative `rawReturn()`, freeze off | Immer ordinary return, freeze on | Immer/Mutative | Mutative time reduction |
| ---: | ---: | ---: | ---: | ---: |
| 100 | 0.257 | 0.776 | 3.02 | 66.9% |
| 1,000 | 0.258 | 0.784 | 3.03 | 67.0% |
| 10,000 | 0.262 | 0.786 | 3.00 | 66.7% |

The candidate's time stays approximately constant as the payload grows because it skips the draft search. Ordinary `return-replace` with auto-freeze off takes 26.2 µs, 257 µs, and 2.60 ms at these sizes. `rawReturn()` requires the entire returned value to contain no drafts; it cannot replace ordinary returns that include draft references. Immer's inputs and payloads are pre-frozen, so its times exclude the first freeze of external data. The candidate's inputs and payloads are unfrozen.

This comparison reuses existing cells and keeps the ordinary-return results and aggregate counts above unchanged. The [focused reproduction commands](../README.md#replacement-returns-with-default-freeze-settings) measure both return scenarios and freeze modes at all three sizes.

### Large arrays

Against Immer without its array-method plugin, by size and mode, over the 30 scaling scenarios: cells faster / within 5% / slower, and geometric means of Immer time over candidate time. The moves are `array-shift-nested`, `array-unshift-nested`, `array-splice-insert-nested`, `array-reverse-nested` and `array-reverse-primitive`.

| Rows | Freeze | Patches | All scenarios | Geometric mean | Moves, geometric mean | Moves, range |
| ---: | --- | --- | ---: | ---: | ---: | ---: |
| 1,000 | off | off | 29 / 1 / 0 | 8.67 | 209 | 72.0–488 |
| 1,000 | off | on | 27 / 1 / 0 | 4.13 | 7.1 | 6.1–7.5 |
| 1,000 | on | off | 28 / 1 / 1 | 3.92 | 32.4 | 18.5–47.5 |
| 1,000 | on | on | 27 / 0 / 1 | 2.70 | 6.6 | 6.1–6.8 |
| 10,000 | off | off | 29 / 1 / 0 | 10.79 | 430 | 177–1,052 |
| 10,000 | off | on | 27 / 1 / 0 | 4.53 | 7.3 | 5.2–8.8 |
| 10,000 | on | off | 28 / 1 / 1 | 4.23 | 38.7 | 22.2–53.5 |
| 10,000 | on | on | 27 / 1 / 0 | 2.82 | 6.8 | 5.2–8.3 |

Immer time over candidate time for the moves at 10,000 rows, by freeze and patch mode:

| Scenario | Off, off | Off, on | On, off | On, on |
| --- | ---: | ---: | ---: | ---: |
| array-shift-nested | 1,052 | 8.4 | 43.1 | 7.7 |
| array-unshift-nested | 472 | 8.4 | 41.1 | 7.8 |
| array-splice-insert-nested | 177 | 6.3 | 22.2 | 5.5 |
| array-reverse-nested | 550 | 8.8 | 41.1 | 8.3 |
| array-reverse-primitive | 306 | 5.2 | 53.5 | 5.2 |

The gap widens with size. With freeze and patches off, the moves were 209 times faster at 1,000 rows and 430 times at 10,000 on geometric mean: the candidate moves elements natively on its copy, while Immer moves each element through its draft proxy. Removing the first of 10,000 rows took 7.04 µs against 7,408 µs. With patches, both libraries emit one patch per moved index, which bounds the gain to 5–9 times. At these sizes Immer was faster only in `class-wide-update` with freeze on, at 1,000 rows and without patches at 10,000 rows, which the limits below discuss, and within 5% in Map updates without freezing, the remaining freeze-on cell of `class-wide-update` at 10,000 rows, and two cells of `set-read`, where both libraries only read the Set.

### Freeze off, patches on

With patches on and freeze off, the candidate was faster than Immer in 148 of 150 cells and within 5% in the other 2, the Map updates at 1,000 and 10,000 rows (geometric mean 3.28). It was faster than Mutative 1.3.0 in 131 and within 5% in 19 (4.56). In the 70 array-related cells, array methods, the update of a moved row, searches and the upstream array workloads at every size, it was faster than both in every cell: 4.40 times Immer and 13.09 times Mutative 1.3.0 on geometric mean.

Patches cost little when an update changes a few paths. They added a median 1% to the candidate's time at 1,000 and 10,000 rows and 20% at 100 rows. The former `benchmark:base` workload, `push-and-insert` at 10,000 rows, took 63.8 µs without patches and 63.2 µs with them; Mutative 1.3.0 went from 65.8 µs to 210 µs, and Immer from 161 µs to 360 µs. Moving elements is the exception: both libraries emit one patch per moved index, so `shift` at 10,000 rows produces 10,000 forward and 10,000 inverse patches in each. The candidate's time grows from 7.04 µs to 1,063 µs, against 8,943 µs for Immer producing the same patches.

Array methods on nested rows at 100 rows, in µs per call. The primitive and shallow shapes behave alike; over all 33 cells the candidate is 4.02 times faster than Immer (1.2–7.4) and 8.43 times faster than Mutative 1.3.0 (1.4–207).

| Operation | Candidate | Immer | Mutative 1.3.0 | Immer/candidate | 1.3.0/candidate |
| --- | ---: | ---: | ---: | ---: | ---: |
| push | 3.79 | 6.87 | 5.44 | 1.81 | 1.44 |
| pop | 1.50 | 6.03 | 3.57 | 4.02 | 2.38 |
| shift | 11.4 | 81.1 | 2,319 | 7.14 | 204.11 |
| unshift | 14.0 | 86.1 | 2,285 | 6.14 | 162.90 |
| splice, insert | 8.83 | 48.0 | 1,191 | 5.44 | 134.94 |
| splice, remove | 6.21 | 44.1 | 1,199 | 7.10 | 193.10 |
| splice, replace | 3.36 | 9.38 | 6.18 | 2.79 | 1.84 |
| fill | 4.22 | 8.06 | 6.84 | 1.91 | 1.62 |
| copyWithin | 2.43 | 5.58 | 76.5 | 2.29 | 31.42 |
| sort | 105 | 129 | 2,466 | 1.23 | 23.58 |
| reverse | 11.3 | 81.8 | 2,330 | 7.26 | 206.94 |

The array workloads of the upstream suite at 100 rows:

| Scenario | Candidate | Immer | Mutative 1.3.0 | Immer/candidate | 1.3.0/candidate |
| --- | ---: | ---: | ---: | ---: | ---: |
| add | 1.79 | 4.19 | 3.55 | 2.34 | 1.99 |
| remove | 11.5 | 83.6 | 2,982 | 7.30 | 260.22 |
| filter | 22.7 | 31.3 | 35.5 | 1.38 | 1.57 |
| concat | 0.78 | 0.99 | 1.04 | 1.26 | 1.32 |
| mapNested | 40.5 | 59.9 | 77.8 | 1.48 | 1.92 |
| sortById-reverse | 65.9 | 83.0 | 2,977 | 1.26 | 45.17 |
| reverse-array | 11.3 | 81.9 | 2,894 | 7.25 | 256.10 |
| update-multiple | 7.37 | 16.4 | 16.3 | 2.23 | 2.21 |
| remove-high | 20.0 | 48.8 | 601 | 2.44 | 30.00 |
| remove-reuse | 132 | 790 | 25,920 | 5.96 | 195.62 |
| mixed-sequence | 50.8 | 91.3 | 139 | 1.80 | 2.73 |

Moving elements at 1,000 and 10,000 rows, with Immer's array-method plugin from the plugin datasets for reference:

| Scenario | Rows | Candidate | Immer | Mutative 1.3.0 | Immer + plugin |
| --- | ---: | ---: | ---: | ---: | ---: |
| array-shift-nested | 1,000 | 109 | 795 | 25,134 | 124 |
| array-splice-insert-nested | 1,000 | 57.9 | 436 | 12,068 | 83.0 |
| array-reverse-nested | 1,000 | 109 | 806 | 24,734 | 123 |
| array-shift-nested | 10,000 | 1,063 | 8,943 | 265,439 | 1,373 |
| array-unshift-nested | 10,000 | 1,071 | 8,975 | 257,143 | 1,387 |
| array-splice-insert-nested | 10,000 | 713 | 4,477 | 130,583 | 940 |
| array-reverse-nested | 10,000 | 1,071 | 9,424 | 280,542 | 1,373 |
| array-reverse-primitive | 10,000 | 1,179 | 6,084 | 5,262 | 2,005 |

#### Why Immer's array-method plugin is not the main comparator

Immer's optional `enableArrayMethods()` also runs array methods on the draft's copy, and with patches it comes within 1.13–1.70 times of the candidate on the moves above. The comparisons nevertheless run Immer without it, because in Immer 11.1.18 the plugin breaks guarantees that its other configurations and Mutative keep. [`test/immer-array-methods.md`](../../test/immer-array-methods.md) reproduces four root causes:

- `shift`, `pop` and `splice` return raw base objects. Editing a removed object changes the previous state, or throws when that state is frozen.
- `reverse` and `sort` can expose original objects at inserted indices as raw values, with the same effect; inverse patches then restore the modified values instead of the original ones.
- After an insertion, edits to the shifted tail emit child patches before the array additions, so the forward patches cannot be replayed.
- Reordering a wrapper that holds a moved draft, or a negative `splice` index, leaves revoked drafts in the result and in patch values.

Of 4,913 three-step operation sequences, 123 violate at least one of these contracts with the plugin and none without it. The plugin also hands raw base elements to callbacks and comparators, which is why it beats the candidate in `find`, `findIndex`, `filter` and object `sort` cells: the callback reads the base without drafting it. The benchmark callbacks only read, so these results are correct with the plugin; recipes that edit removed objects or callback arguments are not.

### Searches of changed arrays

The `search-*` scenarios find the last row of an array of nested rows and update it after the producer changed the array: `search-draft` searches the draft after updating the first row, `search-current` searches a `current()` snapshot after the same update, and `search-current-shifted` searches a snapshot after `shift()`. Microseconds per scenario, medians of three runs, patches off:

| Scenario | Rows | Freeze | Mutative | Mutative 1.3.0 | Immer | Hand-written | Immer/Mutative |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| search-draft | 100 | off | 20.6 | 36.8 | 29.6 | 0.14 | 1.44 |
| search-draft | 100 | on | 23.2 | 39.7 | 37.6 | — | 1.62 |
| search-current | 100 | off | 12.5 | 43.8 | 236 | 0.15 | 18.89 |
| search-current | 100 | on | 15.1 | 46.0 | 35.0 | — | 2.32 |
| search-current-shifted | 100 | off | 3.65 | 145 | 96.9 | 0.13 | 26.59 |
| search-current-shifted | 100 | on | 5.75 | 149 | 103 | — | 17.97 |
| search-draft | 1,000 | off | 196 | 339 | 273 | 0.88 | 1.39 |
| search-draft | 1,000 | on | 215 | 361 | 342 | — | 1.59 |
| search-current | 1,000 | off | 24.3 | 333 | 2,308 | 0.87 | 94.98 |
| search-current | 1,000 | on | 42.2 | 356 | 257 | — | 6.09 |
| search-current-shifted | 1,000 | off | 22.7 | 1,405 | 926 | 0.86 | 40.85 |
| search-current-shifted | 1,000 | on | 41.4 | 1,440 | 999 | — | 24.12 |
| search-draft | 10,000 | off | 2,169 | 3,682 | 3,432 | 22.6 | 1.58 |
| search-draft | 10,000 | on | 2,296 | 3,879 | 4,051 | — | 1.76 |
| search-current | 10,000 | off | 176 | 3,436 | 23,152 | 23.1 | 131.85 |
| search-current | 10,000 | on | 354 | 3,613 | 2,449 | — | 6.92 |
| search-current-shifted | 10,000 | off | 257 | 15,717 | 11,255 | 64.8 | 43.73 |
| search-current-shifted | 10,000 | on | 435 | 16,046 | 11,846 | — | 27.24 |

A snapshot search was faster than the draft search at every size: 1.6 times at 100 rows, 8.1 times at 1,000 and 12 times at 10,000 with freeze off. The draft search drafts every row it visits, while `current()` copies the changed array from its current elements. After `shift()`, the search at 10,000 rows took 257 µs, against 772 µs when PR #180 was measured: updating the moved last row now finds its original index by searching the original array instead of building a map of all 10,000 original indices (PR #183). Immer's `current()` walks every unfrozen object, so with freeze off its snapshot searches are slower than its draft search.

### Set drafts

[PR #195](https://github.com/unadlib/mutative/pull/195) changed how a Set draft tracks its items. Its first change or iteration used to build a Map of all items, every change went through that Map, and finalization cleared the copy and added every item back from it, even when no item had to be replaced. A Set draft now adds and deletes items in its copy and maps only the items that drafts stand for, and finalization rebuilds the Set only once one of them changed. Mutative alone in processes of its own, the source of `main` before the PR and that of the PR in alternating order, three runs each, µs per update:

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

Over all 32 cells, four Set scenarios at 100 rows and two at 1,000 and 10,000 rows in every mode, the PR took 0.28 of the time of `main` on geometric mean and was faster in each. Additions and deletions no longer copy the items into a Map and back, so without patches they now cost little more than copying the Set: in this batch, `set-add` at 10,000 items allocated 330 KiB per update, against 2,888 KiB for Mutative 1.3.0. With patches, a Set that added or deleted items still compares all items to emit its own patches, which bounds that gain to about 3 times, and a changed item still rebuilds the Set in order. In this batch the candidate was faster than Immer in every cell of these four Set scenarios, 3.0–50 times, and faster than the hand-written reducer in `set-add` at 1,000 and 10,000 rows, where `Set.prototype.difference` copies the Set faster than the reducer's `new Set()`.

### Patch application

[PR #196](https://github.com/unadlib/mutative/pull/196) changed how `apply()` finds the type of each value on a patch path. It asked every draft on the path for its type twice, once for the step itself and once to read the next value, and `getType` tests `instanceof Map` and `instanceof Set`, which reach the `getPrototypeOf` trap of the draft's proxy; in a profile of `apply-update-10pct` at 1,000 rows, `getType` took 47% of the time. `apply()` now reads the type of a draft from its state, once per step. Other values are typed with `getType` as before, and a mutable application, which changes the objects of the application in place, reads nothing else from them. Mutative alone in processes of its own, the source of `main` before the PR and that of the PR in alternating order, three runs each, µs per patch application:

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

### Moved array elements

[PR #200](https://github.com/unadlib/mutative/pull/200) changed how an array draft finds the original index of an element that a native move took to another index. Since PR #183, the first eight lookups searched the original array from its end with `lastIndexOf`, which V8 runs about 15 times as slowly on frozen, sealed and non-extensible arrays as on other arrays, about 23 ns per element against 1.6 ns; with several reads of moved rows of a frozen array, the eight searches cost more than the map of original indices that they deferred. `shift()`, `unshift()` and `splice()` shift every element they move by the same offset, so a lookup now checks first the index that the offset of the last move gives, then searches forward from it with `indexOf`, which V8 runs on its fast path for every kind of array, for a later copy of a repeated element. After `reverse()`, or when the check fails, it searches from the end as before. Mutative alone in processes of its own, the source of `main` before the PR and that of the PR in alternating order, three runs each, µs per update:

| Scenario | Rows | Freeze | Patches | `main` | PR #200 | PR/`main` |
| --- | ---: | --- | --- | ---: | ---: | ---: |
| shift-and-update | 100 | off | off | 1.56 | 1.48 | 0.95 |
| shift-and-update | 100 | on | off | 4.82 | 3.67 | 0.76 |
| shift-and-update | 1,000 | off | off | 2.92 | 2.24 | 0.77 |
| shift-and-update | 1,000 | on | off | 32.4 | 20.7 | 0.64 |
| shift-and-update | 10,000 | off | off | 15.9 | 8.88 | 0.56 |
| shift-and-update | 10,000 | on | off | 301 | 185 | 0.62 |
| shift-and-update | 10,000 | off | on | 1,385 | 1,375 | 0.99 |
| shift-and-update | 10,000 | on | on | 1,614 | 1,523 | 0.94 |

Over the 12 cells of `shift-and-update`, the PR took 0.82 of the time of `main` on geometric mean; with patches, the patches of the moved rows take most of the time. Over all 250 cells of the scenarios that move array elements the geometric mean was 0.988, and the cells other than `shift-and-update` stayed within the spread of their processes, `search-current-shifted` included, whose moved row lies at the end of the array; ten more rounds of the freeze-on upstream cells measured 0.93–1.03. Recipes that edit several moved rows, measured outside the suite with the two production builds, µs per update:

| Recipe | Rows | Frozen | `main` | PR #200 |
| --- | ---: | --- | ---: | ---: |
| `shift()`, then 8 edits near the start | 1,000 | yes | 212 | 27.9 |
| `shift()`, then 8 edits near the start | 10,000 | yes | 2,050 | 208 |
| `shift()`, then 32 edits across the array | 10,000 | yes | 2,328 | 676 |
| `shift()`, then 8 edits near the start | 10,000 | no | 139 | 30.3 |
| `shift()`, then 32 edits across the array | 10,000 | no | 565 | 471 |
| `unshift()`, then 1 edit in the middle | 10,000 | yes | 311 | 191 |
| `reverse()`, then 1 edit in the middle | 10,000 | yes | 312 | 310 |

The source before PR #183, which built the map for the first lookup, took 632 µs and 659 µs for the 8 and 32 edits of 10,000 frozen rows. A prototype of the same lookup, with an edit after `shift()`, eight edits after `shift()`, an edit after `splice()` and an edit after `reverse()` of 10,000 frozen and unfrozen rows, took 0.11–1.00 of the time of `main` in Chromium 148, 0.63–1.05 in Firefox 150, whose `lastIndexOf` has no such slow path, and 0.97–1.07 in WebKit 26.4, whose frozen arrays are slow to scan in either direction; these are single runs in one page per recipe and build. The production CJS artifact grew from 8,367 to 8,439 Brotli bytes.

Following a repeated element forward copy by copy costs one search per later copy, so the moved rows of an array that holds a few objects many times, as a grid of shared cells does, took far longer than before PR #200: `shift()` and eight reads near the start of 10,000 rows of two objects in turn took 581 µs against 10.3 µs. [PR #202](https://github.com/unadlib/mutative/pull/202) follows 16 later copies one after another, then starts each forward search twice as far ahead as the one before, and searches backward only from the start of the first search that finds no copy, instead of from the end of the array; the rows after the last copy are scanned forward, which V8 runs on its fast path for frozen arrays too. Production CJS builds of `main` before PR #200, of `main` before PR #202 and of PR #202, outside the suite, each in processes of its own, three rounds in rotated order, µs per update of `shift()` and eight reads near the start; a frozen input is a frozen base state, and a frozen result adds auto-freeze:

| Rows | Layout | Frozen | Before PR #200 | `main` | PR #202 |
| ---: | --- | --- | ---: | ---: | ---: |
| 10,000 | no repeated object | no | 138 | 27.9 | 27.9 |
| 10,000 | no repeated object | input and result | 2,049 | 198 | 199 |
| 10,000 | two objects in turn | no | 10.3 | 581 | 13.6 |
| 10,000 | two objects in turn | input and result | 182 | 745 | 187 |
| 100,000 | two objects in turn | no | 142 | 5,840 | 145 |
| 100,000 | two objects in turn | input and result | 1,905 | 7,539 | 1,897 |
| 10,000 | 16 objects in turn | no | 10.5 | 93.5 | 14.3 |
| 100,000 | 16 objects in turn | no | 141 | 973 | 145 |
| 10,000 | each object twice | input and result | 1,120 | 191 | 191 |
| 10,000 | two objects in turn in the first 20 rows | input and result | 2,060 | 201 | 199 |
| 10,000 | two objects in turn in the first 100 rows | no | 137 | 33.2 | 30.9 |
| 10,000 | two objects in turn in the first 100 rows | input | 1,897 | 62.7 | 64.4 |
| 10,000 | two objects in turn in the first 100 rows | input and result | 2,041 | 205 | 206 |
| 100,000 | two objects in turn in the first 100 rows | input | 19,181 | 617 | 623 |
| 100,000 | two objects in turn in the first 100 rows | input and result | 20,793 | 2,091 | 2,086 |
| 10,000 | two objects in turn in the first half | no | 74.6 | 303 | 58.0 |
| 10,000 | two objects in turn in the first half | input | 985 | 330 | 655 |
| 10,000 | two objects in turn in the first half | input and result | 1,128 | 472 | 797 |

The backward search covers at most the last doubled step, which a long run of copies makes long: with the first half of the rows repeated, the PR took twice the time of `main` on frozen input, and less than before PR #200. Arrays of objects repeated throughout took 3–4 µs more than before PR #200, whose single backward search found their last copies at once. A first version of the PR searched from the end after 16 copies, as before PR #200, and took 1,895 µs for the first 100 rows of 10,000 on frozen input. At 10,000 rows with auto-freeze off, the PR took at most about 1 µs more than that first version in every layout in Chromium 148, Firefox 150 and WebKit 26.4, and 44 µs instead of 1,553 µs in Chromium for the first 100 rows on frozen input. Two other searches were measured: halving the range with forward searches was faster in V8 but up to 3.7 times slower than the first version in WebKit on frozen input, and a backward loop in JavaScript became up to 7.5 times slower once its lookups had seen arrays of several kinds. Only the first eight lookups of an array in an update search; later ones read the map of original indices, so these searches run at most eight times per array and update. The production CJS artifact grew from 8,449 to 8,472 Brotli bytes.

### Set reads, Map iteration, moved rows and unchanged collections

PRs #183 and #184 measured four of their improvements with micro-benchmarks only, so [PR #198](https://github.com/unadlib/mutative/pull/198) added a scenario for each. Microseconds per scenario, medians of three runs, patches off:

| Scenario | Rows | Freeze | Mutative | Mutative 1.3.0 | Immer | Hand-written | Immer/Mutative | 1.3.0/Mutative |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| set-read | 100 | off | 0.62 | 4.75 | 0.66 | 0.03 | 1.07 | 7.71 |
| set-read | 1,000 | off | 0.61 | 39.5 | 0.66 | 0.04 | 1.08 | 64.52 |
| set-read | 10,000 | off | 0.62 | 544 | 0.66 | 0.03 | 1.07 | 884 |
| map-forEach | 100 | off | 2.51 | 9.09 | 3.16 | 0.59 | 1.26 | 3.63 |
| map-forEach | 1,000 | off | 26.2 | 86.7 | 29.8 | 5.54 | 1.14 | 3.31 |
| map-forEach | 10,000 | off | 261 | 873 | 289 | 54.9 | 1.11 | 3.35 |
| shift-and-update | 100 | off | 1.49 | 83.2 | 69.8 | 0.07 | 46.70 | 55.68 |
| shift-and-update | 1,000 | off | 2.22 | 803 | 672 | 0.32 | 303 | 362 |
| shift-and-update | 10,000 | off | 8.91 | 9,525 | 8,611 | 1.40 | 967 | 1,069 |
| shift-and-update | 100 | on | 3.71 | 85.3 | 79.0 | — | 21.31 | 23.00 |
| shift-and-update | 1,000 | on | 21.2 | 823 | 750 | — | 35.36 | 38.82 |
| shift-and-update | 10,000 | on | 184 | 9,634 | 9,212 | — | 49.96 | 52.25 |
| map-set-beside | 100 | off | 8.64 | 16.7 | 22.6 | 4.30 | 2.62 | 1.93 |
| map-set-beside | 1,000 | off | 44.8 | 112 | 166 | 42.2 | 3.72 | 2.50 |
| map-set-beside | 10,000 | off | 563 | 1,478 | 1,969 | 576 | 3.50 | 2.62 |
| map-set-beside | 100 | on | 11.8 | 37.8 | 29.2 | — | 2.49 | 3.21 |
| map-set-beside | 1,000 | on | 65.4 | 317 | 203 | — | 3.10 | 4.85 |
| map-set-beside | 10,000 | on | 768 | 3,408 | 2,267 | — | 2.95 | 4.44 |

- `set-read` checks whether a Set of numbers holds its middle number and a missing one, and reads its size. Mutative 1.3.0 mapped every item of a Set draft as soon as the recipe read the Set, and copied the Set when a lookup missed; the candidate does neither until the recipe changes the Set (PR #183), as Immer does. Both took 0.6–0.7 µs at every size, and 3 of the 12 cells against Immer are within 5%.
- `map-forEach` sums a Map of numbers with `forEach()`. Mutative 1.3.0 called `get()` through the draft's proxy for each entry; the candidate reads each entry from the draft's state (PR #184), which takes 0.3 of the time, and 0.8–0.9 of Immer's. The hand-written reducer's native `forEach()` took a fifth of the candidate's time.
- `shift-and-update` removes the first row with `shift()` and updates the middle row. The candidate moves the rows natively on its copy and finds the moved row's original index from the offset of the move (PR #200), while Immer and Mutative 1.3.0 move every row through the draft's proxy. With Immer's array-method plugin, the candidate was faster in every cell, 1.1–43 times.
- `map-set-beside` inserts a row into a Map of rows and a number into a Set of numbers, which copies both, and then updates a number beside them in nine more producers. Without auto-freeze the copies dominate in every library: at 10,000 rows the candidate was within 5% of the hand-written reducer. With auto-freeze, Mutative 1.3.0 walked both copies again in each later producer, since it froze Map and Set instances only by replacing their mutators; the candidate freezes the instances themselves (PR #184), so the later producers skip them, as Immer's do.

Each scenario detects the loss of the improvement it covers. Built from the commit that made each improvement and from the commit before it, with Mutative alone in three alternating processes at 1,000 rows, the earlier build took 62–65 times as long in `set-read` in every mode (39.7 µs against 0.62 µs without freezing or patches), 3.5 times in `map-forEach` (91.9 µs against 25.9 µs), 11 times in `shift-and-update` without freezing or patches (32.7 µs against 2.94 µs) and 1.5 times with freezing alone, and 2.0–2.3 times in `map-set-beside` with auto-freeze (311 µs against 135 µs without patches). The CI budgets fail a cell at 1.30 times.

### Selected times

Microseconds per complete scenario, medians of three runs.

| Scenario | Rows | Freeze | Patches | Mutative | Mutative 1.3.0 | Immer | Hand-written | Immer/Mutative |
| --- | ---: | --- | --- | ---: | ---: | ---: | ---: | ---: |
| small-object-update | 100 | off | off | 0.51 | 0.80 | 0.69 | 0.02 | 1.37 |
| read-index | 100 | off | off | 45.8 | 61.3 | 86.4 | 0.14 | 1.89 |
| rtkq-sequence | 100 | off | off | 1,001 | 1,849 | 1,133 | 352 | 1.13 |
| sortById-reverse | 100 | off | off | 52.3 | 92.6 | 69.3 | 1.21 | 1.33 |
| array-shift-nested | 100 | off | off | 0.74 | 79.8 | 68.9 | 0.05 | 93.61 |
| update-largeObject1 | 100 | off | off | 50.3 | 50.7 | 149 | 126 | 2.96 |
| update-largeObject1 | 100 | on | off | 140 | 121 | 229 | — | 1.64 |
| object-update | 100 | off | off | 3.13 | 6.10 | 3.49 | 2.13 | 1.12 |
| map-update | 100 | off | off | 4.52 | 5.13 | 4.88 | 3.60 | 1.08 |
| set-update | 100 | off | off | 3.32 | 8.79 | 41.7 | 2.12 | 12.57 |
| class-update | 100 | on | off | 3.89 | 5.20 | 9.18 | — | 2.36 |
| apply-array-ops | 100 | off | off | 2.97 | 115 | 99.0 | — | 33.32 |
| return-filter | 100 | off | off | 24.0 | 26.4 | 33.2 | 0.19 | 1.38 |
| search-current | 100 | off | off | 12.5 | 43.8 | 236 | 0.15 | 18.89 |
| array-splice-insert-nested | 1,000 | off | off | 4.91 | 391 | 354 | 2.02 | 72.00 |
| object-update | 1,000 | off | off | 51.1 | 50.4 | 129 | 125 | 2.51 |
| class-wide-update | 1,000 | on | off | 402 | 411 | 237 | — | 0.59 |
| map-update | 1,000 | off | off | 39.7 | 40.6 | 40.3 | 38.4 | 1.01 |
| array-shift-nested | 10,000 | off | off | 7.04 | 8,203 | 7,408 | 1.40 | 1052.16 |
| array-unshift-nested | 10,000 | off | off | 15.8 | 8,178 | 7,447 | 28.4 | 471.73 |
| array-reverse-nested | 10,000 | off | off | 13.8 | 9,551 | 7,611 | 9.58 | 549.54 |
| array-reverse-nested | 10,000 | off | on | 1,071 | 280,542 | 9,424 | — | 8.80 |
| read-index | 10,000 | off | off | 4,756 | 8,120 | 9,584 | 57.7 | 2.01 |
| set-update | 10,000 | off | off | 531 | 1,024 | 6,024 | 398 | 11.34 |
| object-update | 10,000 | off | off | 1,200 | 1,188 | 2,094 | 2,088 | 1.74 |
| apply-reverse | 10,000 | off | off | 9,869 | 13,809 | 13,741 | — | 1.39 |
| push-and-insert | 10,000 | off | on | 63.2 | 210 | 360 | — | 5.69 |
| return-replace | 10,000 | on | off | 0.53 | 2,628 | 0.79 | — | 1.48 |
| search-current-shifted | 10,000 | off | off | 257 | 15,717 | 11,255 | 64.8 | 43.73 |

### Against a hand-written reducer

The hand-written reducer is faster than the candidate in 129 of 150 cells, and across all 150 the candidate takes 8.4 times as long on geometric mean: the reducer copies only what each update changes and has no draft to create, track, or finalize. The candidate is faster in 18 cells. Fifteen copy wide objects: objects with 1,000 and 3,000 properties, records with 1,000 or 10,000 keys, and class instances with 100 or more fields, by 1.5–2.8 times. One inserts at the front of an array of 10,000 rows, where the reducer's spread copies every element and `unshift` runs natively on the draft's copy: 15.8 µs against 28.4 µs; at 100 and 1,000 rows the reducer was faster. Two add a number to a Set of 1,000 or 10,000 numbers, which the candidate copies with `Set.prototype.difference`, faster than the reducer's `new Set()`: 1.28 µs against 4.04 µs and 29.5 µs against 61.2 µs; at 100 numbers the reducer was faster, 0.44 µs against 0.69 µs. Copying a Map of 1,000 or 10,000 entries dominates `map-update` in both, which are within 5%, and so does copying a Map and a Set of 10,000 entries in `map-set-beside`. The hand-written reducer is the same spread-based code that validates every scenario; faster hand-written code exists for many of them.

### Shared and isolated processes

Batches before that of 2026-10-06 and 2026-10-07 ran every scenario except the wide-object ones with all four libraries together, in one process per run and a second one for the Map and Set scenarios. This batch measured every cell both ways, and in a process of its own every library was faster, by different amounts. Over all 614 cells, the shared-process times were longer on geometric mean by 1.09 times for the candidate, 1.15 times for Mutative 1.3.0 and 1.16 times for Immer, and over the 150 cells of the hand-written reducer by 1.66 times; at the 95th percentile by 1.30, 1.59, 1.76 and 5.54 times. In a shared process the recipes, the hand-written reducer and the libraries handle the objects of every scenario, so V8 optimizes them for many object shapes at once; in a process of its own each handles the shapes of one scenario. Small code gains the most: the hand-written reducer summed 100 rows in 0.14 µs alone and in 0.72 µs beside the others. Immer gained more than the candidate, most of all in Set updates: adding a number to a 100-item Set took Immer 5.88 µs alone and 13.9 µs beside the others, and the candidate 0.69 µs and 0.79 µs.

| Comparator | All in shared processes | Isolated processes |
| --- | ---: | ---: |
| Immer 11.1.18 | 601 / 12 / 1 of 614, 3.80 | 595 / 13 / 6 of 614, 3.58 |
| Immer 11.1.18 with its defaults | 154 / 0 / 3 of 157, 6.84 | 154 / 0 / 3 of 157, 6.63 |
| Pinned npm Mutative 1.3.0 | 569 / 38 / 7 of 614, 4.51 | 535 / 70 / 9 of 614, 4.27 |
| Hand-written reducer | 19 / 2 / 129 of 150, 0.18 | 18 / 3 / 129 of 150, 0.12 |

Most of the difference against Immer lies at 100 rows (3.25 shared, 3.04 isolated); at 1,000 and 10,000 rows the geometric means are 4.91 and 4.70. The isolated processes give the more even comparison between libraries, and every result above uses them. Each one measures a workload alone, as a microbenchmark does; in an application, the application's own code shares V8's state as the other libraries did here.

Inserting a property into the 1,000-property object also depended on the order of the code that ran before it in a shared process. With libraries in alternating orders in six processes, the hand-written reducer took 1.66–1.69 µs when it ran after the libraries and 122–129 µs when it ran first; Immer 2.64–2.73 µs after the hand-written reducer and 144–145 µs after Mutative; the candidate 51.3–52.0 µs first and 94.9–96.7 µs after the others. In processes of their own the candidate took 50.3 µs, Mutative 1.3.0 50.7 µs, Immer 149 µs, and the hand-written reducer 126 µs. A separate effect made the first timed run of a scenario in a process slower: updating a 100-key record took 12–15 µs in every library there and 3–4 µs afterwards. Priming each benchmark removed it.

### Memory

Sampled allocation of the candidate was below Mutative 1.3.0 in 107 of 114 memory cells. The exceptions are `noop-empty` in three modes, by 2–4% (at most 4.4 KiB against 4.2 KiB), `map-update` at 1,000 entries with patches and at 10,000 entries without auto-freeze, by 0.3–1.2%, and `map-update` at 10,000 entries with auto-freeze and patches, by 20% (3.7 MiB against 3.1 MiB); with auto-freeze and without patches, the candidate allocated 2.8 MiB against 2.9 MiB, and the time of both cells equals that of 1.3.0 (690 µs against 696 µs and 698 µs). It was below Immer in 79 of 114 cells: lower for reads, array moves, Set additions, returned filters, and patch application; higher for Map drafts (up to 2.3 times), the push-and-insert fixture (1.1–2.6 times), the 1,000-key record (113 against 17 KiB), and by a few KiB for no-op, small-object, record, and class-instance producers. Objects with more than 128 keys are copied into dictionary-mode objects, which also retain 48 KiB per output at 1,000 keys, against 8 KiB for the other libraries.

| Scenario | Rows | Patches | Candidate | Mutative 1.3.0 | Immer | Hand-written |
| --- | ---: | --- | ---: | ---: | ---: | ---: |
| read-index | 100 | off | 96.6 | 153.0 | 195.5 | 1.7 |
| push-and-insert | 100 | off | 115.3 | 1,365.8 | 66.1 | 19.7 |
| object-update | 1,000 | off | 113.0 | 1,310.3 | 16.6 | 11.1 |
| set-add | 10,000 | off | 330.1 | 2,887.8 | 1,613.7 | 325.1 |
| array-reverse-nested | 10,000 | off | 88.3 | 11,077.5 | 12,859.8 | 83.6 |
| array-reverse-nested | 10,000 | on | 3,041.8 | 268,581.8 | 15,095.2 | — |

Sampled KiB allocated per iteration with freeze off, medians of three isolated workers. With patches, nested reverse at 10,000 rows retains about 1,797 KiB per output, against 9,891 KiB for Mutative 1.3.0 and 1,797 KiB for Immer.

### Immer with `enableArrayMethods`

The plugin datasets rerun the array-related scenarios with Immer's array-method plugin enabled, measuring only the candidate and Immer (`--library both --immer-array-methods`), each in processes of its own: 52 scenarios at 100 rows and 16 at 1,000 and 10,000 rows, in both freeze and patch modes. All 656 combinations pass the correctness checks. These scenarios only read in their callbacks, so the plugin's documented behavior, raw objects handed to callbacks and returned from removals, does not change their results; [`test/immer-array-methods.md`](../../test/immer-array-methods.md) records the failures it causes when they write. The [freeze-off, patches-on section](#why-immers-array-method-plugin-is-not-the-main-comparator) explains why the main comparison leaves the plugin off.

| Comparator | Faster / within 5% / slower | Geometric mean Immer/candidate |
| --- | ---: | ---: |
| Immer 11.1.18 with `enableArrayMethods`, all plugin cells | 265 / 4 / 59 of 328 | 1.89 |
| Array-method scenarios only | 158 / 1 / 13 of 172 | 2.35 |

| Scenario | Rows | Freeze | Patches | Candidate | Immer + plugin | Immer/candidate |
| --- | ---: | --- | --- | ---: | ---: | ---: |
| array-shift-nested | 10,000 | off | off | 7.06 | 378 | 53.46 |
| array-shift-nested | 10,000 | off | on | 1,064 | 1,373 | 1.29 |
| array-shift-nested | 10,000 | on | off | 193 | 1,121 | 5.80 |
| array-reverse-nested | 10,000 | off | off | 13.7 | 393 | 28.68 |
| array-reverse-nested | 10,000 | off | on | 1,075 | 1,373 | 1.28 |
| array-splice-insert-nested | 10,000 | off | off | 20.8 | 410 | 19.76 |
| array-reverse-primitive | 10,000 | off | off | 13.7 | 365 | 26.73 |
| array-shift-nested | 1,000 | off | on | 110 | 124 | 1.13 |
| array-shift-nested | 100 | off | off | 0.74 | 2.56 | 3.47 |
| array-push-primitive | 100 | off | off | 1.11 | 0.76 | 0.69 |
| array-sort-nested | 100 | off | off | 90.1 | 8.57 | 0.10 |
| search-draft | 10,000 | off | off | 2,158 | 91.3 | 0.04 |
| read-missing | 10,000 | off | off | 1,984 | 69.3 | 0.03 |

Immer with the plugin is faster in 59 cells. Most are scenarios where the plugin hands raw base elements to a callback or comparator, which Mutative never does: `find` in `read-missing` (24–29 times at 1,000 and 10,000 rows), `findIndex` in `remove-high`, `remove-high-reuse` and `search-draft` (up to 24 times at 10,000 rows), `filter` in `filter` and `return-filter`, and sorts of objects in `sortById-reverse`, `array-sort-shallow` and `array-sort-nested`. The others are `push` and `pop` on 100 rows with freeze and patches off, which Mutative leaves on the proxy path: 1.1–1.3 µs against 0.7–1.0 µs, and `add`, which pushes a row. Every `shift`, `unshift`, `splice` and `reverse` cell is faster than Immer with the plugin; at 10,000 rows by 20–53 times with freeze and patches off, 5.5–11 times with freeze on, and 1.2–2.0 times with patches on. So is every cell of `shift-and-update`, by 1.1–43 times.

### Paired performance budget

The local budget gate compared the current build with itself at 1,000 rows, since this batch changes no Mutative source file. All 222 decisions of the five budget groups passed: five latency pairs and three memory pairs per cell, both freeze and patch modes. The latency ratios of the fastest processes spanned 0.970–1.109; above 1.10 was only `array-reverse-primitive` with freeze on and patches off (1.11, 10.7 µs against 9.68 µs), below the 1.30 budget. The medians of the paired ratios spanned 0.886–1.025 for sampled allocation and 1.000–1.040 for retained heap.

### Changes since the previous batch

This comparison uses the cells that the previous summary published: the batch of October 9 and 10, with the `shift-and-update` cells that PR #200 measured again on October 10. Over all 614 cells, the candidate's time changed by less than 1% on geometric mean (previous/current time 1.003), as did those of Immer (1.004) and Mutative 1.3.0 (1.006), whose code did not change; over its 150 cells the hand-written reducer's changed by 1.3%, about half of it in its searches at 10,000 rows, whose processes took either about 23 µs or about 65 µs in both batches. The process means of most cells are steady enough that a drift of this size separates them: in 63 cells every process of this batch was faster than every process of the previous measurement and in 13 slower, 73 of the 76 by less than 3%, and the cells of Immer and Mutative 1.3.0 separated as often, 62 and 13 times and 52 and 9 times.

The source changes since the previous batch, outside the `shift-and-update` cells, are the moved-element lookups of PRs #200 and #202 and the `apply()` hardening of PR #201, which also removed an unused argument of the freezing walk from production builds. The counts against Immer and Mutative 1.3.0 changed more than the times: 6 cells are slower than Immer instead of 2, and 9 slower than Mutative 1.3.0 instead of 3, all with freeze on. Two of the new Immer cells, `class-wide-update` without patches at 100 and 10,000 rows, crossed the 5% line with changes of less than 2%: Immer's time over the candidate's was 0.959 and 0.970 before and is 0.947 and 0.952 now. The other new cells are freeze-on cells of the upstream workloads, `push-and-insert` and `object-delete`, whose processes varied by up to 1.4 times in both batches, so their medians follow the processes that each batch drew: `concat` with freeze on took the candidate 21.1 µs instead of 17.7 µs, while Immer took 18.8 µs instead of 23.8 µs and Mutative 1.3.0 19.5 µs instead of 21.3 µs.

Ten alternating rounds of benchmark bundles built from the source of the previous batch and that of this one, with Mutative alone in each process, measured these scenarios in both freeze and patch modes: `add`, `concat`, `push-and-insert`, `remove` and `update-largeObject1` at 100 rows and `object-delete` and `push-and-insert` at 1,000 rows. Ten more rounds measured `mutation-density-100pct` at 10,000 rows, whose processes without freezing and with patches were all slower than those of the previous batch, by 5.2%, the largest such gap, and `array-splice-remove-nested` at 100 rows, a splice whose moves PR #200 changed, slower by 2.5%. Over all 360 pairs of processes, the geometric mean of the time ratios was 1.001, and over the 36 cells it ranged from 0.965 to 1.067. Only two cells were slower with the source of this batch in more than 7 of the 10 rounds, by less than 2%: `concat` with patches and without freezing (0.80 µs against 0.79 µs) and `mutation-density-100pct` with freeze on and without patches. In `push-and-insert` with freeze on at 100 rows, whose processes spread over 117–164 µs with both sources, this batch's source took 5–7% longer on geometric mean but was slower in only 5 and 6 of the 10 rounds, a difference that ten rounds do not resolve; the freeze-on cells of `object-delete` took 3% less. Without freezing and with patches, `mutation-density-100pct` took 8,428 µs against 8,414 µs, and `array-splice-remove-nested` took the same time with both sources in every mode.

## Tradeoffs and limits

- Returned values: without auto-freeze, the candidate searches every object of a returned value for drafts, as Immer does: `return-replace` took 2.60 ms at 10,000 rows, against 5.72 ms for Immer without auto-freeze. Immer's default auto-freeze skips frozen values (0.79 µs), and so do production builds of the candidate with auto-freeze (0.53 µs). Wrapping the value in `rawReturn()` skips the search (0.26 µs).
- A Set draft copies the Set on its first change and rebuilds it in order once an item that the recipe read through an iterator changed: `set-update` took 531 µs at 10,000 items, against 398 µs for the hand-written reducer, which copies the Set once. With patches, a Set that added or deleted items compares every original item with its copy and every item of the copy with the original: `set-add` took 440 µs with patches at 10,000 items, against 29.5 µs without. Copying the Map dominates `map-update` at 10,000 entries in every library, about 520 µs.
- After `reverse()`, or after moves whose last offset does not lead back to an element, the candidate finds a moved row's original index by searching the original array from its end with `lastIndexOf`, which V8 runs about 15 times as slowly on frozen, sealed and non-extensible arrays: editing the middle row of 10,000 frozen rows took 310 µs after `reverse()`, against 188 µs after `shift()`, measured outside the suite. An element with more than 16 later copies is searched for backward over at most the last doubled step of its forward searches, which a long run of copies makes long: `shift()` and eight reads of 10,000 rows whose first half holds two objects in turn took 655 µs on frozen input, against 330 µs when the lookups followed every copy forward.
- With auto-freeze, Immer updated class instances with many fields faster: one with 1,000 fields in 237 µs against 402 µs, and ones with 100 or 10,000 fields in about 5% less time without patches. Without freezing the candidate is faster, 98.8 µs against 203 µs at 1,000 fields, so the difference lies in freezing the candidate's copy, which it makes property by property with descriptors where Immer 11 uses `Object.assign`.
- Even in processes of their own, some cells varied between processes of the same build by up to about 1.8 times, for example `remove-reuse` with freeze on (147–261 µs) and Immer's `read-forEach` at 10,000 rows (5.7–8.6 ms); `class-wide-update` without freezing at 1,000 rows took either about 98 µs or about 200 µs in both Mutative builds, and the hand-written reducer's searches at 10,000 rows either about 23 µs or about 65 µs. The freeze-on upstream workloads at 100 rows vary most among the candidate's cells, which is why `add` and `concat` with freeze on are slower than Immer, and several freeze-on cells slower than Mutative 1.3.0, in this batch. Medians of three processes absorb one outlier, not two; compare such cells through geometric means rather than one by one.
- Isolated processes measure each library without the other libraries and scenarios, not inside a real application, whose own code also changes V8's state; wide-object timings in particular depend on it, by up to about 70 times.
- Freeze-on inputs are already frozen, so freezing cold external data is excluded. Allocation is sampled, and small retained deltas are noisy. All measurements come from one machine and Node.js; browser engines may differ: in WebKit 26.4, `Object.freeze` of a 10,000-element array took about 2.4 ms and every scan of a frozen array was slow, so an update of 10,000 frozen rows took several milliseconds there with every build.
- Bundle size: as the README measures it with esbuild 0.24.0, importing only `create` bundles to 7.9 kB with Brotli against 3.6 kB for Immer's `produce`, and with patches, Map and Set support and array methods to 8.5 kB against 6.4 kB for Immer with its plugins. `size-limit` measures the production CJS artifact at 8.64 kB against its 8.7 kB cap (8,472 Brotli bytes), and the ESM consumers of `create` and of all exports at 7.58 kB and 8.52 kB against 7.7 kB and 8.6 kB.

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

The measured source is that of [`40f3a42`](https://github.com/unadlib/mutative/commit/40f3a421bb67de29d2f6031fcd5d7f5d65a51974), with the harness of the same commit, built in a clean checkout of its own. Every dataset reports the same source and production hashes. The harness is the one that the previous batch ran, since PRs #199 to #204 changed no harness file.

SHA-256 identities (`source` uses the sorted path/content algorithm in [`build.mjs`](../build.mjs); `production` is `dist/mutative.cjs.production.min.js`):

```text
Candidate source:     bd2e2520c12c53c389eb5a44cbf5e0cbc47361819c974ad360f53028fe05fcb9
Candidate production: cb6464f37085cebc64ecbe97ee73551c81999c1d356e491dab97d7df032965ea
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

The `shift-and-update` cells of 2026-10-10 measured the production artifact of PR #200, which its head builds unchanged, and compared it with `main` at `9f93f16`:

```text
PR #200 production:   5be24e4472b057a699002455e0afb18e7fefe420b67349a11ee0e2b866b81e03
main production:      bd8ff3a63a6007bb800f8782985e6156c57aac1bbd0c8f7251708e863c2c19c9
```

The comparison in [changes since the previous batch](#changes-since-the-previous-batch) built `ce0c25e`, whose production artifact (`bd8ff3a6…`) is the one the previous batch measured, and `40f3a42`. The comparison of each scenario of PR #198 with the commit before the improvement it covers built `538b7ae` and `715a41f` for `set-read`, `bad9902` and `13460fb` for `shift-and-update`, `00d4829` and `2168780` for `map-set-beside`, and `0bf2740` and `ce20399` for `map-forEach`.

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

This batch ran the isolated command at 100 rows in five groups of scenarios, one after another, with the same options.

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

The comparison in [changes since the previous batch](#changes-since-the-previous-batch) and that of each scenario of PR #198 with the commit before the improvement it covers build each source in a checkout of its own and run the resulting bundles with Mutative alone, in alternating order: ten rounds for each scenario of the former, three for each scenario of PR #198 at 1,000 rows.

```sh
# For each source, from a built checkout of it at $CHECKOUT:
MUTATIVE_PERF_CANDIDATE_DIR="$CHECKOUT" MUTATIVE_PERF_BUILD_DIR="perf-testing/dist/$NAME" node perf-testing/build.mjs
MUTATIVE_PERF_BUNDLE="perf-testing/dist/$NAME/immutability-benchmarks.mjs" node perf-testing/run-benchmarks.mjs --library mutative --runs 1 --freeze both --patches both --filter '^add$'
MUTATIVE_PERF_BUNDLE="perf-testing/dist/$NAME/immutability-benchmarks.mjs" node perf-testing/run-benchmarks.mjs --library mutative --runs 1 --array-size 1000 --freeze both --patches both --filter '^set-read$'
```

## History

Earlier versions of this summary, in Git history, describe each round in detail. Cell counts compare the candidate with the named comparator: faster, within 5%, and slower.

- 2026-10-11, PR #202: a lookup of a moved array element follows 16 later copies of a repeated element one after another, then searches forward with doubling steps and backward only from the first step past its last copy, instead of once per later copy since PR #200. Against `main` before it, outside the suite, `shift()` and eight reads near the start of 10,000 rows of two objects in turn took 13.6 µs instead of 581 µs (10.3 µs before PR #200), and of 100,000 rows 145 µs instead of 5,840 µs; arrays without repeated objects, with few copies of each, or with copies in their first 100 rows kept their time, and 10,000 rows whose first half holds two objects in turn took 655 µs instead of 330 µs on frozen input. The production CJS artifact grew from 8,449 to 8,472 Brotli bytes.
- 2026-10-10, PR #200: an array draft looks up the original index of a moved element first where the offset of the last move puts it, and searches forward from there, instead of searching the original array from its end, which V8 runs about 15 times as slowly on frozen arrays. Against `main` before it, Mutative alone, `shift-and-update` took 0.82 of the time over its 12 cells and 0.56–0.77 without patches at 1,000 and 10,000 rows, and eight edits of moved rows of 10,000 frozen rows 208 µs instead of 2,050 µs. With its cells measured again: 596 / 16 / 2 of 614 against Immer (geometric mean 3.59), 154 / 0 / 3 of 157 with each library's defaults (6.66), and 538 / 73 / 3 against 1.3.0 (4.29). The production CJS artifact grew from 8,367 to 8,439 Brotli bytes.
- 2026-10-09 and 2026-10-10, PR #199, the source of `main` after PR #198, 97 scenarios with every library in processes of its own: 596 / 16 / 2 of 614 cells against Immer (geometric mean 3.58), 154 / 0 / 3 of 157 with each library's defaults (6.62), 538 / 73 / 3 against 1.3.0 (4.27), and 18 / 3 / 129 of 150 against the hand-written reducer; in shared processes the same cells gave 603 / 11 / 0 against Immer (3.79). Against the cells it replaced, the candidate's time changed by less than 1% on geometric mean. PR #200 later measured `shift-and-update` again, as its entry describes.
- 2026-10-09, PR #198: the scenarios `set-read`, `map-forEach`, `shift-and-update` and `map-set-beside` cover improvements of PRs #183 and #184 that only micro-benchmarks had measured, and CI budgets them. Measured with every library in processes of its own at 100, 1,000 and 10,000 rows, their cells join the results: 595 / 16 / 3 of 614 against Immer (geometric mean 3.59), 153 / 1 / 3 of 157 with each library's defaults (6.66), 543 / 70 / 1 against 1.3.0 (4.28), and 18 / 3 / 129 against the hand-written reducer. Built from the commit before the improvement it covers, each scenario took at least 2.3 times as long in one or more modes, and `set-read` 62–65 times as long in every mode.
- 2026-10-09, PR #196: `apply()` reads the type of each draft on a patch path from its state instead of asking its proxy twice per step. Against `main` before it, Mutative alone, the PR took 0.68 of the time over 14 patch application cells, and `apply-update-10pct` 0.49–0.61 of it. The patch application scenarios, measured again with every library in processes of its own, replace the earlier cells: 551 / 12 / 3 of 566 against Immer (geometric mean 3.66), 142 / 0 / 3 of 145 with each library's defaults (6.76), and 495 / 70 / 1 against 1.3.0 (3.88). The production CJS artifact grew from 8,334 to 8,367 Brotli bytes.
- 2026-10-09, PR #195: Set drafts add and delete items in their copy, map only the items that drafts stand for and are rebuilt once, by their own producer, drafts of Set subclasses keep their items in order, and a Set draft that left its key keeps its changes, which 1.3.0 also lost. Against `main` before it, Mutative alone, the PR took 0.28 of the time over 32 Set cells; `set-add` at 10,000 items took 33.2 µs instead of 987 µs. The Set scenarios, measured again with every library in processes of its own, replace the earlier cells: 548 / 12 / 6 of 566 against Immer (geometric mean 3.62), 142 / 0 / 3 of 145 with each library's defaults (6.62), 495 / 70 / 1 against 1.3.0 (3.84), and 18 / 2 / 118 against the hand-written reducer. The production CJS artifact grew from 8,201 to 8,334 Brotli bytes.
- 2026-10-06 and 2026-10-07, the source of `main` after PR #189, 93 scenarios with every library in processes of its own for the first time: 536 / 21 / 9 of 566 cells against Immer (geometric mean 3.37), 141 / 1 / 3 of 145 with each library's defaults (5.98), 470 / 95 / 1 against 1.3.0 (3.57), and 16 / 2 / 120 of 138 against the hand-written reducer; in shared processes the same cells gave 551 / 12 / 3 against Immer (3.50). Against the shared-process matrices of 2026-10-03 and 2026-10-04, the candidate's time fell by 11% on geometric mean over 530 cells. PRs #195, #196 and #198 later measured cells again or added them, as their entries describe.
- 2026-10-05, PR #184 review fixes: the source with the fixes against `main`, Mutative only, all 93 scenarios at 100 rows in both freeze and patch modes, three runs each: fixed/main geometric mean 0.982 over 366 cells, 42 cells more than 5% faster and 6 more than 5% slower; the slower wide-object cells measured 0.77–1.02 in isolated processes. Map iteration with the iterator lifetime checks took 1–2.4% longer than without them and about 70% less than `main` for primitive entries. An update beside an unchanged frozen 10,000-entry Map or Set took 0.44 µs instead of 66.7 µs and 26.1 µs. The production CJS artifact grew from 8,079 to 8,106 Brotli bytes.
- 2026-10-04, PR #180: `current()` copies changed array drafts from their current array and leaves moved base elements as they are, and strict mode warns once in development builds when a recipe leaves 1,000 or more drafts unchanged. The three `search-*` scenarios were added: a `current()` snapshot search at 10,000 rows took 209 µs instead of 3,262 µs, and 772 µs instead of 7,490 µs after `shift()`. Gate 48 of 48. The production CJS artifact grew from 8,031 to 8,104 Brotli bytes against `main`.
- 2026-10-03 and 2026-10-04, the source of `main` after PR #75 with the harness of PR #177, 90 scenarios at 100 rows and 23 at 1,000 and 10,000, in shared processes except for the wide-object scenarios: 508 / 11 / 11 of 530 cells against Immer (geometric mean 3.07), 133 / 0 / 3 of 136 with each library's defaults (6.01), 417 / 111 / 2 against pinned 1.3.0 (3.16), and 18 / 2 / 109 of 129 against the hand-written reducer (0.17). Immer was faster in `return-replace` with freeze on (2.9 ms against 0.9 µs at 10,000 rows), `apply-update-10pct` and `class-wide-update` with freeze on at 1,000 rows. With Immer's `enableArrayMethods`, 229 / 5 / 46 of 280 cells (1.63). Allocation below 1.3.0 in 104 of 114 memory cells; gate 48 of 48.
- 2026-10-03, PR #75, 67 scenarios: 339 / 1 / 0 of 340 cells against Immer with the plugin off (geometric mean 3.77; 6.21 over the array cells, 1.58 elsewhere), 335 / 4 / 1 against pinned 1.3.0 (5.48), 140 / 191 / 9 against the PR #174 archive (2.24). With Immer's `enableArrayMethods`, 211 / 1 / 36 cells (1.68). Allocation below 1.3.0 in 55 of 56 memory cells; gate 48 of 48. Three review rounds followed before the merge: search results that match the proxy path, strict-mode calls on the proxy path and no element inspection the proxy path does not make, and release of the receiver cache when a producer ends. Harness A/B comparisons put each round within 2% of the previous source, except a search that meets an unread base object, which now checks the array for holes (about 9 µs at 10,000 rows). Between that measurement and the merge, the size baseline of the production CJS artifact grew from 7,799 to 8,041 Brotli bytes, and its `size-limit` cap rose from 6.5 kB to 6.7 kB.
- 2026-10-02, an earlier source of PR #75: 340 / 0 / 0 cells against Immer (3.78), 335 / 5 / 0 against pinned 1.3.0 (5.50). That source excluded arrays holding `undefined` from the native path and matched a draft's original object in searches; the contract above replaced both.
- 2026-10-02 and 2026-10-03, local revisions of PR #75 that were never pushed: eligibility checks through property descriptors made 10,000-row moves slower than Immer with its plugin, and a per-element `in` scan and a WeakSet entry per array added 0.2–0.9 µs to 100-row operations. Later commits of the PR removed both costs.
- 2026-10-01, PR #174 (draft fast paths) and 2026-09-30 baseline: see the [archive index](./README.md).
