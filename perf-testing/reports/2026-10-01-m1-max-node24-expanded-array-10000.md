# Candidate Mutative vs pinned v1 and Immer

Recorded: 2026-10-01T10:31:02.664Z; 3 independent processes. Times are median process means in µs per complete scenario.

Candidate Mutative 1.3.0 at `027e23edd2145c8fb80d8f20e1a10e9bb30d7999`; pinned Mutative v1 1.3.0; pinned Immer 11.1.18. The candidate is only v2 when its actual package version is 2.x.

Environment: Apple M1 Max; Node v24.16.0, V8 13.6.233.17-node.49, darwin/arm64.

Production artifacts and their hashes are recorded in JSON. Array-method plugins are disabled. Setup and validation are excluded. Freeze-on inputs are pre-frozen; patch timing includes forward/inverse generation, excluding replay and serialization.

V1/C and I/C are time ratios to the candidate; values above 1 favor the candidate. Small differences do not establish a winner.

| Scenario | Freeze | Patches | Calls | Candidate µs | V1 µs | Immer µs | V1/C | I/C |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| read-index | off | off | 1 | 5192.678 | 7968.344 | 9880.680 | 1.53 | 1.90 |
| read-index | off | on | 1 | 5232.228 | 7990.501 | 9915.235 | 1.53 | 1.90 |
| read-index | on | off | 1 | 5298.850 | 8027.468 | 10112.091 | 1.51 | 1.91 |
| read-index | on | on | 1 | 5270.916 | 8013.113 | 10156.617 | 1.52 | 1.93 |
| read-forEach | off | off | 1 | 4060.819 | 6147.640 | 6460.221 | 1.51 | 1.59 |
| read-forEach | off | on | 1 | 4064.884 | 6224.840 | 6462.636 | 1.53 | 1.59 |
| read-forEach | on | off | 1 | 4095.987 | 6159.442 | 6700.871 | 1.50 | 1.64 |
| read-forEach | on | on | 1 | 4082.244 | 6155.326 | 6773.626 | 1.51 | 1.66 |
| read-missing | off | off | 1 | 1878.008 | 2886.160 | 2662.715 | 1.54 | 1.42 |
| read-missing | off | on | 1 | 1874.444 | 2878.933 | 2643.561 | 1.54 | 1.41 |
| read-missing | on | off | 1 | 1908.412 | 2886.069 | 2962.770 | 1.51 | 1.55 |
| read-missing | on | on | 1 | 1923.518 | 2893.617 | 2914.783 | 1.50 | 1.52 |
| mutation-density-100pct | off | off | 1 | 7146.312 | 13328.071 | 11397.937 | 1.87 | 1.59 |
| mutation-density-100pct | off | on | 1 | 11488.806 | 20837.400 | 21486.071 | 1.81 | 1.87 |
| mutation-density-100pct | on | off | 1 | 9223.748 | 15662.101 | 14878.733 | 1.70 | 1.61 |
| mutation-density-100pct | on | on | 1 | 13841.427 | 22746.402 | 24087.464 | 1.64 | 1.74 |
| array-reverse-primitive | off | off | 1 | 2888.809 | 4292.766 | 4329.548 | 1.49 | 1.50 |
| array-reverse-primitive | off | on | 1 | 4558.873 | 5596.097 | 6078.098 | 1.23 | 1.33 |
| array-reverse-primitive | on | off | 1 | 2996.585 | 4395.529 | 4875.065 | 1.47 | 1.63 |
| array-reverse-primitive | on | on | 1 | 4704.111 | 5748.082 | 6653.166 | 1.22 | 1.41 |
| array-shift-nested | off | off | 1 | 5101.396 | 9022.313 | 8236.946 | 1.77 | 1.61 |
| array-shift-nested | off | on | 1 | 6811.539 | 277723.524 | 9749.525 | 40.77 | 1.43 |
| array-shift-nested | on | off | 1 | 5277.057 | 10403.136 | 9025.812 | 1.97 | 1.71 |
| array-shift-nested | on | on | 1 | 7011.401 | 283980.177 | 10576.123 | 40.50 | 1.51 |
| array-unshift-nested | off | off | 1 | 5629.020 | 10203.397 | 8161.725 | 1.81 | 1.45 |
| array-unshift-nested | off | on | 1 | 7254.666 | 273442.337 | 9828.134 | 37.69 | 1.35 |
| array-unshift-nested | on | off | 1 | 5723.086 | 10365.377 | 9052.568 | 1.81 | 1.58 |
| array-unshift-nested | on | on | 1 | 7466.401 | 283738.337 | 10524.482 | 38.00 | 1.41 |
| array-splice-insert-nested | off | off | 1 | 2766.897 | 4877.643 | 3957.163 | 1.76 | 1.43 |
| array-splice-insert-nested | off | on | 1 | 3544.207 | 135566.739 | 4912.134 | 38.25 | 1.39 |
| array-splice-insert-nested | on | off | 1 | 3013.113 | 5189.871 | 4618.950 | 1.72 | 1.53 |
| array-splice-insert-nested | on | on | 1 | 3881.776 | 137667.931 | 5507.674 | 35.47 | 1.42 |
| array-reverse-nested | off | off | 1 | 5668.571 | 10377.246 | 8326.519 | 1.83 | 1.47 |
| array-reverse-nested | off | on | 1 | 7736.579 | 284332.413 | 9940.651 | 36.75 | 1.28 |
| array-reverse-nested | on | off | 1 | 5847.269 | 10776.705 | 9062.466 | 1.84 | 1.55 |
| array-reverse-nested | on | on | 1 | 7828.177 | 290050.854 | 10739.398 | 37.05 | 1.37 |

JSON retains per-process mean ranges, sample p50/p99 and counts, patch counts, fixture sizes, environment, and production/source hashes. Sample p99 can represent batches, not individual-request tail latency.
