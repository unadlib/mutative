# Memory measurements

Recorded: 2026-10-01T10:31:58.361Z; 216 isolated worker processes. Candidate Mutative 1.3.0, pinned v1 1.3.0, Immer 11.1.18; Node v24.16.0, V8 13.6.233.17-node.49, Apple M1 Max.

Each worker owns one scenario/library/freeze/patch combination. Setup, validation, and five warmup calls precede measurement. Allocation sampling includes collected objects and profiler/loop overhead; estimates are not exact allocation counts. A separate unprofiled pass retains one result per iteration (the last producer tuple when patches are enabled). Retained-output heap compares post-GC snapshots with outputs live and after releasing them, cancelling persistent runtime-cache growth. Raw before/retained/released snapshots remain in JSON. Small or negative deltas can be measurement noise. RSS is a batch-end snapshot delta, not peak RSS or per-operation allocation. Explicit GC duration is diagnostic, not producer latency.

Iterations/pass: 32; allocation sampling interval: 1024 bytes. Freeze on uses pre-frozen inputs. Patch application and serialization are excluded. Array-method plugins are disabled.

| Scenario | Library | Freeze | Patches | Allocated KiB/iteration (estimate) | Retained heap KiB/iteration | Batch RSS delta MiB | Explicit GC ms |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: |
| read-index | mutative | off | off | 95.965 | -0.001 | 0.000 | 1.079 |
| read-index | mutative-v1 | off | off | 153.009 | 0.606 | 0.359 | 1.639 |
| read-index | immer | off | off | 194.123 | -0.002 | 0.344 | 1.417 |
| read-index | mutative | off | on | 96.460 | 0.132 | 0.016 | 1.307 |
| read-index | mutative-v1 | off | on | 149.697 | 0.746 | 0.344 | 1.425 |
| read-index | immer | off | on | 194.958 | 0.134 | 0.375 | 1.689 |
| read-index | mutative | on | off | 96.686 | -0.001 | 0.000 | 1.386 |
| read-index | mutative-v1 | on | off | 151.875 | 0.612 | 0.359 | 1.545 |
| read-index | immer | on | off | 194.349 | -0.002 | 0.500 | 1.251 |
| read-index | mutative | on | on | 98.268 | 0.132 | 0.000 | 1.464 |
| read-index | mutative-v1 | on | on | 151.268 | 0.739 | 0.313 | 1.448 |
| read-index | immer | on | on | 195.136 | 0.134 | 0.438 | 1.303 |
| noop-empty | mutative | off | off | 3.327 | -0.002 | 0.000 | 1.384 |
| noop-empty | mutative-v1 | off | off | 3.500 | -0.002 | 0.000 | 1.320 |
| noop-empty | immer | off | off | 2.990 | -0.002 | 0.000 | 1.425 |
| noop-empty | mutative | off | on | 3.612 | 0.131 | 0.000 | 1.256 |
| noop-empty | mutative-v1 | off | on | 4.286 | 0.131 | 0.000 | 1.558 |
| noop-empty | immer | off | on | 3.483 | 0.131 | 0.000 | 1.351 |
| noop-empty | mutative | on | off | 3.432 | -0.001 | 0.000 | 1.234 |
| noop-empty | mutative-v1 | on | off | 3.701 | -0.001 | 0.000 | 1.213 |
| noop-empty | immer | on | off | 2.832 | -0.002 | 0.016 | 1.336 |
| noop-empty | mutative | on | on | 3.216 | 0.131 | 0.000 | 1.459 |
| noop-empty | mutative-v1 | on | on | 3.865 | 0.131 | 0.016 | 1.195 |
| noop-empty | immer | on | on | 3.624 | 0.131 | 0.016 | 1.227 |
| small-object-update | mutative | off | off | 4.500 | 0.076 | 0.000 | 1.308 |
| small-object-update | mutative-v1 | off | off | 5.707 | 0.089 | 0.016 | 1.330 |
| small-object-update | immer | off | off | 4.032 | 0.006 | 0.016 | 1.220 |
| small-object-update | mutative | off | on | 5.478 | 0.633 | 0.000 | 1.376 |
| small-object-update | mutative-v1 | off | on | 6.123 | 0.637 | 0.000 | 1.190 |
| small-object-update | immer | off | on | 5.790 | 0.662 | 0.016 | 1.178 |
| small-object-update | mutative | on | off | 4.631 | 0.047 | 0.000 | 1.145 |
| small-object-update | mutative-v1 | on | off | 6.002 | 0.130 | 0.000 | 1.121 |
| small-object-update | immer | on | off | 4.208 | 0.076 | 0.000 | 1.093 |
| small-object-update | mutative | on | on | 6.447 | 0.600 | 0.031 | 1.373 |
| small-object-update | mutative-v1 | on | on | 6.592 | 0.654 | 0.016 | 1.207 |
| small-object-update | immer | on | on | 6.288 | 0.662 | 0.016 | 1.506 |
| mutation-density-100pct | mutative | off | off | 162.526 | 8.679 | 0.297 | 1.791 |
| mutation-density-100pct | mutative-v1 | off | off | 242.377 | 12.614 | 4.406 | 1.541 |
| mutation-density-100pct | immer | off | off | 207.051 | 8.678 | 2.563 | 1.849 |
| mutation-density-100pct | mutative | off | on | 229.584 | 28.218 | 2.297 | 2.323 |
| mutation-density-100pct | mutative-v1 | off | on | 321.211 | 31.369 | 1.703 | 1.921 |
| mutation-density-100pct | immer | off | on | 292.221 | 28.217 | 2.484 | 1.623 |
| mutation-density-100pct | mutative | on | off | 199.969 | 8.685 | 1.094 | 1.748 |
| mutation-density-100pct | mutative-v1 | on | off | 282.736 | 12.642 | 4.438 | 1.706 |
| mutation-density-100pct | immer | on | off | 254.839 | 8.678 | 3.109 | 1.478 |
| mutation-density-100pct | mutative | on | on | 272.781 | 28.223 | 3.156 | 1.735 |
| mutation-density-100pct | mutative-v1 | on | on | 360.413 | 31.394 | 1.688 | 1.683 |
| mutation-density-100pct | immer | on | on | 336.719 | 27.603 | 2.594 | 1.902 |
| array-reverse-primitive | mutative | off | off | 25.366 | 0.866 | 0.016 | 1.178 |
| array-reverse-primitive | mutative-v1 | off | off | 21.001 | 0.927 | 0.078 | 1.376 |
| array-reverse-primitive | immer | off | off | 31.651 | 0.865 | 0.188 | 1.321 |
| array-reverse-primitive | mutative | off | on | 58.436 | 18.842 | 0.188 | 1.816 |
| array-reverse-primitive | mutative-v1 | off | on | 51.134 | 18.896 | 0.250 | 1.766 |
| array-reverse-primitive | immer | off | on | 59.805 | 18.842 | 0.531 | 1.909 |
| array-reverse-primitive | mutative | on | off | 28.635 | 0.870 | 0.031 | 1.361 |
| array-reverse-primitive | mutative-v1 | on | off | 25.200 | 0.935 | 0.078 | 1.267 |
| array-reverse-primitive | immer | on | off | 32.867 | 0.870 | 0.203 | 1.586 |
| array-reverse-primitive | mutative | on | on | 62.870 | 18.846 | 0.281 | 2.013 |
| array-reverse-primitive | mutative-v1 | on | on | 54.753 | 18.909 | 0.203 | 1.662 |
| array-reverse-primitive | immer | on | on | 61.302 | 18.846 | 0.547 | 1.670 |
| array-reverse-nested | mutative | off | off | 89.190 | 0.866 | 0.016 | 1.458 |
| array-reverse-nested | mutative-v1 | off | off | 127.584 | 0.979 | 0.406 | 1.461 |
| array-reverse-nested | immer | off | off | 151.538 | 0.810 | 0.453 | 1.440 |
| array-reverse-nested | mutative | off | on | 122.042 | 18.842 | 1.734 | 1.832 |
| array-reverse-nested | mutative-v1 | off | on | 2664.216 | 100.351 | 18.688 | 2.577 |
| array-reverse-nested | immer | off | on | 181.940 | 18.589 | 2.688 | 2.182 |
| array-reverse-nested | mutative | on | off | 93.082 | 0.870 | 0.016 | 1.227 |
| array-reverse-nested | mutative-v1 | on | off | 131.057 | 0.996 | 0.391 | 1.458 |
| array-reverse-nested | immer | on | off | 152.250 | 0.867 | 0.516 | 1.201 |
| array-reverse-nested | mutative | on | on | 128.852 | 18.847 | 1.859 | 1.667 |
| array-reverse-nested | mutative-v1 | on | on | 2683.170 | 100.353 | 18.766 | 3.305 |
| array-reverse-nested | immer | on | on | 176.604 | 18.845 | 2.781 | 1.938 |

Tables use medians across independent workers. JSON retains every snapshot, process range, source/production hashes, patch counts, and sampling count. Compare latency using the separate timing reports.
