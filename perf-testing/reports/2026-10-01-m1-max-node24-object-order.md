# Candidate Mutative vs pinned v1 and Immer

Recorded: 2026-10-01T10:31:37.350Z; 6 independent processes. Times are median process means in µs per complete scenario.

Candidate Mutative 1.3.0 at `027e23edd2145c8fb80d8f20e1a10e9bb30d7999`; pinned Mutative v1 1.3.0; pinned Immer 11.1.18. The candidate is only v2 when its actual package version is 2.x.

Environment: Apple M1 Max; Node v24.16.0, V8 13.6.233.17-node.49, darwin/arm64.

Production artifacts and their hashes are recorded in JSON. Array-method plugins are disabled. Setup and validation are excluded. Freeze-on inputs are pre-frozen; patch timing includes forward/inverse generation, excluding replay and serialization.

V1/C and I/C are time ratios to the candidate; values above 1 favor the candidate. Small differences do not establish a winner.

| Scenario | Freeze | Patches | Calls | Candidate µs | V1 µs | Immer µs | V1/C | I/C |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| update-largeObject1 | off | off | 1 | 76.973 | 137.665 | 202.364 | 1.79 | 2.63 |

JSON retains per-process mean ranges, sample p50/p99 and counts, patch counts, fixture sizes, environment, and production/source hashes. Sample p99 can represent batches, not individual-request tail latency.
