---
sidebar_position: 1
---

# Comparison with Immer

Mutative is a high-performance immutable update library, and Immer is a popular immutable update library. This page compares the differences between Mutative and Immer.

## Difference between Mutative and Immer

|                                       | Mutative | Immer |
| :------------------------------------ | -------: | :---: |
| Custom shallow copy                   |       ✅ |  ❌   |
| Strict mode                           |       ✅ |  ❌   |
| No data freeze by default             |       ✅ |  ❌   |
| Non-invasive marking                  |       ✅ |  ❌   |
| Complete freeze data                  |       ✅ |  ❌   |
| Non-global config                     |       ✅ |  ❌   |
| async draft function                  |       ✅ |  ❌   |
| Fully compatible with JSON Patch spec |       ✅ |  ❌   |
| new Set methods(Mutative v1.1.0+)     |       ✅ |  ❌   |

Mutative has fewer bugs such as accidental draft escapes than Immer, [view details](https://github.com/unadlib/mutative/blob/main/test/immer-non-support.test.ts).

The [Immer array methods audit](https://github.com/unadlib/mutative/blob/main/test/immer-array-methods.md) reproduces patch ordering, base mutation, and draft finalization failures in Immer 11.1.18 when `enableArrayMethods()` is enabled. The [reproduction tests](https://github.com/unadlib/mutative/blob/main/test/immer-array-methods.test.ts) include plugin-disabled controls and the same recipes run against Mutative. This correctness audit is separate from the performance measurements below.

## Mutative vs Immer Performance

> Mutative passed all of Immer's test cases.

With matched settings, both freezing or both not and both generating patches or both not, Mutative was faster than Immer 11.1.18 in 508 of 530 measured cases, 3.1x on geometric mean. With each library's defaults, Mutative without auto-freeze and Immer with it, Mutative was faster in 133 of 136 cases, 6.0x on geometric mean. Immer was faster when a producer returns a new state built from frozen data, when applying patches that replace nested values, and, with auto-freeze, when updating class instances with 1,000 fields.

With patches on and auto-freeze off, Mutative was faster in 126 of 129 cases and never slower, and faster in every array case: 4.0x Immer and 13x Mutative 1.3.0 on geometric mean. The comparisons run Immer without its `enableArrayMethods()` plugin. In Immer 11.1.18 the plugin returns raw base objects from `shift`, `pop` and `splice`, so editing them changes the previous state, and its patches can fail to replay; the audit above reproduces these failures.

See [Performance](/docs/getting-started/performance) for selected results, and the [performance summary](https://github.com/unadlib/mutative/blob/main/perf-testing/reports/SUMMARY.md) for the complete results, the method, and their limits.
