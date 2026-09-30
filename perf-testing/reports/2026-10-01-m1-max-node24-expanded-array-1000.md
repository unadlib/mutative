# Candidate Mutative vs pinned v1 and Immer

Recorded: 2026-10-01T10:24:26.757Z; 3 independent processes. Times are median process means in µs per complete scenario.

Candidate Mutative 1.3.0 at `027e23edd2145c8fb80d8f20e1a10e9bb30d7999`; pinned Mutative v1 1.3.0; pinned Immer 11.1.18. The candidate is only v2 when its actual package version is 2.x.

Environment: Apple M1 Max; Node v24.16.0, V8 13.6.233.17-node.49, darwin/arm64.

Production artifacts and their hashes are recorded in JSON. Array-method plugins are disabled. Setup and validation are excluded. Freeze-on inputs are pre-frozen; patch timing includes forward/inverse generation, excluding replay and serialization.

V1/C and I/C are time ratios to the candidate; values above 1 favor the candidate. Small differences do not establish a winner.

| Scenario | Freeze | Patches | Calls | Candidate µs | V1 µs | Immer µs | V1/C | I/C |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| read-index | off | off | 1 | 513.697 | 769.452 | 923.764 | 1.50 | 1.80 |
| read-index | off | on | 1 | 512.933 | 772.701 | 926.842 | 1.51 | 1.81 |
| read-index | on | off | 1 | 516.586 | 775.191 | 959.492 | 1.50 | 1.86 |
| read-index | on | on | 1 | 516.545 | 775.678 | 953.833 | 1.50 | 1.85 |
| read-forEach | off | off | 1 | 391.693 | 592.087 | 552.095 | 1.51 | 1.41 |
| read-forEach | off | on | 1 | 391.362 | 596.732 | 555.870 | 1.52 | 1.42 |
| read-forEach | on | off | 1 | 394.102 | 593.098 | 587.056 | 1.50 | 1.49 |
| read-forEach | on | on | 1 | 392.820 | 595.400 | 586.007 | 1.52 | 1.49 |
| read-missing | off | off | 1 | 187.348 | 278.811 | 259.484 | 1.49 | 1.39 |
| read-missing | off | on | 1 | 186.753 | 278.976 | 259.229 | 1.49 | 1.39 |
| read-missing | on | off | 1 | 189.091 | 280.901 | 285.515 | 1.49 | 1.51 |
| read-missing | on | on | 1 | 189.843 | 281.511 | 284.107 | 1.48 | 1.50 |
| mutation-density-100pct | off | off | 1 | 638.857 | 1225.375 | 1010.769 | 1.92 | 1.58 |
| mutation-density-100pct | off | on | 1 | 1080.810 | 2012.303 | 1893.681 | 1.86 | 1.75 |
| mutation-density-100pct | on | off | 1 | 815.576 | 1399.206 | 1376.950 | 1.72 | 1.69 |
| mutation-density-100pct | on | on | 1 | 1242.908 | 2167.605 | 2270.738 | 1.74 | 1.83 |
| array-reverse-primitive | off | off | 1 | 269.601 | 415.334 | 416.582 | 1.54 | 1.55 |
| array-reverse-primitive | off | on | 1 | 443.759 | 550.853 | 597.877 | 1.24 | 1.35 |
| array-reverse-primitive | on | off | 1 | 281.982 | 423.632 | 472.552 | 1.50 | 1.68 |
| array-reverse-primitive | on | on | 1 | 453.413 | 561.684 | 653.606 | 1.24 | 1.44 |
| array-shift-nested | off | off | 1 | 465.632 | 838.344 | 708.688 | 1.80 | 1.52 |
| array-shift-nested | off | on | 1 | 612.040 | 26580.810 | 839.808 | 43.43 | 1.37 |
| array-shift-nested | on | off | 1 | 491.789 | 862.954 | 784.782 | 1.75 | 1.60 |
| array-shift-nested | on | on | 1 | 634.184 | 25967.530 | 921.745 | 40.95 | 1.45 |
| array-unshift-nested | off | off | 1 | 468.914 | 846.152 | 709.480 | 1.80 | 1.51 |
| array-unshift-nested | off | on | 1 | 618.733 | 26659.652 | 851.670 | 43.09 | 1.38 |
| array-unshift-nested | on | off | 1 | 489.293 | 867.511 | 779.261 | 1.77 | 1.59 |
| array-unshift-nested | on | on | 1 | 640.250 | 26813.067 | 923.169 | 41.88 | 1.44 |
| array-splice-insert-nested | off | off | 1 | 238.127 | 425.201 | 367.154 | 1.79 | 1.54 |
| array-splice-insert-nested | off | on | 1 | 314.886 | 13430.098 | 453.799 | 42.65 | 1.44 |
| array-splice-insert-nested | on | off | 1 | 257.200 | 439.860 | 434.951 | 1.71 | 1.69 |
| array-splice-insert-nested | on | on | 1 | 331.941 | 12770.355 | 524.424 | 38.47 | 1.58 |
| array-reverse-nested | off | off | 1 | 474.471 | 859.205 | 702.335 | 1.81 | 1.48 |
| array-reverse-nested | off | on | 1 | 662.943 | 26254.482 | 853.155 | 39.60 | 1.29 |
| array-reverse-nested | on | off | 1 | 499.187 | 880.879 | 777.509 | 1.76 | 1.56 |
| array-reverse-nested | on | on | 1 | 690.655 | 26952.960 | 923.187 | 39.03 | 1.34 |

JSON retains per-process mean ranges, sample p50/p99 and counts, patch counts, fixture sizes, environment, and production/source hashes. Sample p99 can represent batches, not individual-request tail latency.
