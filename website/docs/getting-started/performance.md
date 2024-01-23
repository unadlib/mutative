---
sidebar_position: 5
---

# Performance

Mutative is a high-performance immutable data structure library, it is up to `2x-6x` faster than naive handcrafted reducer and up to `16x` faster than Immer.

## Mutative vs Reducer Performance

### Reducer by object

- Naive handcrafted reducer

```ts
// baseState type: Record<string, { value: number }>
const state = {
  ...baseState,
  key0: {
    ...baseState.key0,
    value: i,
  },
};
```

- Mutative

```ts
const state = create(baseState, (draft) => {
  draft.key0.value = i;
});
```

![Mutative vs Reducer benchmark by object](img/benchmark-object.jpg)

> Measure(seconds) to update the 1K-100K items object, lower is better([view source](https://github.com/unadlib/mutative/blob/main/test/performance/benchmark-object.ts)).


**Mutative is up to `2x` faster than naive handcrafted reducer for updating immutable objects.**

### Reducer by array

- Naive handcrafted reducer

```ts
// baseState type: { value: number }[]
const state = [
  { ...baseState[0], value: i },
  ...baseState.slice(1, baseState.length),
];
```

- Mutative

```ts
const state = create(baseState, (draft) => {
  draft[0].value = i;
});
```

![Mutative vs Reducer benchmark by array](img/benchmark-array.jpg)

> Measure(seconds) to update the 1K-100K items array, lower is better([view source](https://github.com/unadlib/mutative/blob/main/test/performance/benchmark-array.ts)).

**Mutative is up to `6x` faster than naive handcrafted reducer for updating immutable arrays.**


## Mutative vs Immer Performance

> Mutative passed all of Immer's test cases.

Measure(ops/sec) to update 50K arrays and 1K objects, bigger is better([view source](https://github.com/unadlib/mutative/blob/main/test/performance/benchmark.ts)). [Mutative v1.0.3 vs Immer v10.0.3]

![Benchmark](img/benchmark.jpg)

```
Naive handcrafted reducer - No Freeze x 4,476 ops/sec ±0.38% (96 runs sampled)
Mutative - No Freeze x 6,058 ops/sec ±0.91% (90 runs sampled)
Immer - No Freeze x 5.80 ops/sec ±0.34% (19 runs sampled)

Mutative - Freeze x 971 ops/sec ±1.07% (98 runs sampled)
Immer - Freeze x 380 ops/sec ±0.61% (94 runs sampled)

Mutative - Patches and No Freeze x 967 ops/sec ±0.94% (96 runs sampled)
Immer - Patches and No Freeze x 5.83 ops/sec ±0.17% (19 runs sampled)

Mutative - Patches and Freeze x 502 ops/sec ±0.94% (96 runs sampled)
Immer - Patches and Freeze x 278 ops/sec ±0.73% (90 runs sampled)

The fastest method is Mutative - No Freeze
```

Run `yarn benchmark` to measure performance.

> OS: macOS 12.6, CPU: Apple M1 Max, Node.js: 16.14.2

Immer relies on auto-freeze to be enabled, if auto-freeze is disabled, Immer will have a huge performance drop and Mutative will have a huge performance lead, especially with large data structures it will have a performance lead of more than 50x.

So if you are using Immer, you will have to enable auto-freeze for performance. Mutative is disabled auto-freeze by default. With the default configuration of both, we can see the 16x performance gap between Mutative (`6,058 ops/sec`) and Immer (`380 ops/sec`).

Overall, Mutative has a huge performance lead over Immer in [more performance testing scenarios](https://github.com/unadlib/mutative/tree/main/test/performance). Run `yarn performance` to get all the performance results locally.
