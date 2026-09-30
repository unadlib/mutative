# Memory measurements

Recorded: 2026-09-30T15:51:39.958Z; 216 isolated worker processes. Candidate Mutative 1.3.0, pinned v1 1.3.0, Immer 11.1.18; Node v24.16.0, V8 13.6.233.17-node.49, Apple M1 Max.

Each worker owns one scenario/library/freeze/patch combination. Setup, validation, and five warmup calls precede measurement. Allocation sampling includes collected objects and profiler/loop overhead; estimates are not exact allocation counts. A separate unprofiled pass retains one result per iteration (the last producer tuple when patches are enabled). Retained-output heap compares post-GC snapshots with outputs live and after releasing them, cancelling persistent runtime-cache growth. Raw before/retained/released snapshots remain in JSON. Small or negative deltas can be measurement noise. RSS is a batch-end snapshot delta, not peak RSS or per-operation allocation. Explicit GC duration is diagnostic, not producer latency.

Iterations/pass: 32; allocation sampling interval: 1024 bytes. Freeze on uses pre-frozen inputs. Patch application and serialization are excluded. Array-method plugins are disabled.

| Scenario                | Library     | Freeze | Patches | Allocated KiB/iteration (estimate) | Retained heap KiB/iteration | Batch RSS delta MiB | Explicit GC ms |
| ----------------------- | ----------- | ------ | ------- | ---------------------------------: | --------------------------: | ------------------: | -------------: |
| read-index              | mutative    | off    | off     |                            150.632 |                       0.606 |               0.281 |          1.418 |
| read-index              | mutative-v1 | off    | off     |                            151.754 |                       0.606 |               0.297 |          1.419 |
| read-index              | immer       | off    | off     |                            194.725 |                      -0.002 |               0.313 |          1.389 |
| read-index              | mutative    | off    | on      |                            150.725 |                       0.739 |               0.250 |          1.525 |
| read-index              | mutative-v1 | off    | on      |                            151.800 |                       0.739 |               0.328 |          1.395 |
| read-index              | immer       | off    | on      |                            195.269 |                       0.134 |               0.469 |          1.804 |
| read-index              | mutative    | on     | off     |                            153.950 |                       0.606 |               0.359 |          1.585 |
| read-index              | mutative-v1 | on     | off     |                            154.062 |                       0.606 |               0.344 |          1.508 |
| read-index              | immer       | on     | off     |                            194.437 |                      -0.002 |               0.469 |          1.678 |
| read-index              | mutative    | on     | on      |                            150.665 |                       0.739 |               0.375 |          1.227 |
| read-index              | mutative-v1 | on     | on      |                            149.943 |                       0.739 |               0.328 |          1.355 |
| read-index              | immer       | on     | on      |                            194.129 |                       0.134 |               0.391 |          1.324 |
| noop-empty              | mutative    | off    | off     |                              3.721 |                      -0.002 |               0.000 |          1.393 |
| noop-empty              | mutative-v1 | off    | off     |                              3.647 |                      -0.001 |               0.000 |          1.276 |
| noop-empty              | immer       | off    | off     |                              2.867 |                      -0.002 |               0.000 |          1.223 |
| noop-empty              | mutative    | off    | on      |                              4.094 |                       0.131 |               0.016 |          1.290 |
| noop-empty              | mutative-v1 | off    | on      |                              3.715 |                       0.131 |               0.000 |          1.343 |
| noop-empty              | immer       | off    | on      |                              3.592 |                       0.131 |               0.000 |          1.297 |
| noop-empty              | mutative    | on     | off     |                              4.153 |                      -0.001 |               0.000 |          1.171 |
| noop-empty              | mutative-v1 | on     | off     |                              3.531 |                      -0.002 |               0.000 |          1.239 |
| noop-empty              | immer       | on     | off     |                              3.056 |                      -0.002 |               0.000 |          1.211 |
| noop-empty              | mutative    | on     | on      |                              3.726 |                       0.131 |               0.000 |          1.099 |
| noop-empty              | mutative-v1 | on     | on      |                              3.699 |                       0.131 |               0.000 |          1.237 |
| noop-empty              | immer       | on     | on      |                              3.564 |                       0.131 |               0.000 |          1.332 |
| small-object-update     | mutative    | off    | off     |                              5.357 |                       0.114 |               0.016 |          1.360 |
| small-object-update     | mutative-v1 | off    | off     |                              5.501 |                       0.089 |               0.016 |          1.375 |
| small-object-update     | immer       | off    | off     |                              4.322 |                       0.006 |               0.016 |          1.185 |
| small-object-update     | mutative    | off    | on      |                              6.320 |                       0.637 |               0.000 |          1.375 |
| small-object-update     | mutative-v1 | off    | on      |                              6.615 |                       0.636 |               0.000 |          1.386 |
| small-object-update     | immer       | off    | on      |                              5.781 |                       0.662 |               0.016 |          1.372 |
| small-object-update     | mutative    | on     | off     |                              6.341 |                       0.130 |               0.000 |          1.135 |
| small-object-update     | mutative-v1 | on     | off     |                              5.383 |                       0.130 |               0.000 |          1.409 |
| small-object-update     | immer       | on     | off     |                              4.348 |                       0.076 |               0.016 |          1.203 |
| small-object-update     | mutative    | on     | on      |                              6.974 |                       0.654 |               0.016 |          1.409 |
| small-object-update     | mutative-v1 | on     | on      |                              6.939 |                       0.654 |               0.000 |          1.705 |
| small-object-update     | immer       | on     | on      |                              6.417 |                       0.664 |               0.016 |          1.202 |
| mutation-density-100pct | mutative    | off    | off     |                            243.501 |                      12.614 |               4.313 |          1.712 |
| mutation-density-100pct | mutative-v1 | off    | off     |                            245.063 |                      12.613 |               4.297 |          1.990 |
| mutation-density-100pct | immer       | off    | off     |                            207.896 |                       8.678 |               1.578 |          1.610 |
| mutation-density-100pct | mutative    | off    | on      |                            321.055 |                      31.369 |               1.781 |          2.127 |
| mutation-density-100pct | mutative-v1 | off    | on      |                            319.271 |                      31.369 |               1.719 |          1.975 |
| mutation-density-100pct | immer       | off    | on      |                            294.145 |                      28.217 |               2.516 |          2.159 |
| mutation-density-100pct | mutative    | on     | off     |                            287.208 |                      12.643 |               4.609 |          1.909 |
| mutation-density-100pct | mutative-v1 | on     | off     |                            279.923 |                      12.643 |               4.234 |          1.938 |
| mutation-density-100pct | immer       | on     | off     |                            254.582 |                       8.678 |               3.078 |          1.520 |
| mutation-density-100pct | mutative    | on     | on      |                            361.680 |                      31.395 |               2.375 |          1.801 |
| mutation-density-100pct | mutative-v1 | on     | on      |                            356.820 |                      31.393 |               1.688 |          1.816 |
| mutation-density-100pct | immer       | on     | on      |                            339.508 |                      27.597 |               2.953 |          2.000 |
| array-reverse-primitive | mutative    | off    | off     |                             20.967 |                       0.920 |               0.078 |          1.415 |
| array-reverse-primitive | mutative-v1 | off    | off     |                             20.152 |                       0.920 |               0.078 |          1.352 |
| array-reverse-primitive | immer       | off    | off     |                             32.375 |                       0.865 |               0.188 |          1.347 |
| array-reverse-primitive | mutative    | off    | on      |                             51.056 |                      18.896 |               0.203 |          1.711 |
| array-reverse-primitive | mutative-v1 | off    | on      |                             50.666 |                      18.896 |               0.188 |          1.749 |
| array-reverse-primitive | immer       | off    | on      |                             61.850 |                      18.842 |               0.531 |          1.928 |
| array-reverse-primitive | mutative    | on     | off     |                             25.206 |                       0.932 |               0.078 |          1.635 |
| array-reverse-primitive | mutative-v1 | on     | off     |                             24.822 |                       0.935 |               0.094 |          1.520 |
| array-reverse-primitive | immer       | on     | off     |                             31.672 |                       0.869 |               0.188 |          1.486 |
| array-reverse-primitive | mutative    | on     | on      |                             55.545 |                      18.909 |               0.219 |          1.629 |
| array-reverse-primitive | mutative-v1 | on     | on      |                             53.989 |                      18.909 |               0.234 |          1.833 |
| array-reverse-primitive | immer       | on     | on      |                             60.643 |                      18.846 |               0.531 |          1.790 |
| array-reverse-nested    | mutative    | off    | off     |                            127.382 |                       0.979 |               0.375 |          1.482 |
| array-reverse-nested    | mutative-v1 | off    | off     |                            125.304 |                       0.979 |               0.375 |          1.479 |
| array-reverse-nested    | immer       | off    | off     |                            150.637 |                       0.810 |               0.453 |          1.629 |
| array-reverse-nested    | mutative    | off    | on      |                           2685.192 |                     100.351 |              18.500 |          3.196 |
| array-reverse-nested    | mutative-v1 | off    | on      |                           2669.835 |                     100.351 |              18.547 |          2.846 |
| array-reverse-nested    | immer       | off    | on      |                            178.742 |                      18.780 |               2.734 |          1.823 |
| array-reverse-nested    | mutative    | on     | off     |                            130.646 |                       0.989 |               0.391 |          1.509 |
| array-reverse-nested    | mutative-v1 | on     | off     |                            131.989 |                       0.989 |               0.391 |          1.671 |
| array-reverse-nested    | immer       | on     | off     |                            149.551 |                       0.869 |               0.438 |          1.274 |
| array-reverse-nested    | mutative    | on     | on      |                           2692.628 |                     100.353 |              18.844 |          2.450 |
| array-reverse-nested    | mutative-v1 | on     | on      |                           2687.149 |                     100.353 |              18.594 |          3.019 |
| array-reverse-nested    | immer       | on     | on      |                            180.344 |                      18.845 |               2.719 |          1.842 |

Tables use medians across independent workers. JSON retains every snapshot, process range, source/production hashes, patch counts, and sampling count. Compare latency using the separate timing reports.
