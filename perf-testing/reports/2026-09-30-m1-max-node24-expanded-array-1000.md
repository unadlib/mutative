# Candidate Mutative vs pinned v1 and Immer

Recorded: 2026-09-30T15:43:19.284Z; 3 independent processes. Times are median process means in µs per complete scenario.

Candidate Mutative 1.3.0 at `ea629e1b8967bbe8200ce4f2dd9205eba664be8b`; pinned Mutative v1 1.3.0; pinned Immer 11.1.18. The candidate is only v2 when its actual package version is 2.x.

Environment: Apple M1 Max; Node v24.16.0, V8 13.6.233.17-node.49, darwin/arm64.

Production artifacts and their hashes are recorded in JSON. Array-method plugins are disabled. Setup and validation are excluded. Freeze-on inputs are pre-frozen; patch timing includes forward/inverse generation, excluding replay and serialization.

V1/C and I/C are time ratios to the candidate; values above 1 favor the candidate. Small differences do not establish a winner.

| Scenario                   | Freeze | Patches | Calls | Candidate µs |     V1 µs | Immer µs | V1/C |  I/C |
| -------------------------- | ------ | ------- | ----: | -----------: | --------: | -------: | ---: | ---: |
| read-index                 | off    | off     |     1 |      782.096 |   780.538 |  932.591 | 1.00 | 1.19 |
| read-index                 | off    | on      |     1 |      783.435 |   784.794 |  935.215 | 1.00 | 1.19 |
| read-index                 | on     | off     |     1 |      786.008 |   786.087 |  956.486 | 1.00 | 1.22 |
| read-index                 | on     | on      |     1 |      788.849 |   788.347 |  961.740 | 1.00 | 1.22 |
| read-forEach               | off    | off     |     1 |      598.847 |   605.891 |  556.761 | 1.01 | 0.93 |
| read-forEach               | off    | on      |     1 |      599.498 |   599.940 |  561.537 | 1.00 | 0.94 |
| read-forEach               | on     | off     |     1 |      603.397 |   602.309 |  585.317 | 1.00 | 0.97 |
| read-forEach               | on     | on      |     1 |      603.083 |   599.732 |  589.368 | 0.99 | 0.98 |
| read-missing               | off    | off     |     1 |      281.656 |   281.568 |  259.692 | 1.00 | 0.92 |
| read-missing               | off    | on      |     1 |      282.406 |   281.139 |  261.959 | 1.00 | 0.93 |
| read-missing               | on     | off     |     1 |      284.074 |   283.876 |  286.760 | 1.00 | 1.01 |
| read-missing               | on     | on      |     1 |      284.578 |   285.297 |  286.720 | 1.00 | 1.01 |
| mutation-density-100pct    | off    | off     |     1 |     1243.233 |  1270.856 | 1021.878 | 1.02 | 0.82 |
| mutation-density-100pct    | off    | on      |     1 |     2005.610 |  2031.011 | 1980.555 | 1.01 | 0.99 |
| mutation-density-100pct    | on     | off     |     1 |     1416.805 |  1419.058 | 1388.964 | 1.00 | 0.98 |
| mutation-density-100pct    | on     | on      |     1 |     2160.031 |  2218.371 | 2294.120 | 1.03 | 1.06 |
| array-reverse-primitive    | off    | off     |     1 |      415.997 |   415.528 |  414.891 | 1.00 | 1.00 |
| array-reverse-primitive    | off    | on      |     1 |      552.388 |   550.874 |  595.743 | 1.00 | 1.08 |
| array-reverse-primitive    | on     | off     |     1 |      428.972 |   430.001 |  474.430 | 1.00 | 1.11 |
| array-reverse-primitive    | on     | on      |     1 |      563.937 |   564.723 |  653.727 | 1.00 | 1.16 |
| array-shift-nested         | off    | off     |     1 |      856.616 |   844.044 |  711.309 | 0.99 | 0.83 |
| array-shift-nested         | off    | on      |     1 |    27087.308 | 27536.694 |  845.302 | 1.02 | 0.03 |
| array-shift-nested         | on     | off     |     1 |      870.125 |   873.246 |  782.061 | 1.00 | 0.90 |
| array-shift-nested         | on     | on      |     1 |    27434.960 | 27707.217 |  930.064 | 1.01 | 0.03 |
| array-unshift-nested       | off    | off     |     1 |      870.795 |   847.110 |  717.721 | 0.97 | 0.82 |
| array-unshift-nested       | off    | on      |     1 |    27043.150 | 27213.375 |  861.613 | 1.01 | 0.03 |
| array-unshift-nested       | on     | off     |     1 |      867.279 |   868.706 |  783.365 | 1.00 | 0.90 |
| array-unshift-nested       | on     | on      |     1 |    28078.129 | 28276.228 |  929.325 | 1.01 | 0.03 |
| array-splice-insert-nested | off    | off     |     1 |      426.806 |   424.859 |  368.078 | 1.00 | 0.86 |
| array-splice-insert-nested | off    | on      |     1 |    13583.001 | 13619.257 |  452.253 | 1.00 | 0.03 |
| array-splice-insert-nested | on     | off     |     1 |      443.944 |   442.846 |  435.976 | 1.00 | 0.98 |
| array-splice-insert-nested | on     | on      |     1 |    13944.288 | 13570.123 |  527.953 | 0.97 | 0.04 |
| array-reverse-nested       | off    | off     |     1 |      875.727 |   880.230 |  714.217 | 1.01 | 0.82 |
| array-reverse-nested       | off    | on      |     1 |    27930.895 | 27621.813 |  855.975 | 0.99 | 0.03 |
| array-reverse-nested       | on     | off     |     1 |      901.764 |   897.635 |  784.788 | 1.00 | 0.87 |
| array-reverse-nested       | on     | on      |     1 |    28614.099 | 28761.754 |  928.956 | 1.01 | 0.03 |

JSON retains per-process mean ranges, sample p50/p99 and counts, patch counts, fixture sizes, environment, and production/source hashes. Sample p99 can represent batches, not individual-request tail latency.
