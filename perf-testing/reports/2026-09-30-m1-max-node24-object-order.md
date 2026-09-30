# Mutative vs Immer workload benchmarks

Recorded: 2026-09-30T08:44:37.314Z. 6 independent Node processes; median of each process's mean time.

Local Mutative **1.3.0** at `9184acb7760643fca890af9ccce1c10c2445c668`; installed Immer **11.1.18**; Mitata **1.0.34**.

Environment: Apple M1 Max, 64 GiB RAM, darwin/arm64, Node v24.16.0, V8 13.6.233.17-node.49.

Fixture: array 100, 10 nested items/row, objects with 1000/3000 properties; reuse 10 calls; RTKQ 100 pending + 100 resolved calls.

Both libraries use production artifacts. Array-method plugins and patches are disabled. Freeze off uses unfrozen inputs; freeze on uses pre-frozen inputs and payloads. Construction, configuration, and correctness checks are outside timing. Each iteration resets to its immutable base and evolves it only within that scenario.

Times are **microseconds per full scenario**, including natural GC. Ratio = Immer time / Mutative time; above 1 favors Mutative, below 1 favors Immer. These are scenario measurements, not a universal speedup. P99 describes Mitata samples, which can be batches of operations; it is not per-request tail latency.

## Auto-freeze off (unfrozen input)

| Scenario            | Calls | Mutative µs | Immer µs |  I/M | Mutative sample p99 µs | Immer sample p99 µs |
| ------------------- | ----: | ----------: | -------: | ---: | ---------------------: | ------------------: |
| update-largeObject1 |     1 |     145.328 |  207.012 | 1.42 |                264.313 |             493.500 |

Independent-process mean ranges (µs):

| Scenario            | Mutative min–max |   Immer min–max |
| ------------------- | ---------------: | --------------: |
| update-largeObject1 |   57.374–235.364 | 206.334–222.361 |

The accompanying JSON retains every process result, sample count, timing percentiles, measurement order, artifact SHA-256 hashes, configuration, and environment metadata.
