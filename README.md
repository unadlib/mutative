# Mutative

![Node CI](https://github.com/unadlib/mutative/workflows/Node%20CI/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/unadlib/mutative/badge.svg?branch=master)](https://coveralls.io/github/unadlib/mutative?branch=master)
[![npm](https://img.shields.io/npm/v/mutative.svg)](https://www.npmjs.com/package/mutative)
![license](https://img.shields.io/npm/l/mutative)

**Mutative** - A JavaScript library for efficient immutable updates, 10x faster than Immer by default, even faster than naive handcrafted reducer.

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
| Support IE browser        |       ❌ |  ✅   |

> Mutative draft functions don't allow return value (except for `void` or `Promise<void>`), but Immer is allowed.

Mutative has fewer bugs such as accidental draft escapes than Immer, [view details](https://github.com/unadlib/mutative/blob/main/test/immer-non-support.test.ts).

## Installation

```sh
yarn install mutative # npm install mutative
```

## Usage

```ts
import { create } from 'mutative';

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

The first argument of `create()` is the base state. Mutative drafts it and passes it to the arguments of the draft function, and performs the draft mutation until the draft function finishes, then Mutative will finalize it and produce the new state.

Use `create()` for more advanced functions by setting `options`.

## APIs

### `create()`

Use `create()` for draft mutation to get a new state, which also supports currying.

```ts
import { create } from 'mutative';

const baseState = {
  foo: 'bar',
  list: [{ text: 'todo' }],
};

const state = create(baseState, (draft) => {
  draft.foo = 'foobar';
  draft.list.push({ text: 'learning' });
});
```

In this basic example, the changes to the draft are 'mutative' within the draft callback, and `create()` is finally executed with a new immutable state.

#### `create(state, fn, options)` - Then options is optional.

- strict - `boolean`, the default is false.

  > Forbid accessing non-draftable values in strict mode(unless using `unsafe()`).

- enablePatches - `boolean`, the default is false.

  > Enable patch, and return the patches and inversePatches.

- enableAutoFreeze - `boolean`, the default is false.

  > Enable autoFreeze, and return frozen state.

- mark - `() => ('mutable'|'immutable'|function)`
  > Set a mark to determine if the object is mutable or if an instance is an immutable, and it can also return a shallow copy function(AutoFreeze and Patches should both be disabled).

#### `create()` - Currying

- create `draft`

```ts
const [draft, finalize] = create(baseState);
draft.foobar.bar = 'baz';
const state = finalize();
```

- create `producer`

```ts
const producer = create(() => {
  draft.foobar.bar = 'baz';
});
const state = producer(baseState);
```

> They also all support set options such as `const [draft, finalize] = create(baseState, { enableAutoFreeze: true });`

### `apply()`

Use `apply()` for patches to get the new state.

```ts
import { create, apply } from 'mutative';

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

Get the current value in the draft.

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

Get the original value in the draft.

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

When strict mode is enabled, mutable data can only be accessed using `unsafe()`.

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

Check if it is a draft.

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
- `Options<O, F>`

### Integration with React

- [use-mutative](https://github.com/unadlib/use-mutative)

## FAQs

- Why doesn't Mutative support IE?

Mutative is a library that relies heavily on the use of the Proxy object, which is a feature of modern web browsers that allows the interception of various operations on objects. As such, Mutative may not be fully compatible with older browsers that do not support the Proxy object, such as Internet Explorer. However, these older browsers make up a very small percentage of the overall browser market, so the impact on compatibility is likely minimal.

- Why does Mutative have such good performance?

Mutative optimization focus is on shallow copy optimization, more complete lazy drafts, finalization process optimization, and more.

- I'm already using Immer, can I migrate smoothly to Mutative?

Yes. Unless you have to be compatible with Internet Explorer, Mutative supports almost all of Immer features, and you can easily migrate from Immer to Mutative.

> Migration is also not possible for React Native that does not support Proxy. React Native uses a new JS engine during refactoring - Hermes, and it (if < v0.59 or when using the Hermes engine on React Native < v0.64) does [not support Proxy on Android](https://github.com/facebook/hermes/issues/33), but [React Native v0.64  with the Hermes engine support Proxy](https://reactnative.dev/blog/2021/03/12/version-0.64#hermes-with-proxy-support).

- Why return values are not supported?

If it is supported, there is an additional performance loss of traversing the returned object tree. Also Immer has draft [escape issues](https://github.com/unadlib/mutative/blob/main/test/immer-non-support.test.ts#L327) for return values.

- Can Mutative be integrated with Redux?

Yes.

## Migration from Immer to Mutative

1. `produce()` -> `create()`

Mutative auto freezing option is disabled by default, Immer auto freezing option is enabled by default (if disabled, Immer performance will have a more huge drop).

> You need to check if auto freezing has any impact on your project. If it depends on auto freezing, you can enable it yourself in Mutative.

```ts
import produce from 'immer';

const nextState = produce(baseState, (draft) => {
  draft[1].done = true;
  draft.push({ title: 'something' });
});
```

Use Mutative

```ts
import { create } from 'mutative';

const nextState = create(baseState, (draft) => {
  draft[1].done = true;
  draft.push({ title: 'something' });
});
```

2. `Patches`

```ts
import { produceWithPatches, applyPatches } from 'immer';

enablePatches();

const baseState = {
  age: 33,
};

const [nextState, patches, inversePatches] = produceWithPatches(
  baseState,
  (draft) => {
    draft.age++;
  }
);

const state = applyPatches(nextState, inversePatches);

expect(state).toEqual(baseState);
```

Use Mutative

```ts
import { create, apply } from 'mutative';

const baseState = {
  age: 33,
};

const [nextState, patches, inversePatches] = create(
  baseState,
  (draft) => {
    draft.age++;
  },
  {
    enablePatches: true,
  }
);

const state = apply(nextState, inversePatches);

expect(state).toEqual(baseState);
```

TBD
