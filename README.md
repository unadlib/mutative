# Mutative

![Node CI](https://github.com/unadlib/mutative/workflows/Node%20CI/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/unadlib/mutative/badge.svg?branch=main)](https://coveralls.io/github/unadlib/mutative?branch=main)
[![npm](https://img.shields.io/npm/v/mutative.svg)](https://www.npmjs.com/package/mutative)
![license](https://img.shields.io/npm/l/mutative)

**Mutative** - A JavaScript library for efficient immutable updates, 10x faster than Immer by default, even faster than naive handcrafted reducer.

![Benchmark](benchmark.jpg)

## Motivation

Writing immutable updates by hand is usually difficult, prone to errors, and cumbersome. Immer helps us write simpler immutable updates with "mutative" logic.

But its performance issue causes a runtime performance overhead. Immer must have auto-freeze enabled by default(Performance will be worse if auto-freeze is disabled), such immutable state with Immer is not common. In scenarios such as cross-processing, remote data transfer, etc., we have to constantly freeze these immutable data.

There are more parts that could be improved, such as better type inference, non-intrusive markup, support for more types of immutability, Safer immutability, [more edge cases](test/immer-non-support.test.ts), and so on.

This is why Mutative was created.

## Mutative vs Immer Performance

> Mutative passed all of Immer's test cases.

Measure(ops/sec) to update 50K arrays and 1K objects, bigger is better([view source](https://github.com/unadlib/mutative/blob/main/test/performance/benchmark.ts)). [Mutative v0.5.0 vs Immer v10.0.1]

```
Naive handcrafted reducer - No Freeze x 4,258 ops/sec ±1.14% (89 runs sampled)
Mutative - No Freeze x 6,421 ops/sec ±1.73% (91 runs sampled)
Immer - No Freeze x 5.11 ops/sec ±0.78% (17 runs sampled)

Mutative - Freeze x 838 ops/sec ±0.31% (96 runs sampled)
Immer - Freeze x 365 ops/sec ±0.57% (94 runs sampled)

Mutative - Patches and No Freeze x 762 ops/sec ±1.16% (94 runs sampled)
Immer - Patches and No Freeze x 5.05 ops/sec ±0.26% (17 runs sampled)

Mutative - Patches and Freeze x 411 ops/sec ±0.46% (92 runs sampled)
Immer - Patches and Freeze x 266 ops/sec ±0.69% (92 runs sampled)

The fastest method is Mutative - No Freeze
```

Run `yarn benchmark` to measure performance.

> OS: macOS 12.6, CPU: Apple M1 Max, Node.js: 16.14.2

Immer relies on auto-freeze to be enabled, if auto-freeze is disabled, Immer will have a huge performance drop and Mutative will have a huge performance lead, especially with large data structures it will have a performance lead of more than 50x.

So if you are using Immer, you will have to enable auto-freeze for performance. Mutative is disabled auto-freeze by default. With the default configuration of both, we can see the performance gap between Mutative (`6,217 ops/sec`) and Immer (`321 ops/sec`).

Overall, Mutative has a huge performance lead over Immer in [more performance testing scenarios](https://github.com/unadlib/mutative/tree/main/test/performance). Run `yarn performance` to get all the performance results locally.

## Features and Benefits

- **Mutation makes immutable updates** - Immutable data structures supporting objects, arrays, Sets and Maps.
- **High performance** - 10x faster than immer by default, even faster than naive handcrafted reducer.
- **Optional freezing state** - No freezing of immutable data by default.
- **Support for JSON Patch** - Full compliance with JSON Patch specification.
- **Custom shallow copy** - Support for more types of immutable data.
- **Support mark for immutable and mutable data** - Allows for non-invasive marking.
- **Safer mutable data access in strict mode** - It brings more secure immutable updates.
- **Support for reducer** - Support reducer function and any other immutable state library.

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

Mutative has fewer bugs such as accidental draft escapes than Immer, [view details](https://github.com/unadlib/mutative/blob/main/test/immer-non-support.test.ts).

## Installation

Yarn

```sh
yarn add mutative
```

NPM

```sh
npm install mutative
```

CDN

- Unpkg: `<script src="https://unpkg.com/mutative"></script>`
- JSDelivr: `<script src="https://cdn.jsdelivr.net/npm/mutative"></script>`

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

Use `create()` for more advanced features by [setting `options`](#createstate-fn-options---then-options-is-optional).

## APIs

- [`create()`](#create)
- [`apply()`](#apply)
- [`current()`](#current)
- [`original()`](#original)
- [`unsafe()`](#unsafe)
- [`isDraft()`](#isDraft)
- [`isDraftable()`](#isDraftable)
- [`rawReturn()`](#rawReturn)

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

  > Forbid accessing non-draftable values in strict mode(unless using [unsafe()](#unsafe)).

  > It is recommended to enable `strict` in development mode and disable `strict` in production mode. This will ensure safe explicit returns and also keep good performance in the production build. If the value that does not mix any current draft or is `undefined` is returned, then use [rawReturn()](#rawreturn).

- enablePatches - `boolean | { pathAsArray?: boolean; arrayLengthAssignment?: boolean; }`, the default is false.

  > Enable patch, and return the patches/inversePatches.

  > If you need to set the shape of the generated patch in more detail, then you can set `pathAsArray` and `arrayLengthAssignment`。`pathAsArray` default value is `true`, if it's `true`, the path will be an array, otherwise it is a string; `arrayLengthAssignment` default value is `true`, if it's `true`, the array length will be included in the patches, otherwise no include array length(**NOTE**: If `arrayLengthAssignment` is `false`, it is fully compatible with JSON Patch spec, but it may have additional performance loss).

- enableAutoFreeze - `boolean`, the default is false.

  > Enable autoFreeze, and return frozen state, and enable circular reference checking only in `development` mode.

- mark - `(target) => ('mutable'|'immutable'|function)`
  > Set a mark to determine if the value is mutable or if an instance is an immutable, and it can also return a shallow copy function(AutoFreeze and Patches should both be disabled).

#### `create()` - Currying

- create `draft`

```ts
const [draft, finalize] = create(baseState);
draft.foobar.bar = 'baz';
const state = finalize();
```

> Support set options such as `const [draft, finalize] = create(baseState, { enableAutoFreeze: true });`

- create `producer`

```ts
const produce = create((draft) => {
  draft.foobar.bar = 'baz';
});
const state = produce(baseState);
```

> Also support set options such as `const produce = create((draft) => {}, { enableAutoFreeze: true });`

### `apply()`

Use `apply()` for applying patches to get the new state.

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

Get the current value from a draft.

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

Get the original value from a draft.

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
    // or return the mutable data:
    // const date = unsafe(() => draft.date);
  },
  {
    strict: true,
  }
);
```

### `isDraft()`

Check if a value is a draft.

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

### `isDraftable()`

Check if a value is draftable

```ts
const baseState = {
  date: new Date(),
  list: [{ text: 'todo' }],
};

expect(isDraftable(baseState.date)).toBeFalsy();
expect(isDraftable(baseState.list)).toBeTruthy();
```

> You can set a mark to determine if the value is draftable, and the mark function should be the same as passing in `create()` mark option.

### `rawReturn()`

For return values that do not contain any drafts, you can use `rawReturn()` to wrap this return value to improve performance. It ensure that the return value is only returned explicitly.

```ts
const baseState = { id: 'test' };
const state = create(baseState as { id: string } | undefined, (draft) => {
  return rawReturn(undefined);
});
expect(state).toBe(undefined);
```

> You don't need to use `rawReturn()` when the return value have any draft.

```ts
const baseState = { a: 1, b: { c: 1 } };
const state = create(baseState, (draft) => {
  if (draft.b.c === 1) {
    return {
      ...draft,
      a: 2,
    };
  }
});
expect(state).toEqual({ a: 2, b: { c: 1 } });
expect(isDraft(state.b)).toBeFalsy();
```

If you use `rawReturn()`, we recommend that you enable `strict` mode in development.

```ts
const baseState = { a: 1, b: { c: 1 } };
const state = create(
  baseState,
  (draft) => {
    if (draft.b.c === 1) {
      return rawReturn({
        ...draft,
        a: 2,
      });
    }
  },
  {
    strict: true,
  }
);
// it will warn `The return value contains drafts, please don't use 'rawReturn()' to wrap the return value.` in strict mode.
expect(state).toEqual({ a: 2, b: { c: 1 } });
expect(isDraft(state.b)).toBeFalsy();
```

[View more API docs](./docs/README.md).

## Using TypeScript

- `castDraft()`
- `castImmutable()`
- `Draft<T>`
- `Immutable<T>`
- `Patches`
- `Patch`
- `Options<O, F>`

## Integration with React

- [use-mutative](https://github.com/unadlib/use-mutative)

## FAQs

- Why does Mutative have such good performance?

Mutative optimization focus on shallow copy optimization, more complete lazy drafts, finalization process optimization, and more.

- I'm already using Immer, can I migrate smoothly to Mutative?

Yes. Unless you have to be compatible with Internet Explorer, Mutative supports almost all of Immer features, and you can easily migrate from Immer to Mutative.

> Migration is also not possible for React Native that does not support Proxy. React Native uses a new JS engine during refactoring - Hermes, and it (if < v0.59 or when using the Hermes engine on React Native < v0.64) does [not support Proxy on Android](https://github.com/facebook/hermes/issues/33), but [React Native v0.64 with the Hermes engine support Proxy](https://reactnative.dev/blog/2021/03/12/version-0.64#hermes-with-proxy-support).

- Can Mutative be integrated with Redux?

Yes. Mutative supports return values for reducer, and `redux-toolkit` is considering support for [configurable `produce()`](https://github.com/reduxjs/redux-toolkit/pull/3074).

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

3. Return `undefined`

```ts
import produce, { nothing } from 'immer';

const nextState = produce(baseState, (draft) => {
  return nothing;
});
```

Use Mutative

```ts
import { create, rawReturn } from 'mutative';

const nextState = create(baseState, (draft) => {
  return rawReturn(undefined);
});
```

## Contributing

Mutative goal is to provide efficient and immutable updates. The focus is on performance improvements and providing better APIs for better development experiences. We are still working on it and welcome PRs that may help Mutative.

Development Workflow:

- Clone Mutative repo.
- Run `yarn install` to install all the dependencies.
- Run `yarn prettier` to format the code.
- `yarn test --watch` runs an interactive test watcher.
- Run `yarn commit` to make a git commit.

## License

Mutative is [MIT licensed](https://github.com/unadlib/mutative/blob/main/LICENSE).
