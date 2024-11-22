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

// slower 6x than Mutative
const state = [
  { ...baseState[0], value: i },
  ...baseState.slice(1, baseState.length),
];

// slower 2.5x than Mutative
// const state = baseState.map((item, index) =>
//   index === 0 ? { ...item, value: i } : item
// );

// same performance as Mutative
// const state = [...baseState];
// state[0] = { ...baseState[0], value: i };
```

> The actual difference depends on which spread operation syntax you use.

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

Measure(ops/sec) to update 50K arrays and 1K objects, bigger is better([view source](https://github.com/unadlib/mutative/blob/main/test/performance/benchmark.ts)). [Mutative v1.1.0 vs Immer v10.1.1]

![Benchmark](img/benchmark.jpg)

```
Naive handcrafted reducer - No Freeze x 4,670 ops/sec ±0.64% (96 runs sampled)
Mutative - No Freeze x 6,747 ops/sec ±0.61% (95 runs sampled)
Immer - No Freeze x 5.65 ops/sec ±1.53% (19 runs sampled)

Mutative - Freeze x 1,062 ops/sec ±0.74% (95 runs sampled)
Immer - Freeze x 394 ops/sec ±0.85% (93 runs sampled)

Mutative - Patches and No Freeze x 1,011 ops/sec ±0.24% (98 runs sampled)
Immer - Patches and No Freeze x 5.64 ops/sec ±0.22% (19 runs sampled)

Mutative - Patches and Freeze x 545 ops/sec ±1.19% (94 runs sampled)
Immer - Patches and Freeze x 215 ops/sec ±0.70% (86 runs sampled)

The fastest method is Mutative - No Freeze
```

Run `yarn benchmark` to measure performance.

> OS: macOS 14.7, CPU: Apple M1 Max, Node.js: v22.11.0

Immer relies on auto-freeze to be enabled, if auto-freeze is disabled, Immer will have a huge performance drop and Mutative will have a huge performance lead, especially with large data structures it will have a performance lead of more than 50x.

So if you are using Immer, you will have to enable auto-freeze for performance. Mutative is disabled auto-freeze by default. With the default configuration of both, we can see the 17x performance gap between Mutative (`6,747 ops/sec`) and Immer (`394 ops/sec`).

Overall, Mutative has a huge performance lead over Immer in [more performance testing scenarios](https://github.com/unadlib/mutative/tree/main/test/performance). Run `yarn performance` to get all the performance results locally.

## More Performance Testing Scenarios

Mutative is up to `2.5X-82.9X` faster than Immer:

![Mutative vs Immer - All benchmark results by average multiplier](img/all.jpg)

> [view source](https://github.com/unadlib/mutative/blob/main/test/benchmark).
