# Performance summary

Measurements from 2026-10-09 and 2026-10-10 UTC of the source of `main` at [`ce0c25e`](https://github.com/unadlib/mutative/commit/ce0c25e9f1efb43e735ad4d2abe0e03ce29b1161). Since the source of the previous batch, `2ab58fc`, `main` has added the array draft fixes of [PR #190](https://github.com/unadlib/mutative/pull/190), the `apply()`, mark, `current()` and async recipe fixes of [PR #192](https://github.com/unadlib/mutative/pull/192), the Set drafts of [PR #195](https://github.com/unadlib/mutative/pull/195) and the patch application change of [PR #196](https://github.com/unadlib/mutative/pull/196); PR #191 changed packaging, and [PR #198](https://github.com/unadlib/mutative/pull/198) added four scenarios to the harness. The candidate and the pinned npm baseline both report Mutative 1.3.0. Immer is pinned to 11.1.18 and Mitata to 1.0.34. The main comparison runs Immer without its array-method plugin; a separate dataset below enables `enableArrayMethods`. The raw datasets of this batch were not archived; the identities and commands below reproduce them, and the [archive index](./README.md) describes the retention policy for batches that are.

This batch remeasures every scenario with the method of the previous one: every timing below comes from processes that each run one scenario with one library, and the shared-process matrices are kept as a control, which [shared and isolated processes](#shared-and-isolated-processes) compares. It replaces the batch of 2026-10-06 and 2026-10-07 together with the cells that PRs #195 and #196 measured again and PR #198 added, which the [history](#history) summarizes; [changes since the previous batch](#changes-since-the-previous-batch) compares them with this batch.

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
| Immer 11.1.18 | 374 / 8 / 0 of 382, 3.04 | 222 / 8 / 2 of 232, 4.67 | 596 / 16 / 2 of 614, 3.58 |
| Immer 11.1.18 with its defaults | 96 / 0 / 1 of 97, 6.23 | 58 / 0 / 2 of 60, 7.31 | 154 / 0 / 3 of 157, 6.62 |
| Pinned npm Mutative 1.3.0 | 346 / 33 / 3 of 382, 3.46 | 192 / 40 / 0 of 232, 6.03 | 538 / 73 / 3 of 614, 4.27 |
| Hand-written reducer | 7 / 0 / 87 of 94, 0.11 | 11 / 3 / 42 of 56, 0.13 | 18 / 3 / 129 of 150, 0.12 |

Against Immer by workload group, faster / within 5% / slower and geometric mean:

| Group | 100 rows | 1,000 rows | 10,000 rows |
| --- | ---: | ---: | ---: |
| Upstream workloads | 84 / 0 / 0, 2.02 | — | — |
| Reads | 20 / 0 / 0, 1.59 | 12 / 0 / 0, 1.60 | 12 / 0 / 0, 2.20 |
| No-op producers | 6 / 2 / 0, 1.66 | — | — |
| Small state | 12 / 0 / 0, 1.63 | — | — |
| Mutation density | 12 / 0 / 0, 2.08 | 4 / 0 / 0, 1.89 | 4 / 0 / 0, 1.88 |
| Array methods | 132 / 0 / 0, 5.71 | 20 / 0 / 0, 23.71 | 20 / 0 / 0, 30.26 |
| Moved elements | 4 / 0 / 0, 12.93 | 4 / 0 / 0, 22.19 | 4 / 0 / 0, 30.64 |
| Map and Set | 45 / 3 / 0, 2.26 | 25 / 3 / 0, 2.52 | 25 / 3 / 0, 2.37 |
| Object records | 11 / 1 / 0, 1.25 | 8 / 0 / 0, 2.38 | 8 / 0 / 0, 1.60 |
| Class instances | 6 / 2 / 0, 1.73 | 6 / 0 / 2, 1.61 | 6 / 2 / 0, 1.64 |
| Deep path | 4 / 0 / 0, 1.50 | — | — |
| Push and insert | 8 / 0 / 0, 2.04 | 4 / 0 / 0, 2.40 | 4 / 0 / 0, 3.35 |
| Patch application | 6 / 0 / 0, 4.12 | 4 / 0 / 0, 1.64 | 4 / 0 / 0, 1.59 |
| Returned values | 12 / 0 / 0, 3.83 | 12 / 0 / 0, 5.60 | 12 / 0 / 0, 8.84 |
| Searches | 12 / 0 / 0, 5.11 | 12 / 0 / 0, 8.26 | 12 / 0 / 0, 9.42 |

The 2 cells slower than Immer are `class-wide-update` with freeze on at 1,000 rows (415 µs and 410 µs against 237 µs and 241 µs); see the limits below. With each library's defaults, the candidate is slower only in `return-replace`, at every size: without auto-freeze it searches the returned state for drafts, which Immer's auto-freeze skips because the state is frozen (26.2 µs, 257 µs and 2.61 ms against 0.78–0.79 µs). The 3 cells slower than Mutative 1.3.0, by 7–16%, are `add` and `update-largeObject1` with freeze on at 100 rows (19.5 µs against 18.3 µs, and 141 µs and 148 µs against 129 µs and 128 µs), cells in which the three processes of each library overlapped: 1.3.0 measured 17.4–21.8 µs and 117–152 µs.

### Replacement returns with `rawReturn()` and default freeze settings

For a replacement value that contains no drafts, Mutative's `rawReturn()` skips the search through that value. The following comparison uses each library's default freeze setting: candidate `return-replace-raw` with auto-freeze off, and Immer `return-replace` with auto-freeze on. Both have patches off, and Immer's array-method plugin is off. Both recipes return a new root with replaced rows; only the Mutative recipe wraps it in `rawReturn()`.

Microseconds per call, using the same batch's medians of three independent-process means. The source cells are in `isolated-rest-default.json`, `isolated-1000.json`, and `isolated-10000.json`. Ratios and time reductions are calculated from the unrounded values.

| Rows | Mutative `rawReturn()`, freeze off | Immer ordinary return, freeze on | Immer/Mutative | Mutative time reduction |
| ---: | ---: | ---: | ---: | ---: |
| 100 | 0.258 | 0.777 | 3.01 | 66.7% |
| 1,000 | 0.259 | 0.781 | 3.02 | 66.9% |
| 10,000 | 0.259 | 0.786 | 3.03 | 67.0% |

The candidate's time stays approximately constant as the payload grows because it skips the draft search. Ordinary `return-replace` with auto-freeze off takes 26.2 µs, 257 µs, and 2.61 ms at these sizes. `rawReturn()` requires the entire returned value to contain no drafts; it cannot replace ordinary returns that include draft references. Immer's inputs and payloads are pre-frozen, so its times exclude the first freeze of external data. The candidate's inputs and payloads are unfrozen.

This comparison reuses existing cells and keeps the ordinary-return results and aggregate counts above unchanged. The [focused reproduction commands](../README.md#replacement-returns-with-default-freeze-settings) measure both return scenarios and freeze modes at all three sizes.

### Large arrays

Against Immer without its array-method plugin, by size and mode, over the 30 scaling scenarios: cells faster / within 5% / slower, and geometric means of Immer time over candidate time. The moves are `array-shift-nested`, `array-unshift-nested`, `array-splice-insert-nested`, `array-reverse-nested` and `array-reverse-primitive`.

| Rows | Freeze | Patches | All scenarios | Geometric mean | Moves, geometric mean | Moves, range |
| ---: | --- | --- | ---: | ---: | ---: | ---: |
| 1,000 | off | off | 29 / 1 / 0 | 8.58 | 209 | 72.1–485 |
| 1,000 | off | on | 27 / 1 / 0 | 4.11 | 7.1 | 6.1–7.5 |
| 1,000 | on | off | 28 / 1 / 1 | 3.84 | 32.4 | 18.6–47.2 |
| 1,000 | on | on | 27 / 0 / 1 | 2.68 | 6.6 | 6.2–6.8 |
| 10,000 | off | off | 29 / 1 / 0 | 10.61 | 431 | 177–1,051 |
| 10,000 | off | on | 27 / 1 / 0 | 4.59 | 7.3 | 5.1–8.9 |
| 10,000 | on | off | 28 / 2 / 0 | 4.17 | 38.8 | 22.5–54.3 |
| 10,000 | on | on | 27 / 1 / 0 | 2.84 | 6.8 | 5.2–8.0 |

Immer time over candidate time for the moves at 10,000 rows, by freeze and patch mode:

| Scenario | Off, off | Off, on | On, off | On, on |
| --- | ---: | ---: | ---: | ---: |
| array-shift-nested | 1,051 | 8.4 | 43.2 | 7.8 |
| array-unshift-nested | 476 | 8.5 | 42.4 | 7.7 |
| array-splice-insert-nested | 177 | 6.5 | 22.5 | 5.9 |
| array-reverse-nested | 550 | 8.9 | 39.3 | 8.0 |
| array-reverse-primitive | 306 | 5.1 | 54.3 | 5.2 |

The gap widens with size. With freeze and patches off, the moves were 209 times faster at 1,000 rows and 431 times at 10,000 on geometric mean: the candidate moves elements natively on its copy, while Immer moves each element through its draft proxy. Removing the first of 10,000 rows took 7.07 µs against 7,426 µs. With patches, both libraries emit one patch per moved index, which bounds the gain to 5–9 times. At these sizes Immer was faster only in `class-wide-update` with freeze on at 1,000 rows, and within 5% in Map updates without freezing and `class-wide-update` with freeze on at 10,000 rows, which the limits below discuss, and in two cells of `set-read`, where both libraries only read the Set.

### Freeze off, patches on

With patches on and freeze off, the candidate was faster than Immer in 147 of 150 cells and within 5% in the other 3, the Map updates at 1,000 and 10,000 rows and `map-delete` at 100 rows (geometric mean 3.29). It was faster than Mutative 1.3.0 in 132 and within 5% in 18 (4.58). In the 70 array-related cells, array methods, the update of a moved row, searches and the upstream array workloads at every size, it was faster than both in every cell: 4.41 times Immer and 13.14 times Mutative 1.3.0 on geometric mean.

Patches cost little when an update changes a few paths. They added a median 1% to the candidate's time at 1,000 and 10,000 rows and 20% at 100 rows. The former `benchmark:base` workload, `push-and-insert` at 10,000 rows, took 62.9 µs without patches and 63.0 µs with them; Mutative 1.3.0 went from 64.8 µs to 210 µs, and Immer from 165 µs to 364 µs. Moving elements is the exception: both libraries emit one patch per moved index, so `shift` at 10,000 rows produces 10,000 forward and 10,000 inverse patches in each. The candidate's time grows from 7.07 µs to 1,066 µs, against 8,967 µs for Immer producing the same patches.

Array methods on nested rows at 100 rows, in µs per call. The primitive and shallow shapes behave alike; over all 33 cells the candidate is 4.04 times faster than Immer (1.2–7.3) and 8.48 times faster than Mutative 1.3.0 (1.4–209).

| Operation | Candidate | Immer | Mutative 1.3.0 | Immer/candidate | 1.3.0/candidate |
| --- | ---: | ---: | ---: | ---: | ---: |
| push | 3.80 | 6.97 | 5.49 | 1.83 | 1.45 |
| pop | 1.50 | 6.01 | 3.63 | 4.00 | 2.42 |
| shift | 11.3 | 81.7 | 2,367 | 7.20 | 208.65 |
| unshift | 14.1 | 86.4 | 2,288 | 6.11 | 162.01 |
| splice, insert | 8.83 | 48.0 | 1,192 | 5.44 | 135.02 |
| splice, remove | 6.14 | 44.4 | 1,191 | 7.23 | 194.11 |
| splice, replace | 3.45 | 9.49 | 6.21 | 2.75 | 1.80 |
| fill | 4.24 | 7.99 | 6.81 | 1.88 | 1.60 |
| copyWithin | 2.41 | 5.56 | 79.2 | 2.31 | 32.88 |
| sort | 103 | 130 | 2,363 | 1.25 | 22.86 |
| reverse | 11.3 | 82.5 | 2,356 | 7.33 | 209.39 |

The array workloads of the upstream suite at 100 rows:

| Scenario | Candidate | Immer | Mutative 1.3.0 | Immer/candidate | 1.3.0/candidate |
| --- | ---: | ---: | ---: | ---: | ---: |
| add | 1.81 | 4.21 | 3.50 | 2.33 | 1.94 |
| remove | 11.4 | 83.2 | 2,949 | 7.28 | 257.87 |
| filter | 22.5 | 31.3 | 35.9 | 1.39 | 1.59 |
| concat | 0.78 | 0.98 | 1.04 | 1.26 | 1.34 |
| mapNested | 40.4 | 59.5 | 77.3 | 1.47 | 1.91 |
| sortById-reverse | 65.1 | 83.4 | 2,904 | 1.28 | 44.60 |
| reverse-array | 11.3 | 82.3 | 2,923 | 7.28 | 258.53 |
| update-multiple | 7.33 | 16.6 | 16.0 | 2.26 | 2.19 |
| remove-high | 19.9 | 49.0 | 610 | 2.46 | 30.62 |
| remove-reuse | 133 | 792 | 26,802 | 5.97 | 201.91 |
| mixed-sequence | 50.9 | 90.1 | 140 | 1.77 | 2.76 |

Moving elements at 1,000 and 10,000 rows, with Immer's array-method plugin from the plugin datasets for reference:

| Scenario | Rows | Candidate | Immer | Mutative 1.3.0 | Immer + plugin |
| --- | ---: | ---: | ---: | ---: | ---: |
| array-shift-nested | 1,000 | 110 | 801 | 25,431 | 124 |
| array-splice-insert-nested | 1,000 | 57.9 | 436 | 12,181 | 82.5 |
| array-reverse-nested | 1,000 | 110 | 811 | 25,045 | 125 |
| array-shift-nested | 10,000 | 1,066 | 8,967 | 273,171 | 1,390 |
| array-unshift-nested | 10,000 | 1,080 | 9,144 | 263,088 | 1,395 |
| array-splice-insert-nested | 10,000 | 710 | 4,615 | 134,943 | 939 |
| array-reverse-nested | 10,000 | 1,073 | 9,525 | 276,034 | 1,381 |
| array-reverse-primitive | 10,000 | 1,181 | 6,056 | 5,251 | 2,014 |

#### Why Immer's array-method plugin is not the main comparator

Immer's optional `enableArrayMethods()` also runs array methods on the draft's copy, and with patches it comes within 1.14–1.71 times of the candidate on the moves above. The comparisons nevertheless run Immer without it, because in Immer 11.1.18 the plugin breaks guarantees that its other configurations and Mutative keep. [`test/immer-array-methods.md`](../../test/immer-array-methods.md) reproduces four root causes:

- `shift`, `pop` and `splice` return raw base objects. Editing a removed object changes the previous state, or throws when that state is frozen.
- `reverse` and `sort` can expose original objects at inserted indices as raw values, with the same effect; inverse patches then restore the modified values instead of the original ones.
- After an insertion, edits to the shifted tail emit child patches before the array additions, so the forward patches cannot be replayed.
- Reordering a wrapper that holds a moved draft, or a negative `splice` index, leaves revoked drafts in the result and in patch values.

Of 4,913 three-step operation sequences, 123 violate at least one of these contracts with the plugin and none without it. The plugin also hands raw base elements to callbacks and comparators, which is why it beats the candidate in `find`, `findIndex`, `filter` and object `sort` cells: the callback reads the base without drafting it. The benchmark callbacks only read, so these results are correct with the plugin; recipes that edit removed objects or callback arguments are not.

### Searches of changed arrays

The `search-*` scenarios find the last row of an array of nested rows and update it after the producer changed the array: `search-draft` searches the draft after updating the first row, `search-current` searches a `current()` snapshot after the same update, and `search-current-shifted` searches a snapshot after `shift()`. Microseconds per scenario, medians of three runs, patches off:

| Scenario | Rows | Freeze | Mutative | Mutative 1.3.0 | Immer | Hand-written | Immer/Mutative |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| search-draft | 100 | off | 20.6 | 36.8 | 29.8 | 0.14 | 1.44 |
| search-draft | 100 | on | 23.0 | 39.7 | 37.6 | — | 1.63 |
| search-current | 100 | off | 12.2 | 43.3 | 232 | 0.14 | 19.08 |
| search-current | 100 | on | 14.6 | 45.9 | 34.6 | — | 2.37 |
| search-current-shifted | 100 | off | 3.60 | 145 | 96.1 | 0.13 | 26.70 |
| search-current-shifted | 100 | on | 5.86 | 150 | 105 | — | 17.86 |
| search-draft | 1,000 | off | 195 | 340 | 274 | 0.90 | 1.40 |
| search-draft | 1,000 | on | 214 | 360 | 345 | — | 1.61 |
| search-current | 1,000 | off | 24.2 | 332 | 2,287 | 0.88 | 94.67 |
| search-current | 1,000 | on | 42.8 | 358 | 259 | — | 6.05 |
| search-current-shifted | 1,000 | off | 22.9 | 1,405 | 929 | 0.86 | 40.57 |
| search-current-shifted | 1,000 | on | 41.6 | 1,442 | 1,005 | — | 24.18 |
| search-draft | 10,000 | off | 2,175 | 3,729 | 3,452 | 64.8 | 1.59 |
| search-draft | 10,000 | on | 2,308 | 3,880 | 4,077 | — | 1.77 |
| search-current | 10,000 | off | 177 | 3,443 | 22,711 | 65.2 | 128.53 |
| search-current | 10,000 | on | 353 | 3,636 | 2,444 | — | 6.92 |
| search-current-shifted | 10,000 | off | 257 | 15,961 | 11,379 | 23.4 | 44.25 |
| search-current-shifted | 10,000 | on | 435 | 16,186 | 11,981 | — | 27.56 |

A snapshot search was faster than the draft search at every size: 1.7 times at 100 rows, 8.1 times at 1,000 and 12 times at 10,000 with freeze off. The draft search drafts every row it visits, while `current()` copies the changed array from its current elements. After `shift()`, the search at 10,000 rows took 257 µs, against 772 µs when PR #180 was measured: updating the moved last row now finds its original index by searching the original array instead of building a map of all 10,000 original indices (PR #183). Immer's `current()` walks every unfrozen object, so with freeze off its snapshot searches are slower than its draft search.

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

Over all 32 cells, four Set scenarios at 100 rows and two at 1,000 and 10,000 rows in every mode, the PR took 0.28 of the time of `main` on geometric mean and was faster in each. Additions and deletions no longer copy the items into a Map and back, so without patches they now cost little more than copying the Set: in this batch, `set-add` at 10,000 items allocated 330 KiB per update, against 2,883 KiB for Mutative 1.3.0. With patches, a Set that added or deleted items still compares all items to emit its own patches, which bounds that gain to about 3 times, and a changed item still rebuilds the Set in order. In this batch the candidate was faster than Immer in every cell of these four Set scenarios, 3.0–50 times, and faster than the hand-written reducer in `set-add` at 1,000 and 10,000 rows, where `Set.prototype.difference` copies the Set faster than the reducer's `new Set()`.

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

PRs #183 and #184 measured four of their improvements with micro-benchmarks only, so [PR #198](https://github.com/unadlib/mutative/pull/198) added a scenario for each. Microseconds per scenario in this batch, medians of three runs, patches off:

| Scenario | Rows | Freeze | Mutative | Mutative 1.3.0 | Immer | Hand-written | Immer/Mutative | 1.3.0/Mutative |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| set-read | 100 | off | 0.62 | 4.78 | 0.66 | 0.03 | 1.07 | 7.71 |
| set-read | 1,000 | off | 0.62 | 40.2 | 0.66 | 0.04 | 1.07 | 65.04 |
| set-read | 10,000 | off | 0.62 | 550 | 0.66 | 0.03 | 1.07 | 890 |
| map-forEach | 100 | off | 2.51 | 9.16 | 3.20 | 0.58 | 1.27 | 3.64 |
| map-forEach | 1,000 | off | 26.5 | 86.9 | 30.0 | 5.53 | 1.13 | 3.28 |
| map-forEach | 10,000 | off | 264 | 869 | 296 | 54.4 | 1.12 | 3.29 |
| shift-and-update | 100 | off | 1.56 | 83.2 | 70.2 | 0.07 | 44.90 | 53.22 |
| shift-and-update | 1,000 | off | 2.90 | 805 | 680 | 0.32 | 235 | 278 |
| shift-and-update | 10,000 | off | 15.8 | 9,570 | 8,780 | 1.40 | 557 | 607 |
| shift-and-update | 100 | on | 4.83 | 85.5 | 78.8 | — | 16.29 | 17.68 |
| shift-and-update | 1,000 | on | 32.3 | 823 | 750 | — | 23.20 | 25.47 |
| shift-and-update | 10,000 | on | 300 | 9,676 | 9,320 | — | 31.08 | 32.27 |
| map-set-beside | 100 | off | 8.75 | 16.8 | 22.4 | 4.29 | 2.56 | 1.92 |
| map-set-beside | 1,000 | off | 44.7 | 113 | 167 | 42.4 | 3.74 | 2.54 |
| map-set-beside | 10,000 | off | 571 | 1,502 | 1,970 | 589 | 3.45 | 2.63 |
| map-set-beside | 100 | on | 11.9 | 37.8 | 29.1 | — | 2.43 | 3.16 |
| map-set-beside | 1,000 | on | 65.8 | 309 | 202 | — | 3.08 | 4.71 |
| map-set-beside | 10,000 | on | 770 | 3,474 | 2,312 | — | 3.00 | 4.51 |

- `set-read` checks whether a Set of numbers holds its middle number and a missing one, and reads its size. Mutative 1.3.0 mapped every item of a Set draft as soon as the recipe read the Set, and copied the Set when a lookup missed; the candidate does neither until the recipe changes the Set (PR #183), as Immer does. Both took 0.6–0.7 µs at every size, and 3 of the 12 cells against Immer are within 5%.
- `map-forEach` sums a Map of numbers with `forEach()`. Mutative 1.3.0 called `get()` through the draft's proxy for each entry; the candidate reads each entry from the draft's state (PR #184), which takes 0.3 of the time, and 0.8–0.9 of Immer's. The hand-written reducer's native `forEach()` took a fifth of the candidate's time.
- `shift-and-update` removes the first row with `shift()` and updates the middle row. The candidate moves the rows natively on its copy and finds the moved row's original index by searching the original array from its end (PR #183), while Immer and Mutative 1.3.0 move every row through the draft's proxy. With Immer's array-method plugin, the candidate was faster in every cell, 1.1–24 times. With auto-freeze, finding the moved row takes longer; see the limits below.
- `map-set-beside` inserts a row into a Map of rows and a number into a Set of numbers, which copies both, and then updates a number beside them in nine more producers. Without auto-freeze the copies dominate in every library: at 10,000 rows the candidate was within 5% of the hand-written reducer. With auto-freeze, Mutative 1.3.0 walked both copies again in each later producer, since it froze Map and Set instances only by replacing their mutators; the candidate freezes the instances themselves (PR #184), so the later producers skip them, as Immer's do.

Each scenario detects the loss of the improvement it covers. Built from the commit that made each improvement and from the commit before it, with Mutative alone in three alternating processes at 1,000 rows, the earlier build took 62–65 times as long in `set-read` in every mode (39.7 µs against 0.62 µs without freezing or patches), 3.5 times in `map-forEach` (91.9 µs against 25.9 µs), 11 times in `shift-and-update` without freezing or patches (32.7 µs against 2.94 µs) and 1.5 times with freezing alone, and 2.0–2.3 times in `map-set-beside` with auto-freeze (311 µs against 135 µs without patches). The CI budgets fail a cell at 1.30 times.

### Selected times

Microseconds per complete scenario, medians of three runs.

| Scenario | Rows | Freeze | Patches | Mutative | Mutative 1.3.0 | Immer | Hand-written | Immer/Mutative |
| --- | ---: | --- | --- | ---: | ---: | ---: | ---: | ---: |
| small-object-update | 100 | off | off | 0.51 | 0.81 | 0.69 | 0.02 | 1.35 |
| read-index | 100 | off | off | 45.6 | 61.6 | 86.7 | 0.14 | 1.90 |
| rtkq-sequence | 100 | off | off | 1,012 | 1,846 | 1,173 | 352 | 1.16 |
| sortById-reverse | 100 | off | off | 52.5 | 92.7 | 69.3 | 1.20 | 1.32 |
| array-shift-nested | 100 | off | off | 0.73 | 79.7 | 69.2 | 0.05 | 94.23 |
| update-largeObject1 | 100 | off | off | 51.5 | 51.4 | 149 | 127 | 2.90 |
| update-largeObject1 | 100 | on | off | 141 | 129 | 231 | — | 1.64 |
| object-update | 100 | off | off | 3.14 | 6.04 | 3.45 | 2.14 | 1.10 |
| map-update | 100 | off | off | 4.55 | 5.19 | 4.90 | 3.64 | 1.07 |
| set-update | 100 | off | off | 3.33 | 8.94 | 41.6 | 2.14 | 12.50 |
| class-update | 100 | on | off | 3.90 | 5.25 | 9.30 | — | 2.39 |
| apply-array-ops | 100 | off | off | 3.00 | 115 | 99.8 | — | 33.27 |
| return-filter | 100 | off | off | 24.0 | 26.3 | 32.8 | 0.19 | 1.37 |
| search-current | 100 | off | off | 12.2 | 43.3 | 232 | 0.14 | 19.08 |
| array-splice-insert-nested | 1,000 | off | off | 4.93 | 393 | 355 | 2.04 | 72.10 |
| object-update | 1,000 | off | off | 50.9 | 51.2 | 129 | 125 | 2.53 |
| class-wide-update | 1,000 | on | off | 415 | 410 | 237 | — | 0.57 |
| map-update | 1,000 | off | off | 39.9 | 40.3 | 40.2 | 38.4 | 1.01 |
| array-shift-nested | 10,000 | off | off | 7.07 | 8,184 | 7,426 | 1.41 | 1050.79 |
| array-unshift-nested | 10,000 | off | off | 15.9 | 8,573 | 7,572 | 28.4 | 476.22 |
| array-reverse-nested | 10,000 | off | off | 13.8 | 8,504 | 7,577 | 9.70 | 550.42 |
| array-reverse-nested | 10,000 | off | on | 1,073 | 276,034 | 9,525 | — | 8.88 |
| read-index | 10,000 | off | off | 4,766 | 6,465 | 11,933 | 54.8 | 2.50 |
| set-update | 10,000 | off | off | 533 | 1,036 | 6,014 | 406 | 11.28 |
| object-update | 10,000 | off | off | 1,199 | 1,195 | 2,102 | 2,091 | 1.75 |
| apply-reverse | 10,000 | off | off | 9,928 | 13,892 | 13,865 | — | 1.40 |
| push-and-insert | 10,000 | off | on | 63.0 | 210 | 364 | — | 5.78 |
| return-replace | 10,000 | on | off | 0.53 | 2,626 | 0.79 | — | 1.48 |
| search-current-shifted | 10,000 | off | off | 257 | 15,961 | 11,379 | 23.4 | 44.25 |

### Against a hand-written reducer

The hand-written reducer is faster than the candidate in 129 of 150 cells, and across all 150 the candidate takes 8.3 times as long on geometric mean: the reducer copies only what each update changes and has no draft to create, track, or finalize. The candidate is faster in 18 cells. Fifteen copy wide objects: objects with 1,000 and 3,000 properties, records with 1,000 or 10,000 keys, and class instances with 100 or more fields, by 1.5–2.8 times. One inserts at the front of an array of 10,000 rows, where the reducer's spread copies every element and `unshift` runs natively on the draft's copy: 15.9 µs against 28.4 µs; at 100 and 1,000 rows the reducer was faster. Two add a number to a Set of 1,000 or 10,000 numbers, which the candidate copies with `Set.prototype.difference`, faster than the reducer's `new Set()`: 1.29 µs against 4.06 µs and 30.9 µs against 63.2 µs; at 100 numbers the reducer was faster, 0.44 µs against 0.69 µs. Copying a Map of 1,000 or 10,000 entries dominates `map-update` in both, which are within 5%, and so does copying a Map and a Set of 10,000 entries in `map-set-beside`. The hand-written reducer is the same spread-based code that validates every scenario; faster hand-written code exists for many of them.

### Shared and isolated processes

Batches before the previous one ran every scenario except the wide-object ones with all four libraries together, in one process per run and a second one for the Map and Set scenarios. This batch measured every cell both ways, and in a process of its own every library was faster, by different amounts. Over all 614 cells, the shared-process times were longer on geometric mean by 1.09 times for the candidate, 1.14 times for Mutative 1.3.0 and 1.15 times for Immer, and over the 150 cells of the hand-written reducer by 1.64 times; at the 95th percentile by 1.31, 1.39, 1.77 and 5.53 times. In a shared process the recipes, the hand-written reducer and the libraries handle the objects of every scenario, so V8 optimizes them for many object shapes at once; in a process of its own each handles the shapes of one scenario. Small code gains the most: the hand-written reducer summed 100 rows in 0.14 µs alone and in 0.71 µs beside the others. Immer gained more than the candidate, most of all in Set updates: adding a number to a 100-item Set took Immer 5.85 µs alone and 13.9 µs beside the others, and the candidate 0.69 µs and 0.79 µs.

| Comparator | All in shared processes | Isolated processes |
| --- | ---: | ---: |
| Immer 11.1.18 | 603 / 11 / 0 of 614, 3.79 | 596 / 16 / 2 of 614, 3.58 |
| Immer 11.1.18 with its defaults | 154 / 0 / 3 of 157, 6.82 | 154 / 0 / 3 of 157, 6.62 |
| Pinned npm Mutative 1.3.0 | 570 / 40 / 4 of 614, 4.48 | 538 / 73 / 3 of 614, 4.27 |
| Hand-written reducer | 19 / 2 / 129 of 150, 0.18 | 18 / 3 / 129 of 150, 0.12 |

Most of the difference against Immer lies at 100 rows (3.25 shared, 3.04 isolated); at 1,000 and 10,000 rows the geometric means are 4.87 and 4.67. The isolated processes give the more even comparison between libraries, and every result above uses them. Each one measures a workload alone, as a microbenchmark does; in an application, the application's own code shares V8's state as the other libraries did here.

Inserting a property into the 1,000-property object also depended on the order of the code that ran before it in a shared process. With libraries in alternating orders in six processes, the hand-written reducer took 1.66–1.69 µs when it ran after the libraries and 124–130 µs when it ran first; Immer 2.68–2.77 µs after the hand-written reducer and 146–148 µs after Mutative; the candidate 50.9–54.7 µs first and 94.2–98.1 µs after the others. In processes of their own the candidate took 51.5 µs, Mutative 1.3.0 51.4 µs, Immer 149 µs, and the hand-written reducer 127 µs. A separate effect made the first timed run of a scenario in a process slower: updating a 100-key record took 12–15 µs in every library there and 3–4 µs afterwards. Priming each benchmark removed it.

### Memory

Sampled allocation of the candidate was below Mutative 1.3.0 in 109 of 114 memory cells. The exceptions are `map-update` at 100 and 1,000 entries in three modes, by 0.7–1.6%, `object-update` at 10,000 keys with patches, by 0.1%, and `map-update` at 10,000 entries with auto-freeze and patches, by 28% (3.7 MiB against 2.9 MiB); with auto-freeze and without patches, the candidate allocated 2.9 MiB against 3.1 MiB, and the time of both cells equals that of 1.3.0 (704 µs against 705 µs and 712 µs). It was below Immer in 80 of 114 cells: lower for reads, array moves, Set additions, returned filters, and patch application; higher for Map drafts (up to 2.4 times), the push-and-insert fixture (1.1–2.6 times), the 1,000-key record (113 against 16 KiB), and by a few KiB for no-op, small-object, record, and class-instance producers. Objects with more than 128 keys are copied into dictionary-mode objects, which also retain 48 KiB per output at 1,000 keys, against 8 KiB for the other libraries.

| Scenario | Rows | Patches | Candidate | Mutative 1.3.0 | Immer | Hand-written |
| --- | ---: | --- | ---: | ---: | ---: | ---: |
| read-index | 100 | off | 98.4 | 150.5 | 194.9 | 1.8 |
| push-and-insert | 100 | off | 114.8 | 1,365.0 | 65.6 | 19.2 |
| object-update | 1,000 | off | 113.2 | 1,312.2 | 16.3 | 11.0 |
| set-add | 10,000 | off | 330.2 | 2,882.6 | 1,613.6 | 325.5 |
| array-reverse-nested | 10,000 | off | 87.9 | 11,090.0 | 12,807.4 | 83.8 |
| array-reverse-nested | 10,000 | on | 3,020.3 | 268,357.3 | 15,068.1 | — |

Sampled KiB allocated per iteration with freeze off, medians of three isolated workers. With patches, nested reverse at 10,000 rows retains about 1,797 KiB per output, against 9,891 KiB for Mutative 1.3.0 and 1,797 KiB for Immer.

### Immer with `enableArrayMethods`

The plugin datasets rerun the array-related scenarios with Immer's array-method plugin enabled, measuring only the candidate and Immer (`--library both --immer-array-methods`), each in processes of its own: 52 scenarios at 100 rows and 16 at 1,000 and 10,000 rows, in both freeze and patch modes. All 656 combinations pass the correctness checks. These scenarios only read in their callbacks, so the plugin's documented behavior, raw objects handed to callbacks and returned from removals, does not change their results; [`test/immer-array-methods.md`](../../test/immer-array-methods.md) records the failures it causes when they write. The [freeze-off, patches-on section](#why-immers-array-method-plugin-is-not-the-main-comparator) explains why the main comparison leaves the plugin off.

| Comparator | Faster / within 5% / slower | Geometric mean Immer/candidate |
| --- | ---: | ---: |
| Immer 11.1.18 with `enableArrayMethods`, all plugin cells | 265 / 6 / 57 of 328 | 1.87 |
| Array-method scenarios only | 158 / 1 / 13 of 172 | 2.35 |

| Scenario | Rows | Freeze | Patches | Candidate | Immer + plugin | Immer/candidate |
| --- | ---: | --- | --- | ---: | ---: | ---: |
| array-shift-nested | 10,000 | off | off | 7.10 | 385 | 54.24 |
| array-shift-nested | 10,000 | off | on | 1,067 | 1,390 | 1.30 |
| array-shift-nested | 10,000 | on | off | 185 | 1,129 | 6.11 |
| array-reverse-nested | 10,000 | off | off | 13.8 | 396 | 28.77 |
| array-reverse-nested | 10,000 | off | on | 1,077 | 1,381 | 1.28 |
| array-splice-insert-nested | 10,000 | off | off | 20.9 | 409 | 19.57 |
| array-reverse-primitive | 10,000 | off | off | 13.7 | 373 | 27.21 |
| array-shift-nested | 1,000 | off | on | 109 | 124 | 1.14 |
| array-shift-nested | 100 | off | off | 0.74 | 2.51 | 3.38 |
| array-push-primitive | 100 | off | off | 1.07 | 0.78 | 0.73 |
| array-sort-nested | 100 | off | off | 90.4 | 8.54 | 0.09 |
| search-draft | 10,000 | off | off | 2,190 | 91.1 | 0.04 |
| read-missing | 10,000 | off | off | 2,026 | 69.2 | 0.03 |

Immer with the plugin is faster in 57 cells. Most are scenarios where the plugin hands raw base elements to a callback or comparator, which Mutative never does: `find` in `read-missing` (25–29 times at 1,000 and 10,000 rows), `findIndex` in `remove-high`, `remove-high-reuse` and `search-draft` (up to 24 times at 10,000 rows), `filter` in `filter` and `return-filter`, and sorts of objects in `sortById-reverse`, `array-sort-shallow` and `array-sort-nested`. The others are `push` and `pop` on 100 rows with freeze and patches off, which Mutative leaves on the proxy path: 1.1–1.3 µs against 0.7–1.0 µs, and `add`, which pushes a row. Every `shift`, `unshift`, `splice` and `reverse` cell is faster than Immer with the plugin; at 10,000 rows by 20–54 times with freeze and patches off, 5.7–11 times with freeze on, and 1.3–2.1 times with patches on. So is every cell of `shift-and-update`, by 1.1–24 times.

### Paired performance budget

The local budget gate compared the current build with itself at 1,000 rows, since this batch changes no Mutative source file. All 222 decisions of the five budget groups passed: five latency pairs and three memory pairs per cell, both freeze and patch modes. The latency ratios of the fastest processes spanned 0.875–1.189; above 1.10 were only `search-current-shifted` with patches (1.19 with and without freezing) and `push-and-insert` with freeze on (1.18 with patches, 1.10 without), below the 1.30 budget. The medians of the paired ratios spanned 0.977–1.061 for sampled allocation and 1.000–1.039 for retained heap.

### Changes since the previous batch

This comparison uses the cells that the previous summary published: the batch of October 6 and 7, with the Set and patch application cells that PRs #195 and #196 measured again on October 9 and the cells that PR #198 added the same day. Over all 614 cells, the candidate's time changed by less than 1% on geometric mean (previous/current time 1.004), as did those of Immer (1.008), Mutative 1.3.0 (1.007) and the hand-written reducer (1.003), whose code did not change; the drift between the sessions is of that size. The process means of most cells are steady enough that such a drift separates them: in 98 cells every process of this batch was faster than every process of the previous measurement and in 37 slower, 128 of the 135 by less than 3%, and the cells of Immer and Mutative 1.3.0 separated as often, 123 and 17 times and 121 and 13 times.

The source changes since `2ab58fc` outside the cells that PRs #195 and #196 measured again are the fixes of PRs #190 and #192. Among the candidate's cells that moved by more than 10%, only `add` with freeze on at 100 rows was slower in every process: 19.5 µs against 15.9 µs without patches. Ten alternating rounds of benchmark bundles built from `2ab58fc` and `ce0c25e`, with Mutative alone in each process, measured 18.9 µs against 19.4 µs with overlapping ranges, and 1.52 µs for both without freezing, so those fixes did not slow it; with freeze on, the processes of this cell varied by up to 1.3 times in both batches. `concat`, `remove` and `update` with freeze on at 100 rows measured 10–19% faster, with processes that overlapped those of the previous batch, and `set-add` at 10,000 items without freezing or patches took 30.9 µs instead of 34.1 µs in every process, with the same Set code that PR #195 measured.

## Tradeoffs and limits

- Returned values: without auto-freeze, the candidate searches every object of a returned value for drafts, as Immer does: `return-replace` took 2.61 ms at 10,000 rows, against 5.73 ms for Immer without auto-freeze. Immer's default auto-freeze skips frozen values (0.79 µs), and so do production builds of the candidate with auto-freeze (0.53 µs). Wrapping the value in `rawReturn()` skips the search (0.26 µs).
- A Set draft copies the Set on its first change and rebuilds it in order once an item that the recipe read through an iterator changed: `set-update` took 533 µs at 10,000 items, against 406 µs for the hand-written reducer, which copies the Set once. With patches, a Set that added or deleted items compares every original item with its copy and every item of the copy with the original: `set-add` took 444 µs with patches at 10,000 items, against 30.9 µs without. Copying the Map dominates `map-update` at 10,000 entries in every library, about 525 µs.
- With auto-freeze, updating a row that `shift()` moved costs more than the move: `shift-and-update` took 300 µs at 10,000 rows, against 189 µs for `array-shift-nested`, which only removes the row, while without auto-freeze they took 15.8 µs and 7.07 µs. The candidate finds the moved row's original index with `lastIndexOf` on the original array, which is frozen then, and V8 runs `lastIndexOf` on a frozen array about 15 times as slowly: 116 µs against 7.9 µs to find an element in the middle of 10,000, while `indexOf` takes 1.1 µs on both.
- With auto-freeze, Immer updated a class instance with 1,000 fields faster: 237 µs against 415 µs. Without freezing the candidate is faster, 99.7 µs against 205 µs, so the difference lies in freezing the candidate's copy, which it makes property by property with descriptors where Immer 11 uses `Object.assign`.
- Even in processes of their own, some cells varied between processes of the same build by up to about 1.6 times, for example `update-reuse` with freeze and patches on (170–240 µs) and Immer's `map-read` at 10,000 rows (5.1–8.0 ms); `class-wide-update` without freezing at 1,000 rows took either about 95 µs or about 200 µs in both Mutative builds. The freeze-on upstream workloads at 100 rows vary most among the candidate's cells, which is why `add` and `update-largeObject1` with freeze on are slower than Mutative 1.3.0 in this batch. Medians of three processes absorb one outlier, not two; compare such cells through geometric means rather than one by one.
- Isolated processes measure each library without the other libraries and scenarios, not inside a real application, whose own code also changes V8's state; wide-object timings in particular depend on it, by up to about 70 times.
- Freeze-on inputs are already frozen, so freezing cold external data is excluded. Allocation is sampled, and small retained deltas are noisy. All measurements come from one machine and Node.js; browser engines may differ.
- Bundle size: as the README measures it with esbuild 0.24.0, importing only `create` bundles to 7.8 kB with Brotli against 3.6 kB for Immer's `produce`, and with patches, Map and Set support and array methods to 8.4 kB against 6.4 kB for Immer with its plugins. `size-limit` measures the production CJS artifact at 8.56 kB against its 8.6 kB cap (8,367 Brotli bytes), and the ESM consumers of `create` and of all exports at 7.5 kB and 8.41 kB against 7.5 kB and 8.5 kB.

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

The measured source is that of [`ce0c25e`](https://github.com/unadlib/mutative/commit/ce0c25e9f1efb43e735ad4d2abe0e03ce29b1161), with the harness of the same commit. Every dataset reports the same source and production hashes. The production artifact is the one that PR #196 measured, since PRs #197 and #198 changed no source file.

SHA-256 identities (`source` uses the sorted path/content algorithm in [`build.mjs`](../build.mjs); `production` is `dist/mutative.cjs.production.min.js`):

```text
Candidate source:     763c08619d0a1892c3dfd9e4cbbc165763fcd71eb263481d2ca793deae09c5ff
Candidate production: bd8ff3a63a6007bb800f8782985e6156c57aac1bbd0c8f7251708e863c2c19c9
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

The comparison of `add` in [changes since the previous batch](#changes-since-the-previous-batch) built `2ab58fc`, whose production artifact (`f210318a…`) is the one the previous batch measured, and `ce0c25e`. The comparison of each scenario of PR #198 with the commit before the improvement it covers built `538b7ae` and `715a41f` for `set-read`, `bad9902` and `13460fb` for `shift-and-update`, `00d4829` and `2168780` for `map-set-beside`, and `0bf2740` and `ce20399` for `map-forEach`.

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

The comparison of `add` in [changes since the previous batch](#changes-since-the-previous-batch) and that of each scenario of PR #198 with the commit before the improvement it covers build each source in a checkout of its own and run the resulting bundles with Mutative alone, in alternating order: ten rounds for `add`, three for each scenario of PR #198 at 1,000 rows.

```sh
# For each source, from a built checkout of it at $CHECKOUT:
MUTATIVE_PERF_CANDIDATE_DIR="$CHECKOUT" MUTATIVE_PERF_BUILD_DIR="perf-testing/dist/$NAME" node perf-testing/build.mjs
MUTATIVE_PERF_BUNDLE="perf-testing/dist/$NAME/immutability-benchmarks.mjs" node perf-testing/run-benchmarks.mjs --library mutative --runs 1 --freeze both --patches both --filter '^add$'
MUTATIVE_PERF_BUNDLE="perf-testing/dist/$NAME/immutability-benchmarks.mjs" node perf-testing/run-benchmarks.mjs --library mutative --runs 1 --array-size 1000 --freeze both --patches both --filter '^set-read$'
```

## History

Earlier versions of this summary, in Git history, describe each round in detail. Cell counts compare the candidate with the named comparator: faster, within 5%, and slower.

- 2026-10-09, PR #198: the scenarios `set-read`, `map-forEach`, `shift-and-update` and `map-set-beside` cover improvements of PRs #183 and #184 that only micro-benchmarks had measured, and CI budgets them. Measured with every library in processes of its own at 100, 1,000 and 10,000 rows, their cells join the results: 595 / 16 / 3 of 614 against Immer (geometric mean 3.59), 153 / 1 / 3 of 157 with each library's defaults (6.66), 543 / 70 / 1 against 1.3.0 (4.28), and 18 / 3 / 129 against the hand-written reducer. Built from the commit before the improvement it covers, each scenario took at least 2.3 times as long in one or more modes, and `set-read` 62–65 times as long in every mode.
- 2026-10-09, PR #196: `apply()` reads the type of each draft on a patch path from its state instead of asking its proxy twice per step. Against `main` at `4ca6345`, Mutative alone, the PR took 0.68 of the time over 14 patch application cells, and `apply-update-10pct` 0.49–0.61 of it. The patch application scenarios, measured again with every library in processes of its own, replace the earlier cells: 551 / 12 / 3 of 566 against Immer (geometric mean 3.66), 142 / 0 / 3 of 145 with each library's defaults (6.76), and 495 / 70 / 1 against 1.3.0 (3.88). The production CJS artifact grew from 8,334 to 8,367 Brotli bytes.
- 2026-10-09, PR #195: Set drafts add and delete items in their copy, map only the items that drafts stand for and are rebuilt once, by their own producer, drafts of Set subclasses keep their items in order, and a Set draft that left its key keeps its changes, which 1.3.0 also lost. Against `main` at `e6af4b0`, Mutative alone, the PR took 0.28 of the time over 32 Set cells; `set-add` at 10,000 items took 33.2 µs instead of 987 µs. The Set scenarios, measured again with every library in processes of its own, replace the earlier cells: 548 / 12 / 6 of 566 against Immer (geometric mean 3.62), 142 / 0 / 3 of 145 with each library's defaults (6.62), 495 / 70 / 1 against 1.3.0 (3.84), and 18 / 2 / 118 against the hand-written reducer. The production CJS artifact grew from 8,201 to 8,334 Brotli bytes.
- 2026-10-06 and 2026-10-07, the source of `main` at `2ab58fc`, 93 scenarios with every library in processes of its own for the first time: 536 / 21 / 9 of 566 cells against Immer (geometric mean 3.37), 141 / 1 / 3 of 145 with each library's defaults (5.98), 470 / 95 / 1 against 1.3.0 (3.57), and 16 / 2 / 120 of 138 against the hand-written reducer; in shared processes the same cells gave 551 / 12 / 3 against Immer (3.50). Against the shared-process matrices of 2026-10-03 and 2026-10-04, the candidate's time fell by 11% on geometric mean over 530 cells. PRs #195, #196 and #198 later measured cells again or added them, as their entries describe.
- 2026-10-05, PR #184 review fixes: the fixed source at `6b08f57` against `main` at `ba8d0cd`, Mutative only, all 93 scenarios at 100 rows in both freeze and patch modes, three runs each: fixed/main geometric mean 0.982 over 366 cells, 42 cells more than 5% faster and 6 more than 5% slower; the slower wide-object cells measured 0.77–1.02 in isolated processes. Map iteration with the iterator lifetime checks took 1–2.4% longer than without them and about 70% less than `main` for primitive entries. An update beside an unchanged frozen 10,000-entry Map or Set took 0.44 µs instead of 66.7 µs and 26.1 µs. The production CJS artifact grew from 8,079 to 8,106 Brotli bytes.
- 2026-10-04, PR #180 at `e70aeed`: `current()` copies changed array drafts from their current array and leaves moved base elements as they are, and strict mode warns once in development builds when a recipe leaves 1,000 or more drafts unchanged. The three `search-*` scenarios were added: a `current()` snapshot search at 10,000 rows took 209 µs instead of 3,262 µs, and 772 µs instead of 7,490 µs after `shift()`. Gate 48 of 48. The production CJS artifact grew from 8,031 to 8,104 Brotli bytes against `main`.
- 2026-10-03 and 2026-10-04, the source of `main` at `e6b6563` with the harness of PR #177, 90 scenarios at 100 rows and 23 at 1,000 and 10,000, in shared processes except for the wide-object scenarios: 508 / 11 / 11 of 530 cells against Immer (geometric mean 3.07), 133 / 0 / 3 of 136 with each library's defaults (6.01), 417 / 111 / 2 against pinned 1.3.0 (3.16), and 18 / 2 / 109 of 129 against the hand-written reducer (0.17). Immer was faster in `return-replace` with freeze on (2.9 ms against 0.9 µs at 10,000 rows), `apply-update-10pct` and `class-wide-update` with freeze on at 1,000 rows. With Immer's `enableArrayMethods`, 229 / 5 / 46 of 280 cells (1.63). Allocation below 1.3.0 in 104 of 114 memory cells; gate 48 of 48.
- 2026-10-03, PR #75 at `363b3da`, 67 scenarios: 339 / 1 / 0 of 340 cells against Immer with the plugin off (geometric mean 3.77; 6.21 over the array cells, 1.58 elsewhere), 335 / 4 / 1 against pinned 1.3.0 (5.48), 140 / 191 / 9 against the PR #174 archive (2.24). With Immer's `enableArrayMethods`, 211 / 1 / 36 cells (1.68). Allocation below 1.3.0 in 55 of 56 memory cells; gate 48 of 48. Three review rounds followed before the merge: search results that match the proxy path (`f85df41`), strict-mode calls on the proxy path and no element inspection the proxy path does not make (`06d9d6e`–`6e74707`), and release of the receiver cache when a producer ends (`8fe0d9a`). Harness A/B comparisons put each round within 2% of the previous source, except a search that meets an unread base object, which now checks the array for holes (about 9 µs at 10,000 rows). Between `363b3da` and the merge, the size baseline of the production CJS artifact grew from 7,799 to 8,041 Brotli bytes, and its `size-limit` cap rose from 6.5 kB to 6.7 kB.
- 2026-10-02, PR #75 at `6193657`: 340 / 0 / 0 cells against Immer (3.78), 335 / 5 / 0 against pinned 1.3.0 (5.50). That source excluded arrays holding `undefined` from the native path and matched a draft's original object in searches; the contract above replaced both.
- 2026-10-02 and 2026-10-03, local commits `c598b41`–`a1e3235` and `689c181`–`1ba1615` (never pushed or superseded): eligibility checks through property descriptors made 10,000-row moves slower than Immer with its plugin, and a per-element `in` scan and a WeakSet entry per array added 0.2–0.9 µs to 100-row operations. `473c149` and `6ce062b` removed both costs.
- 2026-10-01, PR #174 (draft fast paths) and 2026-09-30 baseline: see the [archive index](./README.md).
