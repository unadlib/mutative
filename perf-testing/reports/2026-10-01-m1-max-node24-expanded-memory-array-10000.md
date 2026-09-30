# Memory measurements

Recorded: 2026-10-01T10:35:56.862Z; 144 isolated worker processes. Candidate Mutative 1.3.0, pinned v1 1.3.0, Immer 11.1.18; Node v24.16.0, V8 13.6.233.17-node.49, Apple M1 Max.

Each worker owns one scenario/library/freeze/patch combination. Setup, validation, and five warmup calls precede measurement. Allocation sampling includes collected objects and profiler/loop overhead; estimates are not exact allocation counts. A separate unprofiled pass retains one result per iteration (the last producer tuple when patches are enabled). Retained-output heap compares post-GC snapshots with outputs live and after releasing them, cancelling persistent runtime-cache growth. Raw before/retained/released snapshots remain in JSON. Small or negative deltas can be measurement noise. RSS is a batch-end snapshot delta, not peak RSS or per-operation allocation. Explicit GC duration is diagnostic, not producer latency.

Iterations/pass: 8; allocation sampling interval: 1024 bytes. Freeze on uses pre-frozen inputs. Patch application and serialization are excluded. Array-method plugins are disabled.

| Scenario | Library | Freeze | Patches | Allocated KiB/iteration (estimate) | Retained heap KiB/iteration | Batch RSS delta MiB | Explicit GC ms |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: |
| read-index | mutative | off | off | 9516.404 | -0.004 | 0.781 | 2.897 |
| read-index | mutative-v1 | off | off | 13502.511 | 3.405 | 38.891 | 3.570 |
| read-index | immer | off | off | 15753.923 | -0.007 | 6.063 | 2.693 |
| read-index | mutative | off | on | 9476.169 | 0.130 | 21.813 | 2.901 |
| read-index | mutative-v1 | off | on | 13529.864 | 3.560 | 5.844 | 2.980 |
| read-index | immer | off | on | 15756.780 | 0.138 | 1.203 | 3.483 |
| read-index | mutative | on | off | 9535.498 | -0.004 | 0.891 | 3.048 |
| read-index | mutative-v1 | on | off | 13528.998 | 3.414 | 13.922 | 2.843 |
| read-index | immer | on | off | 15741.930 | -0.007 | 6.063 | 3.724 |
| read-index | mutative | on | on | 9460.592 | 0.130 | 18.391 | 3.013 |
| read-index | mutative-v1 | on | on | 13475.214 | 3.711 | 3.063 | 3.134 |
| read-index | immer | on | on | 15718.917 | 0.138 | 1.266 | 3.569 |
| mutation-density-100pct | mutative | off | off | 14531.037 | 859.454 | 7.359 | 7.367 |
| mutation-density-100pct | mutative-v1 | off | off | 21975.006 | 1178.031 | 0.813 | 7.379 |
| mutation-density-100pct | immer | off | off | 16574.986 | 859.454 | 0.391 | 6.152 |
| mutation-density-100pct | mutative | off | on | 21080.802 | 2734.906 | 3.047 | 10.825 |
| mutation-density-100pct | mutative-v1 | off | on | 27828.517 | 3055.003 | 5.516 | 13.413 |
| mutation-density-100pct | immer | off | on | 25446.581 | 2734.899 | 5.313 | 10.362 |
| mutation-density-100pct | mutative | on | off | 18557.934 | 859.486 | 8.688 | 5.709 |
| mutation-density-100pct | mutative-v1 | on | off | 25559.034 | 1178.155 | 0.859 | 6.604 |
| mutation-density-100pct | immer | on | off | 20705.155 | 859.476 | 2.156 | 6.951 |
| mutation-density-100pct | mutative | on | on | 25057.684 | 2734.932 | 3.047 | 8.187 |
| mutation-density-100pct | mutative-v1 | on | on | 31302.029 | 3055.119 | 5.469 | 11.213 |
| mutation-density-100pct | immer | on | on | 29779.853 | 2734.925 | 4.922 | 8.956 |
| array-reverse-primitive | mutative | off | off | 1646.954 | 78.211 | 1.563 | 1.342 |
| array-reverse-primitive | mutative-v1 | off | off | 1212.198 | 82.390 | 1.594 | 1.540 |
| array-reverse-primitive | immer | off | off | 2421.222 | 78.204 | 8.344 | 1.664 |
| array-reverse-primitive | mutative | off | on | 4921.227 | 1797.399 | 16.328 | 6.034 |
| array-reverse-primitive | mutative-v1 | off | on | 4083.744 | 1801.664 | 11.656 | 6.040 |
| array-reverse-primitive | immer | off | on | 4944.536 | 1797.399 | 17.547 | 6.851 |
| array-reverse-primitive | mutative | on | off | 2039.688 | 78.229 | 2.938 | 1.557 |
| array-reverse-primitive | mutative-v1 | on | off | 1603.413 | 82.298 | 3.828 | 1.873 |
| array-reverse-primitive | immer | on | off | 2452.919 | 78.219 | 8.422 | 2.063 |
| array-reverse-primitive | mutative | on | on | 5288.308 | 1796.463 | 23.234 | 8.602 |
| array-reverse-primitive | mutative-v1 | on | on | 4240.615 | 1801.553 | 17.281 | 6.623 |
| array-reverse-primitive | immer | on | on | 4938.959 | 1797.414 | 11.734 | 5.914 |
| array-reverse-nested | mutative | off | off | 8388.756 | 78.204 | 4.453 | 3.639 |
| array-reverse-nested | mutative-v1 | off | off | 11105.993 | 85.888 | 2.703 | 3.138 |
| array-reverse-nested | immer | off | off | 12825.747 | 78.204 | 34.906 | 3.512 |
| array-reverse-nested | mutative | off | on | 11428.842 | 1797.407 | 5.516 | 8.398 |
| array-reverse-nested | mutative-v1 | off | on | 268458.541 | 9890.873 | 174.516 | 35.380 |
| array-reverse-nested | immer | off | on | 14810.366 | 1797.399 | 9.406 | 8.856 |
| array-reverse-nested | mutative | on | off | 8757.938 | 78.219 | 2.938 | 3.534 |
| array-reverse-nested | mutative-v1 | on | off | 11459.487 | 85.812 | 3.531 | 3.316 |
| array-reverse-nested | immer | on | off | 12829.426 | 78.219 | 34.828 | 3.548 |
| array-reverse-nested | mutative | on | on | 11935.984 | 1797.424 | 1.484 | 6.222 |
| array-reverse-nested | mutative-v1 | on | on | 269569.944 | 9890.819 | 186.594 | 36.693 |
| array-reverse-nested | immer | on | on | 14830.902 | 1797.418 | 9.828 | 7.493 |

Tables use medians across independent workers. JSON retains every snapshot, process range, source/production hashes, patch counts, and sampling count. Compare latency using the separate timing reports.
