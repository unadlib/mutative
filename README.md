# Mutative

![Node CI](https://github.com/unadlib/mutative/workflows/Node%20CI/badge.svg)
[![npm](https://img.shields.io/npm/v/mutative.svg)](https://www.npmjs.com/package/mutative)
![license](https://img.shields.io/npm/l/mutative)

**Mutative** - A JavaScript library for efficient immutable updates, 10x faster than Immer by default.

![Benchmark](./benchmark.jpg)

## Motivation

Writing immutable updates by hand is usually difficult, prone to errors and cumbersome. Immer helps us write simpler immutable updates with "mutative" logic.

But its [performance issue](https://github.com/immerjs/immer/issues?q=is%3Aissue+is%3Aopen+performance) causes a runtime performance overhead. Immer must have auto-freeze enabled by default(Performance will be worse if auto-freeze is disabled), such immutable state with Immer are not common. In scenarios such as cross-process, remote data transfer, etc., we have to constantly freeze these immutable data.

There are more parts that could be improved, such as better type inference, non-intrusive markup, support for more types of immutability, Safer immutability, and so on.

This is why Mutative was created.

## Mutative vs Immer Performance

Measure(ops/sec) to update 50K arrays and 1K objects, bigger the better([view source](https://github.com/unadlib/mutative/blob/main/test/performance/benchmark.ts)).

```
Naive handcrafted reducer - No Freeze x 3,713 ops/sec ±0.86% (89 runs sampled)
Mutative - No Freeze x 5,323 ops/sec ±1.69% (93 runs sampled)
Immer - No Freeze x 8 ops/sec ±0.88% (23 runs sampled)

Mutative - Freeze x 875 ops/sec ±1.20% (95 runs sampled)
Immer - Freeze x 320 ops/sec ±0.45% (92 runs sampled)

Mutative - Patches and No Freeze x 752 ops/sec ±0.16% (96 runs sampled)
Immer - Patches and No Freeze x 7 ops/sec ±1.32% (23 runs sampled)

Mutative - Patches and Freeze x 425 ops/sec ±0.33% (95 runs sampled)
Immer - Patches and Freeze x 239 ops/sec ±0.99% (89 runs sampled)

The fastest method is Mutative - No Freeze
```

Run `yarn benchmark` to reproduce them locally.

> OS: macOS 12.6, CPU: Apple M1 Max, Node.js: 16.14.2

Immer relies on auto-freeze to be enabled, if auto-freeze is disabled, Immer will have a huge performance drop and Mutative will have a huge performance lead, especially with large data structures it will have a performance lead of more than 50x.

So if you are using Immer, you will have to enable auto-freeze for performance. Mutative allows to disable auto-freeze by default. With the default configuration of both, we can see the performance gap between Mutative (`5,323 ops/sec`) and Immer (`320 ops/sec`).

Overall, Mutative has a huge performance lead over Immer in [more performance testing scenarios](https://github.com/unadlib/mutative/tree/main/test/performance). Run `yarn performance` to get all the performance results locally.

## Features and Benefits

- **Mutation makes immutable updates**
- **Support apply patches**
- **Optional freezing state**
- **Custom shallow copy**
- **Immutable and mutable data markable**
- **Strict mode for safer mutable data access**
- **Support for JSON patches**

> Mutative Size: 4.11 kB with all dependencies, minified and gzipped.

## Difference between Mutative and Immer

| -                         | Mutative | Immer |
| :------------------------ | -------: | :---: |
| Custom shallow copy       |       ✅ |  ❌   |
| Strict mode               |       ✅ |  ❌   |
| No data freeze by default |       ✅ |  ❌   |
| Non-invasive marking      |       ✅ |  ❌   |
| Complete freeze data      |       ✅ |  ❌   |
| Non-global config         |       ✅ |  ❌   |

## Installation

```sh
yarn install mutative # npm install mutative
```

## Usage

```ts
const baseState = {
  foo: 'bar',
  list: [{ text: 'coding' }],
};

const state = create(baseState, (draft) => {
  draft.foo = 'foobar';
  draft.list.push({ text: 'learning' });
});
```

`create(baseState, (draft) => void, options?: Options): newState`

TBD

Use `create()` for more advanced functions by setting `options`.

## APIs

### `create()`

```ts
const baseState = {
  foo: 'bar',
  list: [{ text: 'todo' }],
};

const state = create(baseState, (draft) => {
  draft.foo = 'foobar';
  draft.list.push({ text: 'learning' });
});
```

TBD

#### `create(state, fn, options)` - Then options is optional.

- strict - `boolean`, the default is false.

  > Forbid accessing non-draftable values in strict mode.

- enablePatches - `boolean`, the default is false.

  > Enable patch, and return the patches and inversePatches.

- enableAutoFreeze - `boolean`, the default is false.

  > Enable autoFreeze, and return frozen state.

- mark - `() => ('mutable'|'immutable'|function)`
  > Set a mark to determine if the object is mutable or if an instance is an immutable, and it can also return a shallow copy function(AutoFreeze and Patches should both be disabled).

#### `create()` Curried producers

TBD

### `apply()`

TBD

```ts
const baseState = {
  foo: 'bar',
  list: [{ text: 'todo' }],
};

const [state, patches, inversePatches] = create(
  baseState,
  (draft) => {
    draft.foo = 'foobar';
    draft.list.push({ text: 'learning' });
  },
  {
    enablePatches: true,
  }
);

const nextState = apply(baseState, patches);
expect(nextState).toEqual(state);
const prevState = apply(state, inversePatches);
expect(prevState).toEqual(baseState);
```

### `current()`

TBD

```ts
const baseState = {
  foo: 'bar',
  list: [{ text: 'todo' }],
};

const state = create(baseState, (draft) => {
  draft.foo = 'foobar';
  draft.list.push({ text: 'learning' });
  expect(current(draft.list)).toEqual([{ text: 'todo' }, { text: 'learning' }]);
});
```

### `original()`

TBD

```ts
const baseState = {
  foo: 'bar',
  list: [{ text: 'todo' }],
};

const state = create(baseState, (draft) => {
  draft.foo = 'foobar';
  draft.list.push({ text: 'learning' });
  expect(original(draft.list)).toEqual([{ text: 'todo' }]);
});
```

### `unsafe()`

```ts
const baseState = {
  list: [],
  date: new Date(),
};

const state = create(
  baseState,
  (draft) => {
    unsafe(() => {
      draft.date.setFullYear(2000);
    });
  },
  {
    strict: true,
  }
);
```

### `isDraft()`

```ts
const baseState = {
  date: new Date(),
  list: [{ text: 'todo' }],
};

const state = create(baseState, (draft) => {
  expect(isDraft(draft.date)).toBeFalsy();
  expect(isDraft(draft.list)).toBeTruthy();
});
```

### Using TypeScript

- `castDraft()`
- `castImmutable()`
- `Mutable<T>`
- `Immutable<T>`
- `Patches`
- `Patch`

## Migration from Immer to Mutative

TBD

## FAQs

TBD
