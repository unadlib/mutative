# Candidate Mutative vs pinned v1 and Immer

Recorded: 2026-09-30T15:51:15.024Z; 3 independent processes. Times are median process means in µs per complete scenario.

Candidate Mutative 1.3.0 at `ea629e1b8967bbe8200ce4f2dd9205eba664be8b`; pinned Mutative v1 1.3.0; pinned Immer 11.1.18. The candidate is only v2 when its actual package version is 2.x.

Environment: Apple M1 Max; Node v24.16.0, V8 13.6.233.17-node.49, darwin/arm64.

Production artifacts and their hashes are recorded in JSON. Array-method plugins are disabled. Setup and validation are excluded. Freeze-on inputs are pre-frozen; patch timing includes forward/inverse generation, excluding replay and serialization.

V1/C and I/C are time ratios to the candidate; values above 1 favor the candidate. Small differences do not establish a winner.

| Scenario                   | Freeze | Patches | Calls | Candidate µs |      V1 µs |  Immer µs | V1/C |  I/C |
| -------------------------- | ------ | ------- | ----: | -----------: | ---------: | --------: | ---: | ---: |
| read-index                 | off    | off     |     1 |     8209.532 |   8205.942 | 12583.785 | 1.00 | 1.53 |
| read-index                 | off    | on      |     1 |     8097.345 |   8048.414 | 12535.330 | 0.99 | 1.55 |
| read-index                 | on     | off     |     1 |     8088.567 |   8193.166 | 13036.809 | 1.01 | 1.61 |
| read-index                 | on     | on      |     1 |     8141.533 |   8219.217 | 12746.216 | 1.01 | 1.57 |
| read-forEach               | off    | off     |     1 |     6296.678 |   6346.936 |  8945.805 | 1.01 | 1.42 |
| read-forEach               | off    | on      |     1 |     6324.953 |   6503.187 |  9019.184 | 1.03 | 1.43 |
| read-forEach               | on     | off     |     1 |     6346.997 |   6510.158 |  9237.821 | 1.03 | 1.46 |
| read-forEach               | on     | on      |     1 |     6330.932 |   6365.715 |  9118.241 | 1.01 | 1.44 |
| read-missing               | off    | off     |     1 |     2914.820 |   2921.979 |  3662.941 | 1.00 | 1.26 |
| read-missing               | off    | on      |     1 |     2918.490 |   2903.340 |  3574.266 | 0.99 | 1.22 |
| read-missing               | on     | off     |     1 |     2964.446 |   2944.628 |  3832.411 | 0.99 | 1.29 |
| read-missing               | on     | on      |     1 |     2946.016 |   2954.454 |  3939.029 | 1.00 | 1.34 |
| mutation-density-100pct    | off    | off     |     1 |    13912.185 |  13864.554 | 13878.745 | 1.00 | 1.00 |
| mutation-density-100pct    | off    | on      |     1 |    21638.468 |  21835.365 | 24376.917 | 1.01 | 1.13 |
| mutation-density-100pct    | on     | off     |     1 |    16375.764 |  16396.253 | 17589.998 | 1.00 | 1.07 |
| mutation-density-100pct    | on     | on      |     1 |    24160.382 |  23654.865 | 27876.574 | 0.98 | 1.15 |
| array-reverse-primitive    | off    | off     |     1 |     4335.936 |   4334.454 |  4500.755 | 1.00 | 1.04 |
| array-reverse-primitive    | off    | on      |     1 |     5960.237 |   5688.633 |  6282.241 | 0.95 | 1.05 |
| array-reverse-primitive    | on     | off     |     1 |     4449.527 |   4431.391 |  5085.712 | 1.00 | 1.14 |
| array-reverse-primitive    | on     | on      |     1 |     6237.291 |   5904.493 |  6999.987 | 0.95 | 1.12 |
| array-shift-nested         | off    | off     |     1 |     9373.728 |  10721.600 |  9982.897 | 1.14 | 1.06 |
| array-shift-nested         | off    | on      |     1 |   281222.413 | 281544.892 | 11978.461 | 1.00 | 0.04 |
| array-shift-nested         | on     | off     |     1 |    10000.357 |   9774.093 | 10819.668 | 0.98 | 1.08 |
| array-shift-nested         | on     | on      |     1 |   283062.268 | 283497.552 | 12905.436 | 1.00 | 0.05 |
| array-unshift-nested       | off    | off     |     1 |     9668.627 |  10583.132 |  9949.510 | 1.09 | 1.03 |
| array-unshift-nested       | off    | on      |     1 |   280366.031 | 285453.607 | 12023.102 | 1.02 | 0.04 |
| array-unshift-nested       | on     | off     |     1 |     9858.443 |  10865.266 | 10690.883 | 1.10 | 1.08 |
| array-unshift-nested       | on     | on      |     1 |   285727.708 | 283062.278 | 12722.507 | 0.99 | 0.04 |
| array-splice-insert-nested | off    | off     |     1 |     4552.554 |   5089.080 |  4786.859 | 1.12 | 1.05 |
| array-splice-insert-nested | off    | on      |     1 |   141473.090 | 141556.312 |  5891.885 | 1.00 | 0.04 |
| array-splice-insert-nested | on     | off     |     1 |     4814.069 |   5375.875 |  5453.227 | 1.12 | 1.13 |
| array-splice-insert-nested | on     | on      |     1 |   147202.340 | 141086.066 |  6734.227 | 0.96 | 0.05 |
| array-reverse-nested       | off    | off     |     1 |    10033.327 |  11129.314 | 10004.823 | 1.11 | 1.00 |
| array-reverse-nested       | off    | on      |     1 |   281061.934 | 281393.028 | 11970.005 | 1.00 | 0.04 |
| array-reverse-nested       | on     | off     |     1 |    10358.848 |  11488.816 | 10856.477 | 1.11 | 1.05 |
| array-reverse-nested       | on     | on      |     1 |   288795.323 | 284175.601 | 13030.821 | 0.98 | 0.05 |

JSON retains per-process mean ranges, sample p50/p99 and counts, patch counts, fixture sizes, environment, and production/source hashes. Sample p99 can represent batches, not individual-request tail latency.
