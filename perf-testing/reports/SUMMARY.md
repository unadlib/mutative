# Performance summary

Measurements from 2026-10-03 and 2026-10-04 UTC of the source of `main` at [`e6b6563`](https://github.com/unadlib/mutative/commit/e6b6563b821305b8ee0d63c42a62cea752cc04f0), which includes the draft fast paths of [PR #174](https://github.com/unadlib/mutative/pull/174), the Set and assignment fixes of [PR #176](https://github.com/unadlib/mutative/pull/176), and the native array methods of [PR #75](https://github.com/unadlib/mutative/pull/75). The candidate and the pinned npm baseline both report Mutative 1.3.0. Immer is pinned to 11.1.18 and Mitata to 1.0.34. The main comparison runs Immer without its array-method plugin; a separate dataset below enables `enableArrayMethods`. The raw datasets of this batch were not archived; the identities and commands below reproduce them, and the [archive index](./README.md) describes the retention policy for batches that are.

This batch replaces the repository's former benchmark scripts with this suite. It adds 23 scenarios, a hand-written reducer as a fourth library, isolated processes for wide objects, and a priming run before each benchmark, so its numbers are not directly comparable with earlier summaries.

## Scope and method

Apple M1 Max, 64 GiB RAM, darwin/arm64 (kernel 25.6.0), Node 24.16.0, V8 13.6.233.17-node.49. Jobs ran sequentially with normal desktop activity.

- **Workloads.** 90 scenarios at 100 rows: the 67 of the previous summary and 23 added with this batch, for Map and Set values, object records, class instances, a deep path, a combined push and insert, patch application, and returned values. Of them, 23 also ran at 1,000 and 10,000 rows. The [benchmark guide](../README.md#workloads-and-units) describes each one.
- **Libraries.** The current source, pinned npm Mutative 1.3.0, Immer 11.1.18, and the hand-written reducer that is every scenario's reference result. Each library runs both freeze modes and both patch modes, except that the hand-written reducer runs only without either, and patch application only without patch generation.
- **Timing.** Three runs of each matrix. Map and Set scenarios run in processes of their own, so that the others measure Immer without its MapSet plugin. Each benchmark first runs its workload for 30 ms on a throwaway fixture. The timing datasets hold 5,922 trials from 252 processes.
- **Isolation.** Copying objects with hundreds of properties took up to about 70 times as long, depending on the V8 object shapes that earlier code in the process left behind. The 11 wide-object and record scenarios at 100 rows and 4 at 1,000 and 10,000 rows were therefore also measured with each scenario and library in a process of its own (`--isolate`), and those results replace the shared-process cells in every comparison below.
- **Memory.** 1,110 isolated workers for 13 scenarios at 100 rows and 8 at 1,000 and 10,000 rows.

Each timing cell is one scenario, size, and mode. A candidate time below 95% of the comparator's counts as faster, above 105% as slower, and otherwise as within 5%. Geometric means are comparator time over candidate time, so values above 1 favor the candidate. Scenario counts are not an application-weighted score.

## Results

### Against Immer and Mutative 1.3.0

Cells faster / within 5% / slower, and the geometric mean of comparator time over candidate time. The Immer defaults row compares the candidate without auto-freeze with Immer with it, both without patches.

| Comparator | 100 rows | 1,000 and 10,000 rows | All |
| --- | ---: | ---: | ---: |
| Immer 11.1.18 | 344 / 7 / 3 of 354, 2.89 | 164 / 4 / 8 of 176, 3.48 | 508 / 11 / 11 of 530, 3.07 |
| Immer 11.1.18 with its defaults | 89 / 0 / 1 of 90, 6.06 | 44 / 0 / 2 of 46, 5.91 | 133 / 0 / 3 of 136, 6.01 |
| Pinned npm Mutative 1.3.0 | 303 / 51 / 0 of 354, 3.08 | 114 / 60 / 2 of 176, 3.33 | 417 / 111 / 2 of 530, 3.16 |
| Hand-written reducer | 8 / 0 / 79 of 87, 0.18 | 10 / 2 / 30 of 42, 0.16 | 18 / 2 / 109 of 129, 0.17 |

Against Immer by workload group, faster / within 5% / slower and geometric mean:

| Group | 100 rows | 1,000 rows | 10,000 rows |
| --- | ---: | ---: | ---: |
| Upstream workloads | 84 / 0 / 0, 2.09 | — | — |
| Reads | 20 / 0 / 0, 1.86 | 12 / 0 / 0, 1.81 | 12 / 0 / 0, 1.91 |
| No-op producers | 7 / 1 / 0, 1.61 | — | — |
| Small state | 12 / 0 / 0, 1.68 | — | — |
| Mutation density | 12 / 0 / 0, 1.96 | 4 / 0 / 0, 1.85 | 4 / 0 / 0, 1.84 |
| Array methods | 132 / 0 / 0, 5.86 | 20 / 0 / 0, 22.94 | 20 / 0 / 0, 30.56 |
| Map and Set | 34 / 2 / 0, 1.82 | 16 / 0 / 0, 2.25 | 14 / 2 / 0, 1.78 |
| Object records | 11 / 1 / 0, 1.17 | 8 / 0 / 0, 2.33 | 8 / 0 / 0, 1.59 |
| Class instances | 6 / 2 / 0, 1.63 | 6 / 0 / 2, 1.54 | 6 / 2 / 0, 1.55 |
| Deep path | 3 / 1 / 0, 1.17 | — | — |
| Push and insert | 8 / 0 / 0, 1.92 | 4 / 0 / 0, 2.30 | 4 / 0 / 0, 3.21 |
| Patch application | 5 / 0 / 1, 2.82 | 3 / 0 / 1, 1.18 | 3 / 0 / 1, 1.17 |
| Returned values | 10 / 0 / 2, 2.35 | 10 / 0 / 2, 2.24 | 10 / 0 / 2, 2.33 |

The 11 cells slower than Immer are `return-replace` with freeze on at every size (30 µs, 291 µs and 2.9 ms against 0.9 µs; see the limits below), `apply-update-10pct` with freeze off (0.94–0.95), and `class-wide-update` with freeze on at 1,000 rows (419 µs against 241 µs). The 2 cells slower than Mutative 1.3.0 are `object-delete` with freeze on at 1,000 rows, 119 µs against 104–105 µs.

### Large arrays

Against Immer without its array-method plugin, by size and mode, over the 23 scaling scenarios: cells faster / within 5% / slower, and geometric means of Immer time over candidate time. The moves are `array-shift-nested`, `array-unshift-nested`, `array-splice-insert-nested`, `array-reverse-nested` and `array-reverse-primitive`.

| Rows | Freeze | Patches | All scenarios | Geometric mean | Moves, geometric mean | Moves, range |
| ---: | --- | --- | ---: | ---: | ---: | ---: |
| 1,000 | off | off | 22 / 0 / 1 | 7.32 | 212 | 70.4–461 |
| 1,000 | off | on | 21 / 0 / 0 | 3.88 | 6.7 | 6.4–6.8 |
| 1,000 | on | off | 21 / 0 / 2 | 2.57 | 31.8 | 17.9–47.6 |
| 1,000 | on | on | 19 / 0 / 2 | 1.87 | 6.2 | 6.0–6.3 |
| 10,000 | off | off | 21 / 1 / 1 | 8.83 | 472 | 180–1,125 |
| 10,000 | off | on | 20 / 1 / 0 | 4.22 | 7.7 | 6.7–8.3 |
| 10,000 | on | off | 21 / 1 / 1 | 2.31 | 35.1 | 19.1–52.3 |
| 10,000 | on | on | 19 / 1 / 1 | 1.68 | 6.8 | 6.5–7.4 |

Immer time over candidate time for the moves at 10,000 rows, by freeze and patch mode:

| Scenario | Off, off | Off, on | On, off | On, on |
| --- | ---: | ---: | ---: | ---: |
| array-shift-nested | 1,125 | 8.2 | 39.0 | 7.0 |
| array-unshift-nested | 507 | 7.6 | 37.6 | 6.7 |
| array-splice-insert-nested | 180 | 7.8 | 19.1 | 6.5 |
| array-reverse-nested | 597 | 8.3 | 36.4 | 7.4 |
| array-reverse-primitive | 383 | 6.7 | 52.3 | 6.6 |

The gap widens with size. With freeze and patches off, the moves were 212 times faster at 1,000 rows and 472 times at 10,000 on geometric mean: the candidate moves elements natively on its copy, while Immer moves each element through its draft proxy. Removing the first of 10,000 rows took 7.37 µs against 8,292 µs. With patches, both libraries emit one patch per moved index, which bounds the gain to 6–8 times. At these sizes Immer was faster in `return-replace` with freeze on, `apply-update-10pct`, and `class-wide-update` with freeze on at 1,000 rows, and within 5% in `class-wide-update` with freeze on and `map-update` at 10,000 rows; the limits below discuss each.

### Freeze off, patches on

With patches on and freeze off, the candidate was faster than Immer in 126 of 129 cells, within 5% in 3, and never slower (geometric mean 3.07); it was faster than Mutative 1.3.0 in 103 and within 5% in 26 (3.70). In the 58 array-related cells, array methods and the upstream array workloads at every size, it was faster than both in every cell: 3.98 times Immer and 13.13 times Mutative 1.3.0 on geometric mean.

Patches cost little when an update changes a few paths. They added a median 3% to the candidate's time at 1,000 and 10,000 rows and 29% at 100 rows. The former `benchmark:base` workload, `push-and-insert` at 10,000 rows, took 64.8 µs without patches and 65.2 µs with them; Mutative 1.3.0 went from 67.5 µs to 212 µs, and Immer from 167 µs to 370 µs. Moving elements is the exception: both libraries emit one patch per moved index, so `shift` at 10,000 rows produces 10,000 forward and 10,000 inverse patches in each. The candidate's time grows from 7.37 µs to 1,227 µs, against 10,117 µs for Immer producing the same patches.

Array methods on nested rows at 100 rows, in µs per call. The primitive and shallow shapes behave alike; over all 33 cells the candidate is 4.24 times faster than Immer (2.0–7.2) and 8.42 times faster than Mutative 1.3.0 (1.6–194).

| Operation | Candidate | Immer | Mutative 1.3.0 | Immer/candidate | 1.3.0/candidate |
| --- | ---: | ---: | ---: | ---: | ---: |
| push | 4.05 | 8.52 | 6.40 | 2.11 | 1.58 |
| pop | 1.72 | 7.02 | 4.39 | 4.08 | 2.55 |
| shift | 13.3 | 86.3 | 2,558 | 6.50 | 192.75 |
| unshift | 15.8 | 90.7 | 2,599 | 5.74 | 164.33 |
| splice, insert | 9.91 | 51.3 | 1,297 | 5.18 | 130.84 |
| splice, remove | 7.12 | 46.5 | 1,257 | 6.52 | 176.43 |
| splice, replace | 3.71 | 11.2 | 7.17 | 3.01 | 1.93 |
| fill | 4.59 | 9.58 | 7.85 | 2.09 | 1.71 |
| copyWithin | 2.80 | 6.47 | 82.0 | 2.31 | 29.26 |
| sort | 108 | 217 | 2,622 | 2.01 | 24.24 |
| reverse | 13.2 | 85.7 | 2,552 | 6.51 | 193.93 |

The array workloads of the upstream suite at 100 rows:

| Scenario | Candidate | Immer | Mutative 1.3.0 | Immer/candidate | 1.3.0/candidate |
| --- | ---: | ---: | ---: | ---: | ---: |
| add | 2.02 | 5.12 | 4.25 | 2.54 | 2.11 |
| remove | 13.5 | 86.5 | 3,108 | 6.42 | 230.78 |
| filter | 23.3 | 32.8 | 48.7 | 1.41 | 2.09 |
| concat | 1.04 | 1.22 | 1.27 | 1.17 | 1.23 |
| mapNested | 45.8 | 65.3 | 104 | 1.42 | 2.26 |
| sortById-reverse | 70.7 | 102 | 3,122 | 1.44 | 44.16 |
| reverse-array | 13.3 | 86.3 | 3,167 | 6.49 | 237.97 |
| update-multiple | 10.1 | 19.6 | 17.3 | 1.93 | 1.71 |
| remove-high | 20.9 | 57.1 | 634 | 2.73 | 30.29 |
| remove-reuse | 124 | 791 | 28,166 | 6.37 | 226.87 |
| mixed-sequence | 56.3 | 114 | 150 | 2.02 | 2.66 |

Moving elements at 1,000 and 10,000 rows, with Immer's array-method plugin from the plugin datasets for reference:

| Scenario | Rows | Candidate | Immer | Mutative 1.3.0 | Immer + plugin |
| --- | ---: | ---: | ---: | ---: | ---: |
| array-shift-nested | 1,000 | 123 | 834 | 26,568 | 130 |
| array-splice-insert-nested | 1,000 | 65.5 | 448 | 12,538 | 88.0 |
| array-reverse-nested | 1,000 | 123 | 833 | 26,701 | 131 |
| array-shift-nested | 10,000 | 1,227 | 10,117 | 282,588 | 1,471 |
| array-unshift-nested | 10,000 | 1,228 | 9,314 | 275,569 | 1,483 |
| array-splice-insert-nested | 10,000 | 632 | 4,908 | 139,836 | 1,016 |
| array-reverse-nested | 10,000 | 1,226 | 10,167 | 286,207 | 1,487 |
| array-reverse-primitive | 10,000 | 1,071 | 7,203 | 5,713 | 1,859 |

#### Why Immer's array-method plugin is not the main comparator

Immer's optional `enableArrayMethods()` also runs array methods on the draft's copy, and with patches it comes within 1.05–1.74 times of the candidate on the moves above. The comparisons nevertheless run Immer without it, because in Immer 11.1.18 the plugin breaks guarantees that its other configurations and Mutative keep. [`test/immer-array-methods.md`](../../test/immer-array-methods.md) reproduces four root causes:

- `shift`, `pop` and `splice` return raw base objects. Editing a removed object changes the previous state, or throws when that state is frozen.
- `reverse` and `sort` can expose original objects at inserted indices as raw values, with the same effect; inverse patches then restore the modified values instead of the original ones.
- After an insertion, edits to the shifted tail emit child patches before the array additions, so the forward patches cannot be replayed.
- Reordering a wrapper that holds a moved draft, or a negative `splice` index, leaves revoked drafts in the result and in patch values.

Of 4,913 three-step operation sequences, 123 violate at least one of these contracts with the plugin and none without it. The plugin also hands raw base elements to callbacks and comparators, which is why it beats the candidate in `find`, `findIndex`, `filter` and object `sort` cells: the callback reads the base without drafting it. The benchmark callbacks only read, so these results are correct with the plugin; recipes that edit removed objects or callback arguments are not.

### Selected times

Microseconds per complete scenario, medians of three runs. Rows marked * come from the isolated control.

| Scenario | Rows | Freeze | Patches | Mutative | Mutative 1.3.0 | Immer | Hand-written | Immer/Mutative |
| --- | ---: | --- | --- | ---: | ---: | ---: | ---: | ---: |
| small-object-update | 100 | off | off | 0.65 | 1.17 | 1.02 | 0.05 | 1.58 |
| read-index | 100 | off | off | 49.9 | 80.5 | 110 | 0.72 | 2.21 |
| rtkq-sequence* | 100 | off | off | 1,031 | 1,878 | 1,180 | 361 | 1.14 |
| sortById-reverse | 100 | off | off | 55.1 | 102 | 87.4 | 1.27 | 1.59 |
| array-shift-nested | 100 | off | off | 0.82 | 87.3 | 72.0 | 0.08 | 88.25 |
| update-largeObject1* | 100 | off | off | 53.0 | 52.8 | 151 | 131 | 2.85 |
| update-largeObject1* | 100 | on | off | 139 | 151 | 238 | — | 1.72 |
| object-update* | 100 | off | off | 3.18 | 6.21 | 3.53 | 2.18 | 1.11 |
| map-update | 100 | off | off | 4.71 | 5.33 | 5.17 | 3.76 | 1.10 |
| set-update | 100 | off | off | 8.74 | 9.14 | 43.5 | 2.15 | 4.97 |
| class-update | 100 | on | off | 4.42 | 5.79 | 9.64 | — | 2.18 |
| apply-array-ops | 100 | off | off | 6.87 | 131 | 105 | — | 15.28 |
| return-filter | 100 | off | off | 24.6 | 35.2 | 43.2 | 0.84 | 1.76 |
| array-splice-insert-nested | 1,000 | off | off | 5.14 | 425 | 362 | 2.28 | 70.38 |
| object-update* | 1,000 | off | off | 53.6 | 53.1 | 132 | 130 | 2.46 |
| class-wide-update* | 1,000 | on | off | 419 | 422 | 241 | — | 0.57 |
| array-shift-nested | 10,000 | off | off | 7.37 | 9,824 | 8,292 | 1.43 | 1125.45 |
| array-unshift-nested | 10,000 | off | off | 16.3 | 10,614 | 8,248 | 85.8 | 506.55 |
| array-reverse-nested | 10,000 | off | off | 14.3 | 10,851 | 8,512 | 9.99 | 596.73 |
| array-reverse-nested | 10,000 | off | on | 1,226 | 286,207 | 10,167 | — | 8.29 |
| read-index | 10,000 | off | off | 5,210 | 8,238 | 11,253 | 135 | 2.16 |
| set-update | 10,000 | off | off | 1,087 | 1,093 | 5,166 | 418 | 4.75 |
| object-update* | 10,000 | off | off | 1,242 | 1,240 | 2,172 | 2,177 | 1.75 |
| apply-reverse | 10,000 | off | off | 13,549 | 15,201 | 16,447 | — | 1.21 |
| push-and-insert* | 10,000 | off | on | 65.2 | 212 | 370 | — | 5.67 |
| return-replace | 10,000 | on | off | 2,918 | 2,926 | 0.89 | — | 0.00 |

### Against a hand-written reducer

The hand-written reducer is faster than the candidate in 109 of 129 cells, and across all 129 the candidate takes 5.8 times as long on geometric mean: the reducer copies only what each update changes and has no draft to create, track, or finalize. The candidate is faster in 18 cells. Fifteen copy wide objects: objects with 1,000 and 3,000 properties, records with 1,000 or 10,000 keys, and class instances with 100 or more fields, by 1.5–2.8 times in isolated processes. Three insert at the front of an array, where the reducer's spread copies every element and `unshift` runs natively on the draft's copy: 1.1 times faster at 100 rows and 5.3 times at 10,000. The hand-written reducer is the same spread-based code that validates every scenario; faster hand-written code exists for many of them.

### Wide objects and process order

Inserting a property into the 1,000-property object depended on the code that ran before it in the process. With libraries in alternating orders in six processes, the hand-written reducer took 1.8 µs when it ran after the libraries and 130–132 µs when it ran first; Immer 2.7–2.8 µs after the hand-written reducer and 152–160 µs after Mutative; the candidate 54–58 µs first and 102–105 µs after the others. The isolated control gives each library its own process, where the candidate took 53.0 µs, Mutative 1.3.0 52.8 µs, Immer 151 µs, and the hand-written reducer 131 µs. A separate effect made the first timed run of a scenario in a process slower: updating a 100-key record took 12–15 µs in every library there and 3–4 µs afterwards. Priming each benchmark removed it, and the isolated control repeats the record scenarios with priming.

### Memory

Sampled allocation of the candidate was below Mutative 1.3.0 in 104 of 114 memory cells. The exceptions are Map and Set updates, by 0.3–8%, and `noop-empty` with freeze and patches on (4.1 against 3.7 KiB). It was below Immer in 67 of 114 cells: lower for reads, array moves, returned filters, and patch application; higher for Map and Set drafts (up to 2.4 times), the push-and-insert fixture (1.1–2.6 times), the 1,000-key record (112 against 16 KiB), and by a few KiB for no-op, small-object, record, and class-instance producers. Objects with more than 128 keys are copied into dictionary-mode objects, which also retain 48 KiB per output at 1,000 keys, against 8 KiB for the other libraries.

| Scenario | Rows | Patches | Candidate | Mutative 1.3.0 | Immer | Hand-written |
| --- | ---: | --- | ---: | ---: | ---: | ---: |
| read-index | 100 | off | 97.2 | 153.6 | 193.2 | 1.7 |
| push-and-insert | 100 | off | 114.4 | 1,366.2 | 65.5 | 19.5 |
| object-update | 1,000 | off | 112.3 | 1,315.5 | 15.8 | 10.8 |
| set-add | 10,000 | off | 2,871.3 | 2,899.9 | 1,612.0 | 325.2 |
| array-reverse-nested | 10,000 | off | 87.8 | 11,119.4 | 12,841.7 | 83.6 |
| array-reverse-nested | 10,000 | on | 3,044.4 | 268,459.4 | 15,039.4 | — |

Sampled KiB allocated per iteration with freeze off, medians of three isolated workers. With patches, nested reverse at 10,000 rows retains about 1,797 KiB per output, against 9,891 KiB for Mutative 1.3.0 and 1,797 KiB for Immer.

### Immer with `enableArrayMethods`

The plugin datasets rerun the array-related scenarios with Immer's array-method plugin enabled, measuring only the candidate and Immer (`--library both --immer-array-methods`): 47 scenarios at 100 rows and 12 at 1,000 and 10,000 rows, in both freeze and patch modes. All 560 combinations pass the correctness checks. These scenarios only read in their callbacks, so the plugin's documented behavior, raw objects handed to callbacks and returned from removals, does not change their results; [`test/immer-array-methods.md`](../../test/immer-array-methods.md) records the failures it causes when they write. The [freeze-off, patches-on section](#why-immers-array-method-plugin-is-not-the-main-comparator) explains why the main comparison leaves the plugin off.

| Comparator | Faster / within 5% / slower | Geometric mean Immer/candidate |
| --- | ---: | ---: |
| Immer 11.1.18 with `enableArrayMethods`, all plugin cells | 229 / 5 / 46 of 280 | 1.63 |
| Array-method scenarios only | 158 / 1 / 13 of 172 | 2.27 |

| Scenario | Rows | Freeze | Patches | Candidate | Immer + plugin | Immer/candidate |
| --- | ---: | --- | --- | ---: | ---: | ---: |
| array-shift-nested | 10,000 | off | off | 7.40 | 421 | 56.93 |
| array-shift-nested | 10,000 | off | on | 1,219 | 1,471 | 1.21 |
| array-shift-nested | 10,000 | on | off | 236 | 1,140 | 4.84 |
| array-reverse-nested | 10,000 | off | off | 14.3 | 431 | 30.17 |
| array-reverse-nested | 10,000 | off | on | 1,225 | 1,487 | 1.21 |
| array-splice-insert-nested | 10,000 | off | off | 21.5 | 436 | 20.28 |
| array-reverse-primitive | 10,000 | off | off | 14.3 | 388 | 27.13 |
| array-shift-nested | 1,000 | off | on | 123 | 130 | 1.06 |
| array-shift-nested | 100 | off | off | 0.81 | 2.77 | 3.42 |
| array-push-primitive | 100 | off | off | 1.16 | 0.86 | 0.74 |
| array-sort-nested | 100 | off | off | 91.9 | 12.7 | 0.14 |
| read-missing | 10,000 | off | off | 1,832 | 91.3 | 0.05 |

Immer with the plugin is faster in 46 cells. Most are scenarios where the plugin hands raw base elements to a callback or comparator, which Mutative never does: `find` in `read-missing` (about 20 times), `findIndex` in `remove-high` and `remove-high-reuse`, `filter` in `filter` and `return-filter`, and sorts of objects in `sortById-reverse`, `array-sort-shallow` and `array-sort-nested`. The others are `push` and `pop` on 100 rows with freeze and patches off, which Mutative leaves on the proxy path: 1.2–1.6 µs against 0.8–1.3 µs. Every `shift`, `unshift`, `splice` and `reverse` cell is faster than Immer with the plugin; at 10,000 rows by 20–57 times with freeze and patches off, 5–9 times with freeze on, and 1.2–2.1 times with patches on.

### Paired performance budget

The local budget gate compared the current build with itself at 1,000 rows, since this batch changes no Mutative source file. All 48 decisions passed: five latency pairs and three memory pairs per cell, both freeze and patch modes. Paired candidate/base median ratios span 0.995–1.010 for latency, 0.993–1.019 for sampled allocation, and 1.000 for retained heap.

### Searches of changed arrays

Measured on 2026-10-04 on the same machine and harness, after this batch: the source of `e70aeed`, which makes `current()` copy a changed array draft from its current array and leave the base elements that a native method moved as they are, against `main` at `d3cb6e6` (Mutative only, the Before column), with three runs each and patches off. The `search-*` scenarios find the last row of an array of nested rows and update it after the producer changed the array: `search-draft` searches the draft after updating the first row, `search-current` searches a `current()` snapshot after the same update, and `search-current-shifted` searches a snapshot after `shift()`. Microseconds per scenario, medians of three runs:

| Scenario | Rows | Freeze | Mutative | Before | Mutative 1.3.0 | Immer | Hand-written | Before/Mutative | Immer/Mutative |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| search-draft | 100 | off | 20.6 | 20.7 | 38.4 | 29.6 | 0.22 | 1.00 | 1.44 |
| search-draft | 100 | on | 23.3 | 23.4 | 41.0 | 37.3 | — | 1.01 | 1.60 |
| search-current | 100 | off | 13.6 | 43.3 | 45.0 | 241 | 0.22 | 3.20 | 17.8 |
| search-current | 100 | on | 16.2 | 46.1 | 47.9 | 34.8 | — | 2.84 | 2.15 |
| search-current-shifted | 100 | off | 7.26 | 70.0 | 149 | 97.3 | 0.21 | 9.64 | 13.4 |
| search-current-shifted | 100 | on | 9.74 | 72.3 | 151 | 105 | — | 7.42 | 10.8 |
| search-draft | 1,000 | off | 197 | 196 | 363 | 282 | 1.28 | 1.00 | 1.43 |
| search-draft | 1,000 | on | 218 | 217 | 384 | 350 | — | 1.00 | 1.61 |
| search-current | 1,000 | off | 31.4 | 318 | 344 | 2,350 | 1.27 | 10.1 | 74.8 |
| search-current | 1,000 | on | 52.8 | 340 | 365 | 264 | — | 6.43 | 5.00 |
| search-current-shifted | 1,000 | off | 61.5 | 679 | 1,451 | 947 | 1.41 | 11.0 | 15.4 |
| search-current-shifted | 1,000 | on | 81.5 | 698 | 1,463 | 1,025 | — | 8.56 | 12.6 |
| search-draft | 10,000 | off | 2,266 | 2,265 | 3,635 | 3,493 | 66.2 | 1.00 | 1.54 |
| search-draft | 10,000 | on | 2,426 | 2,444 | 3,818 | 4,198 | — | 1.01 | 1.73 |
| search-current | 10,000 | off | 209 | 3,262 | 3,574 | 23,701 | 11.6 | 15.6 | 113.1 |
| search-current | 10,000 | on | 415 | 3,462 | 3,714 | 2,503 | — | 8.35 | 6.03 |
| search-current-shifted | 10,000 | off | 772 | 7,490 | 15,487 | 11,734 | 13.2 | 9.71 | 15.2 |
| search-current-shifted | 10,000 | on | 957 | 7,460 | 15,548 | 12,324 | — | 7.80 | 12.9 |

The draft search is unchanged. On `main`, a snapshot search was slower than the draft search at every size, because `current()` copied the array through two proxy traps per element and walked every element that `shift()` had moved. Now it is faster at every size: 1.5 times at 100 rows, 6.3 times at 1,000 and 10.8 times at 10,000 with freeze off. After `shift()`, most of the remaining 772 µs at 10,000 rows is the map of original indices that the draft builds once when the moved last row is updated (about 400 µs), not the snapshot (about 140 µs). Immer's `current()` walks every unfrozen object, so with freeze off its snapshot searches are slower than its draft search.

The local budget gate compared `e70aeed` with `d3cb6e6` at 1,000 rows: all 48 decisions passed, with paired median ratios of 0.996–1.011 for latency, 0.935–1.025 for sampled allocation and 0.997–1.000 for retained heap. The production CJS artifact grows from 8,031 to 8,104 Brotli bytes, which `size-limit` measures at 6.70 kB against its 6.7 kB cap. The strict-mode warning for unchanged drafts exists only in development builds; the ESM artifact is one, so the README's ESM consumer grows from 8,728 to 8,983 Brotli bytes, about 200 of them for the warning.

## Tradeoffs and limits

- Returned values: the candidate searches every object of a returned value for drafts, frozen or not, while Immer skips frozen values. `return-replace` with pre-frozen payloads took 2.9 ms against 0.9 µs at 10,000 rows. Wrapping the value in `rawReturn()` skips the search (0.30 µs).
- Set drafts build a value map of the whole Set on access, copy the Set on the first change, and rebuild it when finalizing: `set-add` took about 100 ns per element at 10,000 elements, against 7 ns for a hand-written copy. Immer took 1.5 times as long. Copying the Map dominates `map-update` at 10,000 entries in every library, about 550 µs.
- With auto-freeze, Immer updated a class instance with 1,000 fields faster: 241 µs against 419 µs. Without freezing the candidate is faster, 102 µs against 216 µs, so the difference lies in freezing the candidate's copy, which it makes property by property with descriptors where Immer 11 uses `Object.assign`.
- Applying patches that replace nested values was 5–7% slower than Immer; structural patches are faster, as `apply-array-ops` shows (15 times).
- Wide-object timings depend on V8 state that earlier code leaves behind, by up to about 70 times. The isolated control removes the influence of other libraries, not that of a real application's code.
- Freeze-on inputs are already frozen, so freezing cold external data is excluded. Allocation is sampled, and small retained deltas are noisy. All measurements come from one machine and Node.js; browser engines may differ.
- Bundle size: a consumer of `create`, `apply`, `current` and `original` bundles to 8.7 kB with Brotli (8,733 bytes), against 3.4 kB for Immer's core and 6.0 kB with its patch, Map and Set, and array-method plugins, with esbuild 0.24.0 as in the README. `size-limit` measures the production CJS artifact at 6.64 kB against its 6.7 kB cap, and the ESM consumer at 5.45 kB against 6.5 kB.

## Native array method contract

The fast paths are made for data arrays. On them, values, own-property presence and patch replay match plain JS on a copy, and drafts, strict mode and unchanged calls behave as on the proxy path:

- `shift`, `unshift`, `splice` and `reverse` run natively on the draft's copy of a plain array without holes. Elements that are `undefined` are ordinary values and move natively. A hole reads as `undefined`, so an array in which the `includes` builtin finds no `undefined` has none; only arrays that hold `undefined` are checked index by index with the `in` operator, the HasProperty check of the native algorithms. The result is cached per draft until a length change or an assignment past the end.
- `indexOf`, `lastIndexOf` and `includes` run natively on the current array and give the proxy path's results, comparing elements as a read returns them. Drafts, values assigned in the recipe, non-draftable objects and primitives are found. An object of the base state is drafted on read and never found, whether or not it was read before; search `original(draft)` to compare original objects. A native hit on such an object is skipped and the search continues past it. A hit on an inherited element, or on a base element of an array with holes, is decided by the proxy path. The search never reads a property of the value it is given.
- In strict mode, outside `unsafe()`, optimized calls on an array that may hold objects take the proxy path unchanged, so reading a non-draftable element fails exactly where it always did. Arrays of primitives, recognized with `typeof`, keep the native paths.
- Elements are moved and compared without being inspected. The proxy path inspects each element it reads, so an element that is itself a Proxy may see fewer calls to its internal methods on the native paths, never more and never at other times; for example, a revoked Proxy element that a native search passes over does not throw.
- `sort` and `join` run natively on arrays of primitives.
- Removed elements are returned as drafts, patches replay in both directions, and a call that changes nothing keeps the state. Calls that cannot change the array (`unshift()` without arguments, `reverse()` of one element, an empty `splice`) are settled before any element is read or copied, and a `splice` that replaces elements with equal values reads only the replaced range.
- A method recognizes its receiver by identity: the array whose method was read last, or an array of a live producer registered when another array's method was read after it. A borrowed method called on any other object runs the native method on it without reading a property first. The reference to the last array is released when its producer ends, by any path, and drafts of `create` without a recipe are only registered weakly.
- Sparse arrays, array subclasses, an own `constructor` or `Symbol.isConcatSpreadable`, arrays under a custom `mark`, every method with a callback, `at`, `slice`, `fill` and `copyWithin` use the proxy path. An argument that can run user code is converted on the proxy path, so a conversion that changes the array is observed as the native methods do.
- Index accessors are outside the contract: their values are read as data, and the number and order of getter calls, their re-entrant effects on the draft, and the identity of objects they return are not guaranteed to match element-by-element execution through the proxy. Plain JS on a copy is the reference for every supported input; the proxy path itself is not, because it turns `delete` into an `undefined` assignment.

## Source and artifact identity

The measured source is that of [`e6b6563`](https://github.com/unadlib/mutative/commit/e6b6563b821305b8ee0d63c42a62cea752cc04f0). Timing used the harness at `a470abc`; memory used `4ea4fc0`, whose memory worker is the same. Both builds report the same source and production hashes.

SHA-256 identities (`source` uses the sorted path/content algorithm in [`build.mjs`](../build.mjs); `production` is `dist/mutative.cjs.production.min.js`):

```text
Candidate source:     604a1a8f39171e525be99e760b9b432e873cca5da574284a662e47147b75b4da
Candidate production: a9ca4c1d4cf094c0966ce35eb9550c69e102b18d7119b38fbab32f677ef91133
Pinned v1 production: 15ad9df11178c64f80e66797ffe784a4eeedfb03759ca59ef61a64f4142fde41
Immer production:     30fec64eb16c235f5fe771ed7e4be08eb0f67cb46c44917424a6e643f3d677b9
```

## Reproduce

Use Node 24.16.0 and the frozen lockfile. Run the following sequentially from the repository root; timings will vary. The [benchmark guide](../README.md) explains workload semantics and options.

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm benchmark:immer:build
node perf-testing/ci.mjs --self-control

node perf-testing/run-benchmarks.mjs --runs 3 --patches both --output perf-testing/results/default.json
node perf-testing/run-benchmarks.mjs --runs 6 --freeze off --filter '^update-largeObject1$' --output perf-testing/results/object-order.json

SCALE='^(read-index|read-forEach|read-missing|mutation-density-100pct|array-shift-nested|array-unshift-nested|array-splice-insert-nested|array-reverse-nested|array-reverse-primitive|map-update|map-read|set-add|set-update|object-update|object-delete|class-update|class-wide-update|apply-update-10pct|apply-reverse|return-replace|return-replace-raw|return-filter|push-and-insert)$'
WIDE='^(update-largeObject1|update-largeObject2|update-largeObject1-reuse|update-largeObject2-reuse|push-and-insert|push-and-insert-reuse|object-update|object-update-10pct|object-delete|class-wide-update|rtkq-sequence)$'
WIDE_SCALE='^(push-and-insert|object-update|object-delete|class-wide-update)$'
MEMORY='^(small-object-update|noop-empty|read-index|mutation-density-100pct|array-reverse-primitive|array-reverse-nested|map-update|set-add|object-update|class-update|apply-update-10pct|return-filter|push-and-insert)$'
MEMORY_SCALE='^(read-index|mutation-density-100pct|array-reverse-primitive|array-reverse-nested|map-update|set-add|object-update|push-and-insert)$'
PLUGIN='^(array-|sortById-reverse|reverse-array|add$|remove$|remove-high$|update-multiple|concat|filter|mapNested|remove-reuse|remove-high-reuse|apply-array-ops|apply-reverse|return-filter|push-and-insert$)'
PLUGIN_SCALE='^(read-index|read-forEach|read-missing|mutation-density-100pct|array-shift-nested|array-unshift-nested|array-splice-insert-nested|array-reverse-nested|array-reverse-primitive|apply-reverse|return-filter|push-and-insert)$'

node perf-testing/run-benchmarks.mjs --isolate --runs 3 --patches both --filter "$WIDE" --output perf-testing/results/isolated-default.json
node perf-testing/run-memory.mjs --runs 3 --patches both --memory-iterations 32 --filter "$MEMORY" --output perf-testing/results/memory-default.json
node perf-testing/run-benchmarks.mjs --runs 3 --patches both --library both --immer-array-methods --filter "$PLUGIN" --output perf-testing/results/plugin-default.json
for rows in 1000 10000; do
  iterations=16
  if [ "$rows" = 10000 ]; then iterations=8; fi
  node perf-testing/run-benchmarks.mjs --runs 3 --patches both --array-size "$rows" --filter "$SCALE" --output "perf-testing/results/scale-$rows.json"
  node perf-testing/run-benchmarks.mjs --isolate --runs 3 --patches both --array-size "$rows" --filter "$WIDE_SCALE" --output "perf-testing/results/isolated-$rows.json"
  node perf-testing/run-memory.mjs --runs 3 --patches both --array-size "$rows" --memory-iterations "$iterations" --filter "$MEMORY_SCALE" --output "perf-testing/results/memory-$rows.json"
  node perf-testing/run-benchmarks.mjs --runs 3 --patches both --library both --immer-array-methods --array-size "$rows" --filter "$PLUGIN_SCALE" --output "perf-testing/results/plugin-$rows.json"
done
```

The searches of changed arrays compare the current checkout with a built checkout of `main` at `d3cb6e6`, whose production artifact the harness takes as its candidate, and the budget gate compares the same two builds:

```sh
MAIN=/absolute/path/to/main-checkout
MUTATIVE_PERF_CANDIDATE_DIR="$MAIN" MUTATIVE_PERF_BUILD_DIR=perf-testing/dist/main node perf-testing/build.mjs
for rows in 100 1000 10000; do
  node perf-testing/run-benchmarks.mjs --runs 3 --filter '^search-' --array-size "$rows" --output "perf-testing/results/search-$rows.json"
  MUTATIVE_PERF_BUNDLE=perf-testing/dist/main/immutability-benchmarks.mjs node perf-testing/run-benchmarks.mjs --runs 3 --library mutative --filter '^search-' --array-size "$rows" --output "perf-testing/results/search-main-$rows.json"
done
node perf-testing/ci.mjs --base-dir "$MAIN"
```

## History

Earlier versions of this summary, in Git history, describe each round in detail. Cell counts compare the candidate with the named comparator: faster, within 5%, and slower.

- 2026-10-04, PR #180 at `e70aeed`: `current()` copies changed array drafts from their current array and leaves moved base elements as they are, and strict mode warns once in development builds when a recipe leaves 1,000 or more drafts unchanged. The three `search-*` scenarios were added; see [searches of changed arrays](#searches-of-changed-arrays). Gate 48 of 48. The production CJS artifact grew from 8,031 to 8,104 Brotli bytes against `main`.
- 2026-10-03, PR #75 at `363b3da`, 67 scenarios: 339 / 1 / 0 of 340 cells against Immer with the plugin off (geometric mean 3.77; 6.21 over the array cells, 1.58 elsewhere), 335 / 4 / 1 against pinned 1.3.0 (5.48), 140 / 191 / 9 against the PR #174 archive (2.24). With Immer's `enableArrayMethods`, 211 / 1 / 36 cells (1.68). Allocation below 1.3.0 in 55 of 56 memory cells; gate 48 of 48. Three review rounds followed before the merge: search results that match the proxy path (`f85df41`), strict-mode calls on the proxy path and no element inspection the proxy path does not make (`06d9d6e`–`6e74707`), and release of the receiver cache when a producer ends (`8fe0d9a`). Harness A/B comparisons put each round within 2% of the previous source, except a search that meets an unread base object, which now checks the array for holes (about 9 µs at 10,000 rows). Between `363b3da` and the merge, the size baseline of the production CJS artifact grew from 7,799 to 8,041 Brotli bytes, and its `size-limit` cap rose from 6.5 kB to 6.7 kB.
- 2026-10-02, PR #75 at `6193657`: 340 / 0 / 0 cells against Immer (3.78), 335 / 5 / 0 against pinned 1.3.0 (5.50). That source excluded arrays holding `undefined` from the native path and matched a draft's original object in searches; the contract above replaced both.
- 2026-10-02 and 2026-10-03, local commits `c598b41`–`a1e3235` and `689c181`–`1ba1615` (never pushed or superseded): eligibility checks through property descriptors made 10,000-row moves slower than Immer with its plugin, and a per-element `in` scan and a WeakSet entry per array added 0.2–0.9 µs to 100-row operations. `473c149` and `6ce062b` removed both costs.
- 2026-10-01, PR #174 (draft fast paths) and 2026-09-30 baseline: see the [archive index](./README.md).
