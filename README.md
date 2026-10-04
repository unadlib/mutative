# Mutative

<a href="https://mutative.js.org/" target="_blank"><img src="https://raw.githubusercontent.com/unadlib/mutative/main/website/static/img/ mutative.png" height="120" alt="Mutative Logo" style="max-width: 100%;height: 128px;"/></a>

![Node CI](https://github.com/unadlib/mutative/workflows/Node%20CI/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/unadlib/mutative/badge.svg?branch=main)](https://coveralls.io/github/unadlib/mutative?branch=main)
[![npm](https://img.shields.io/npm/v/mutative.svg)](https://www.npmjs.com/package/mutative)
[![NPM Downloads](https://img.shields.io/npm/dm/mutative)](https://npmtrends.com/mutative)
![license](https://img.shields.io/npm/l/mutative)

**Mutative** - A JavaScript library for efficient immutable updates. Across [90 benchmarked workloads](./perf-testing/reports/SUMMARY.md), it is about 3x faster than Immer with the same settings and 6x faster out of the box.

The gap widens on large arrays, where Mutative moves elements up to 1,125x faster than Immer. When copying dominates, such as updating objects with thousands of keys or inserting at the front of a large array, Mutative is even faster than hand-written spread reducers.

**How does Mutative compare with the spread operation (hand-written reducers)?**

- <a href="https://www.richsnapp.com/article/2019/06-09-reduce-spread-anti-pattern" target="_blank">The reduce ({...spread}) anti-pattern</a>
- <a href="https://jonlinnell.co.uk/articles/spread-operator-performance?fbclid=IwAR0mElQwz2aOxl8rcsqoYwkcQDlcXcwuyIsTmTAbmyzrarysS8-BC1lSY9k" target="_blank">How slow is the Spread operator in JavaScript?</a>

Mutative copies each object at most once per update, however many changes a recipe makes, and focuses on shallow copy optimization, more complete lazy drafts, finalization process optimization, and more.

## Motivation

Writing immutable updates by hand is usually difficult, prone to errors, and cumbersome. Immer helps us write simpler immutable updates with "mutative" logic.

But its performance issue causes a runtime performance overhead. Immer enables auto-freeze by default, and such frozen immutable state is not common. In scenarios such as cross-processing, remote data transfer, etc., these immutable data must be constantly frozen.

There are more parts that could be improved, such as better type inference, non-intrusive markup, support for more types of immutability, Safer immutability, [more edge cases](test/immer-non-support.test.ts), and so on.

This is why Mutative was created.

## Performance

> Mutative passed all of Immer's test cases.

The [benchmark suite](./perf-testing/README.md) times 90 workloads: Immer's own performance tests, array methods, reads, Map and Set values, object records, class instances, a deep path, patch application, and returned values. It compares Mutative with Immer 11.1.18 and with reducers written by hand, after checking every result against those reducers. The [performance summary](./perf-testing/reports/SUMMARY.md) has the complete results, the method, and their limits.

With matched settings, both freezing or both not and both generating patches or both not, Mutative was faster than Immer in 508 of 530 measured cases, 3.1x on geometric mean. With each library's defaults, Mutative without auto-freeze and Immer with it, Mutative was faster in 133 of 136 cases, 6.0x on geometric mean.

Times are microseconds per update, medians of three runs on an Apple M1 Max with Node.js 24.16.0; lower is better. Mutative, the first Immer column, and the hand-written reducers run without auto-freeze; the second Immer column shows Immer's default.

| Workload                            |   Rows | Mutative |  Immer | Immer, auto-freeze | Hand-written |
| ----------------------------------- | -----: | -------: | -----: | -----------------: | -----------: |
| Update one field of a small object  |      — |     0.65 |   1.02 |               1.32 |         0.05 |
| Update an array item found by ID    |    100 |     1.33 |   1.99 |               25.9 |         0.84 |
| 200 RTK Query-style updates         |      — |    1,031 |  1,180 |              5,209 |          361 |
| Read every row by index             | 10,000 |    5,210 | 11,253 |             11,513 |          135 |
| Remove the first row                | 10,000 |     7.37 |  8,292 |              9,125 |         1.43 |
| Update every row                    | 10,000 |    7,008 | 12,803 |             16,454 |          243 |
| Update one of 10,000 records        | 10,000 |    1,242 |  2,172 |              3,222 |        2,177 |
| Insert into a 1,000-property object |      — |     53.0 |    151 |                238 |          131 |
| Update a Map value                  | 10,000 |      553 |    557 |                774 |          548 |
| Add a number to a Set               | 10,000 |    1,013 |  1,502 |              1,605 |         72.4 |
| Update a class instance             | 10,000 |     3.19 |   3.74 |                673 |         1.49 |
| Update a value ten levels deep      |      — |     3.70 |   4.75 |               8.27 |         0.87 |
| Apply patches to 10% of rows        | 10,000 |    1,558 |  1,465 |              2,440 |            — |
| Return draft.filter()               | 10,000 |    2,444 |  4,188 |              4,645 |         80.2 |
| Return a new state                  | 10,000 |    2,914 |  8,272 |               0.89 |         0.06 |
| Return it with rawReturn()          | 10,000 |     0.30 |  7,865 |               0.89 |         0.06 |

The record and 1,000-property rows ran each library in a process of its own, because code that ran earlier in a process changes how fast V8 copies such wide objects. Immer has no `rawReturn()` and returns the same plain value in the last two rows. Immer was faster in 11 of the 530 matched cases: when returning a new state built from frozen data, which Immer does not search for drafts; when applying patches that replace nested values, by 5-7%; and, with auto-freeze, when updating a class instance with 1,000 fields.

Run `pnpm benchmark:immer` to measure the suite; the [benchmark guide](./perf-testing/README.md) describes its options.

### Large arrays

At 1,000 and 10,000 rows the gap grows. Against Immer without its array-method plugin, Mutative was faster in 164 of 176 cases at these sizes, 3.5x on geometric mean, and faster in every case that moves elements:

| Auto-freeze | Patches | All workloads, 1,000 rows | All workloads, 10,000 rows | Moves, 1,000 rows | Moves, 10,000 rows |
| ----------- | ------- | ------------------------: | -------------------------: | ----------------: | -----------------: |
| off         | off     |                      7.3x |                       8.8x |              212x |               472x |
| off         | on      |                      3.9x |                       4.2x |              6.7x |               7.7x |
| on          | off     |                      2.6x |                       2.3x |               32x |                35x |
| on          | on      |                      1.9x |                       1.7x |              6.2x |               6.8x |

Each value is the geometric mean of Immer's time over Mutative's; moves are `shift`, `unshift`, `splice` insertion, and `reverse`. Mutative moves elements natively on its copy, while Immer moves each one through its draft proxy: removing the first of 10,000 rows took 7.37 µs against 8,292 µs, 1,125x. With patches, both libraries emit one patch per moved index, which bounds the gain to 6-8x. The [performance summary](./perf-testing/reports/SUMMARY.md) breaks these results down by scenario.

### With patches

With patches on and auto-freeze off, Mutative was faster than Immer in 126 of 129 cases and never slower, 3.1x on geometric mean, and faster than Mutative 1.3.0 in 103 and within 5% in the rest, 3.7x. In every array case measured it was faster than both: 4.0x Immer and 13x Mutative 1.3.0 on geometric mean. Patches cost little when an update changes a few paths: pushing a row and inserting a property at 10,000 rows took 65.2 µs with patches against 64.8 µs without. Moving elements emits one patch per moved index in every library, so removing the first of 10,000 rows produces 10,000 forward and 10,000 inverse patches.

Times are microseconds per update with patches on and auto-freeze off:

| Workload                           |   Rows | Mutative |  Immer | Mutative 1.3.0 |
| ---------------------------------- | -----: | -------: | -----: | -------------: |
| Push a row and insert a property   | 10,000 |     65.2 |    370 |            212 |
| Update an array item found by ID   |    100 |     2.17 |   3.57 |           3.85 |
| 200 RTK Query-style updates        |      — |    1,325 |  1,520 |          2,172 |
| Remove the first row with `splice` |    100 |     13.5 |   86.5 |          3,108 |
| Insert a row in the middle         |    100 |     9.91 |   51.3 |          1,297 |
| Sort rows                          |    100 |      108 |    217 |          2,622 |
| Remove the first row with `shift`  | 10,000 |    1,227 | 10,117 |        282,588 |
| Reverse the rows                   | 10,000 |    1,226 | 10,167 |        286,207 |
| Update every row                   | 10,000 |   11,591 | 22,553 |         21,851 |
| Update one of 10,000 records       | 10,000 |    1,236 |  2,165 |          1,230 |

Immer's optional `enableArrayMethods()` plugin also runs array methods on the draft's copy, and with patches it comes within 1.05-1.74x of Mutative when moving elements of 1,000 or 10,000 rows. These comparisons leave it off because in Immer 11.1.18 it breaks guarantees that Immer otherwise keeps: `shift`, `pop` and `splice` return raw base objects, so editing a removed object changes the previous state; reordering can expose original objects the same way and leave revoked drafts in the result; and its forward patches can fail to replay. In [the audit](./test/immer-array-methods.md), 123 of 4,913 three-step operation sequences break with the plugin and none without it. The [performance summary](./perf-testing/reports/SUMMARY.md) reports Immer with the plugin separately.

### Bundle size

Mutative ships patches, `Map`/`Set` support and native array methods built in; Immer provides them as opt-in plugins. The following Brotli sizes were measured with esbuild 0.24.0 from each library's production ESM artifact (Immer 11.1.18 `dist/immer.production.mjs`; Mutative `dist/mutative.esm.mjs` at source `e6b6563` with `process.env.NODE_ENV` defined as `production`), bundled for the browser with `--minify --target=es2018 --format=esm`. Each consumer references the listed exports.

| Bundle                                                              | brotli |
| ------------------------------------------------------------------- | -----: |
| Immer core (`produce`, `current`, `original`)                       | 3.4 kB |
| Immer with `enablePatches` and `enableMapSet`                       | 5.2 kB |
| Immer with `enablePatches`, `enableMapSet` and `enableArrayMethods` | 6.0 kB |
| Mutative (`create`, `apply`, `current`, `original`)                 | 8.7 kB |

The difference buys the draft fast paths and the native array methods measured in the [performance summary](./perf-testing/reports/SUMMARY.md), which also records the artifact sizes of each measured source. See the [array methods FAQ](#faqs) for the supported fast paths and their contract, and the [Immer regression cases](./test/immer-array-methods.md) for the behavior of its array-method plugin.

## Features and Benefits

- **Mutation makes immutable updates** - Immutable data structures supporting objects, arrays, Sets and Maps.
- **High performance** - About 6x faster than Immer out of the box, and faster than hand-written spreads when updating objects with thousands of keys or inserting at the front of large arrays.
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
| new Set methods(Mutative v1.1.0+)     |       ✅ |  ❌   |

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
import { create } from "mutative";

const baseState = {
  foo: "bar",
  list: [{ text: "coding" }],
};

const state = create(baseState, (draft) => {
  draft.list.push({ text: "learning" });
});

expect(state).not.toBe(baseState);
expect(state.list).not.toBe(baseState.list);
```

`create(baseState, (draft) => void, options?: Options): newState`

The first argument of `create()` is the base state. Mutative drafts it and passes it to the arguments of the draft function, and performs the draft mutation until the draft function finishes, then Mutative will finalize it and produce the new state.

Use `create()` for more advanced features by [setting `options`](#createstate-fn-options).

## APIs

- [`create()`](#create)
- [`apply()`](#apply)
- [`current()`](#current)
- [`original()`](#original)
- [`unsafe()`](#unsafe)
- [`isDraft()`](#isdraft)
- [`isDraftable()`](#isdraftable)
- [`rawReturn()`](#rawreturn)
- [`makeCreator()`](#makecreator)
- [`markSimpleObject()`](#marksimpleobject)

### `create()`

Use `create()` for draft mutation to get a new state, which also supports currying.

```ts
import { create } from "mutative";

const baseState = {
  foo: "bar",
  list: [{ text: "todo" }],
};

const state = create(baseState, (draft) => {
  draft.foo = "foobar";
  draft.list.push({ text: "learning" });
});
```

In this basic example, the changes to the draft are 'mutative' within the draft callback, and `create()` is finally executed with a new immutable state.

#### `create(state, fn, options)`

> Then options is optional.

- strict - `boolean`, the default is false.

  > Forbid accessing non-draftable values in strict mode(unless using [unsafe()](#unsafe)).

  > When strict mode is enabled, mutable data can only be accessed using [`unsafe()`](#unsafe).

  > **It is recommended to enable `strict` in development mode and disable `strict` in production mode.** This will ensure safe explicit returns and also keep good performance in the production build. If the value that does not mix any current draft or is `undefined` is returned, then use [rawReturn()](#rawreturn).

  > If you'd like to enable strict mode by default in a development build and turn it off for production, you can use `strict: process.env.NODE_ENV !== 'production'`.

  > In development builds, strict mode also warns once when a recipe leaves 1,000 or more drafts unchanged, as a search through a large draft array does. See [`current()`](#current) for searching without creating drafts.

- enablePatches - `boolean | { pathAsArray?: boolean; arrayLengthAssignment?: boolean; }`, the default is false.

  > Enable patch, and return the patches/inversePatches.

  > If you need to set the shape of the generated patch in more detail, then you can set `pathAsArray` and `arrayLengthAssignment`。`pathAsArray` default value is `true`, if it's `true`, the path will be an array, otherwise it is a string; `arrayLengthAssignment` default value is `true`, if it's `true`, the array length will be included in the patches, otherwise no include array length(**NOTE**: If `arrayLengthAssignment` is `false`, it is fully compatible with JSON Patch spec, but it may have additional performance loss), [view related discussions](https://github.com/unadlib/mutative/issues/6).

- enableAutoFreeze - `boolean`, the default is false.

  > Enable autoFreeze, and return frozen state, and enable circular reference checking only in `development` mode.

- mark - `(target) => ('mutable'|'immutable'|function) | (target) => ('mutable'|'immutable'|function)[]`
  > Set a mark to determine if the value is mutable or if an instance is an immutable, and it can also return a shallow copy function(`AutoFreeze` and `Patches` should both be disabled, Some patches operation might not be equivalent).
  > When the mark function is (target) => 'immutable', it means all the objects in the state structure are immutable. In this specific case, you can totally turn on `AutoFreeze` and `Patches`.
  > `mark` supports multiple marks, and the marks are executed in order, and the first mark that returns a value will be used.
  > When a object tree node is marked by the `mark` function as `mutable`, all of its child nodes will also not be drafted by Mutative and will retain their original values.

#### `create()` - Currying

- create `draft`

```ts
const [draft, finalize] = create(baseState);
draft.foobar.bar = "baz";
const state = finalize();
```

> Support set options such as `const [draft, finalize] = create(baseState, { enableAutoFreeze: true });`

- create `producer`

```ts
const produce = create((draft) => {
  draft.foobar.bar = "baz";
});
const state = produce(baseState);
```

> Also support set options such as `const produce = create((draft) => {}, { enableAutoFreeze: true });`

### `apply()`

Use `apply()` for applying patches to get the new state.

```ts
import { create, apply } from "mutative";

const baseState = {
  foo: "bar",
  list: [{ text: "todo" }],
};

const [state, patches, inversePatches] = create(
  baseState,
  (draft) => {
    draft.foo = "foobar";
    draft.list.push({ text: "learning" });
  },
  {
    enablePatches: true,
  },
);

const nextState = apply(baseState, patches);
expect(nextState).toEqual(state);
const prevState = apply(state, inversePatches);
expect(prevState).toEqual(baseState);
```

#### `apply(state, patches, options)`

The options parameter is optional and supports two types of configurations:

1. Immutable options (similar to create options but without `enablePatches`):
   - `strict` - `boolean`, forbid accessing non-draftable values in strict mode
   - `enableAutoFreeze` - `boolean`, enable autoFreeze and return frozen state
   - `mark` - mark function to determine if a value is mutable/immutable

```ts
const baseState = { foo: { bar: "test" } };

// This will create a new state.
const result = apply(baseState, [
  {
    op: "replace",
    path: ["foo", "bar"],
    value: "test2",
  },
]);
expect(baseState).not.toEqual({ foo: { bar: "test2" } });
expect(result).toEqual({ foo: { bar: "test2" } });
```

2. Mutable option(Mutative v1.2.0+):
   - `mutable` - `boolean`, if true the state will be mutated directly instead of creating a new state

Example with mutable option:

```ts
const baseState = { foo: { bar: "test" } };

// This will modify baseState directly
apply(
  baseState,
  [
    {
      op: "replace",
      path: ["foo", "bar"],
      value: "test2",
    },
  ],
  {
    mutable: true,
  },
);
expect(baseState).toEqual({ foo: { bar: "test2" } });
```

> ⚠️Note: The mutable option cannot be combined with other options. When using mutable option, apply() will return void instead of a new state.

### `current()`

Get the current value from a draft.

- For any draft where a child node has been modified, the state obtained by executing current() each time will be a new reference object.
- For a draft where no child nodes have been modified, executing current() will always return the original state.

> It is recommended to minimize the number of times current() is executed when performing read-only operations, ideally executing it only once.

```ts
const state = create({ a: { b: { c: 1 } }, d: { f: 1 } }, (draft) => {
  draft.a.b.c = 2;
  expect(current(draft.a)).toEqual({ b: { c: 2 } });
  // The node `a` has been modified.
  expect(current(draft.a) === current(draft.a)).toBeFalsy();
  // The node `d` has not been modified.
  expect(current(draft.d) === current(draft.d)).toBeTruthy();
});
```

`current()` is also the cheap way to search a large array of objects. Every object read through a draft becomes a draft of its own, so `draft.list.find()` pays for a draft per visited element. `current(draft.list)` is the original array while the recipe has not changed it; otherwise it is a copy that holds the current value of each changed element and the original object of every other one. Its indices are those of the draft, also after the recipe added, removed or moved elements. Search it and change the match through the draft. Its elements are not drafts, so the callback must only read them.

```ts
const state = create(baseState, (draft) => {
  const index = current(draft.list).findIndex((item) => item.text === "todo");
  draft.list[index].done = true;
});
```

### `original()`

Get the original value from a draft.

```ts
const baseState = {
  foo: "bar",
  list: [{ text: "todo" }],
};

const state = create(baseState, (draft) => {
  draft.foo = "foobar";
  draft.list.push({ text: "learning" });
  expect(original(draft.list)).toEqual([{ text: "todo" }]);
});
```

`original()` reflects the state before the recipe's changes, so an index found in `original(draft.list)` no longer matches the draft once the recipe has added, removed or moved elements. To search a draft array, use [`current()`](#current).

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
  },
);
```

> If you'd like to enable strict mode by default in a development build and turn it off for production, you can use `strict: process.env.NODE_ENV !== 'production'`.

### `isDraft()`

Check if a value is a draft.

```ts
const baseState = {
  date: new Date(),
  list: [{ text: "todo" }],
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
  list: [{ text: "todo" }],
};

expect(isDraftable(baseState.date)).toBeFalsy();
expect(isDraftable(baseState.list)).toBeTruthy();
```

> You can set a mark to determine if the value is draftable, and the mark function should be the same as passing in `create()` mark option.

### `rawReturn()`

For return values that do not contain any drafts, you can use `rawReturn()` to wrap this return value to improve performance. It ensure that the return value is only returned explicitly.

```ts
const baseState = { id: "test" };
const state = create(baseState as { id: string } | undefined, (draft) => {
  return rawReturn(undefined);
});
expect(state).toBe(undefined);
```

> If the return value mixes drafts, you should not use `rawReturn()`.

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
  },
);
// it will warn `The return value contains drafts, please don't use 'rawReturn()' to wrap the return value.` in strict mode.
expect(state).toEqual({ a: 2, b: { c: 1 } });
expect(isDraft(state.b)).toBeFalsy();
```

### `makeCreator()`

`makeCreator()` only takes [options](#createstate-fn-options) as the first argument, resulting in a custom `create()` function.

```ts
const baseState = {
  foo: {
    bar: "str",
  },
};

const create = makeCreator({
  enablePatches: true,
});

const [state, patches, inversePatches] = create(baseState, (draft) => {
  draft.foo.bar = "new str";
});
```

### `markSimpleObject()`

`markSimpleObject()` is a mark function that marks all objects as immutable.

```ts
const baseState = {
  foo: {
    bar: "str",
  },
  simpleObject: Object.create(null),
};

const state = create(
  baseState,
  (draft) => {
    draft.foo.bar = "new str";
    draft.simpleObject.a = "a";
  },
  {
    mark: markSimpleObject,
  },
);

expect(state.simpleObject).not.toBe(baseState.simpleObject);
```

[View more API docs](./docs/README.md).

## Using TypeScript

- `castDraft()`
- `castImmutable()`
- `castMutable()`
- `Draft<T>`
- `Immutable<T>`
- `Patches`
- `Patch`
- `Options<O, F>`

## Integration with React

- [use-mutative](https://github.com/mutativejs/use-mutative) - A 2-6x faster alternative to useState with spread operation
- [use-travel](https://github.com/mutativejs/use-travel) - A React hook for state time travel with undo, redo, reset and archive functionalities.
- [zustand-mutative](https://github.com/mutativejs/zustand-mutative) - A Mutative middleware for Zustand enhances the efficiency of immutable state updates.

## FAQs

- I'm already using Immer, can I migrate smoothly to Mutative?

Yes. Unless you have to be compatible with Internet Explorer, Mutative supports almost all of Immer features, and you can easily migrate from Immer to Mutative.

> Migration is also not possible for React Native that does not support Proxy. React Native uses a new JS engine during refactoring - Hermes, and it (if < v0.59 or when using the Hermes engine on React Native < v0.64) does [not support Proxy on Android](https://github.com/facebook/hermes/issues/33), but [React Native v0.64 with the Hermes engine support Proxy](https://reactnative.dev/blog/2021/03/12/version-0.64#hermes-with-proxy-support).

- Can Mutative be integrated with Redux?

Yes. Mutative supports return values for reducer, and `redux-toolkit` is considering support for [configurable `produce()`](https://github.com/reduxjs/redux-toolkit/pull/3074).

- Which array methods run natively on drafts?

`shift`, `unshift`, `splice` and `reverse` move elements directly on the copy of a plain array without holes, including `undefined` elements; `indexOf`, `lastIndexOf` and `includes` search the current array natively; `sort` and `join` run natively on arrays of primitives. Removed elements are returned as drafts, patches replay in both directions, and a call that changes nothing keeps the state. Sparse arrays, array subclasses, an own `constructor` or `Symbol.isConcatSpreadable`, arrays under a custom `mark`, every method with a callback, `at`, `slice`, `fill` and `copyWithin` use the proxy path. An argument that can run user code, such as an object passed as `fromIndex` or as a `splice` index, is converted on the proxy path, so a conversion that changes the array is observed as the native methods observe it. The fast paths are made for data arrays: an accessor property defined on an array index is read as a data value, and the number and order of such getter calls, their re-entrant effects on the draft, and the identity of objects they return are not guaranteed to match element-by-element execution through the proxy.

Optimized searches give the same results as the proxy path, comparing elements as a read returns them. Drafts, values assigned in the recipe, non-draftable objects and primitives are found. An object of the base state is drafted when it is read, so it is never found, whether or not it was read before; use [`original()`](#original) to search the base state, for example `original(draft.list).indexOf(item)`. The search never reads a property of the value it is given.

In strict mode, outside [`unsafe()`](#unsafe), optimized calls on an array that may hold objects take the proxy path unchanged, so reading a non-draftable element fails exactly as it always did; arrays of primitives, recognized with `typeof` alone, keep the native paths. Elements are moved and compared without being inspected, while the proxy path inspects each element it reads. An element that is itself a Proxy may therefore see fewer calls to its internal methods on the native paths, never more and never at other times; a revoked Proxy element that a search passes over, for example, does not throw there.

Draftable base elements removed or moved by these methods are drafted before they are exposed. Methods with callbacks, such as `forEach`, `map`, `filter` and `find`, go through the draft so that their callbacks see every change and can modify elements; use [`current()`](#current) for read-only scans of large arrays.

- Does Mutative support shared references?

Yes, Mutative supports shared references, but **each path to a shared object gets its own independent draft**. Modifications to one path do not automatically reflect in others. If you want to preserve shared references in the result, you must explicitly assign them (e.g., `draft.b = draft.a`). [Read more details](https://mutative.js.org/docs/extra-topics/shared-references).

## Migration from Immer to Mutative

> [mutative-compat](https://github.com/exuanbo/mutative-compat) - Mutative wrapper with full Immer API compatibility, you can use it to quickly migrate from Immer to Mutative.

1. `produce()` -> `create()`

Mutative auto freezing option is disabled by default, Immer auto freezing option is enabled by default.

> You need to check if auto freezing has any impact on your project. If it depends on auto freezing, you can enable it yourself in Mutative.

```ts
import produce from "immer";

const nextState = produce(baseState, (draft) => {
  draft[1].done = true;
  draft.push({ title: "something" });
});
```

Use Mutative

```ts
import { create } from "mutative";

const nextState = create(baseState, (draft) => {
  draft[1].done = true;
  draft.push({ title: "something" });
});
```

2. `Patches`

```ts
import { produceWithPatches, applyPatches } from "immer";

enablePatches();

const baseState = {
  age: 33,
};

const [nextState, patches, inversePatches] = produceWithPatches(
  baseState,
  (draft) => {
    draft.age++;
  },
);

const state = applyPatches(nextState, inversePatches);

expect(state).toEqual(baseState);
```

Use Mutative

```ts
import { create, apply } from "mutative";

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
  },
);

const state = apply(nextState, inversePatches);

expect(state).toEqual(baseState);
```

3. Return `undefined`

```ts
import produce, { nothing } from "immer";

const nextState = produce(baseState, (draft) => {
  return nothing;
});
```

Use Mutative

```ts
import { create, rawReturn } from "mutative";

const nextState = create(baseState, (draft) => {
  return rawReturn(undefined);
});
```

## Contributing

Mutative goal is to provide efficient and immutable updates. The focus is on performance improvements and providing better APIs for better development experiences. We are still working on it and welcome PRs that may help Mutative.

Development Workflow:

See [Building and validating Mutative](./BUILDING.md) for the build pipeline, package checks, and bundle-size regression policy.

See [the benchmark suite](./perf-testing/README.md) for the comparison of the current build with Mutative 1.3.0, Immer, and a hand-written reducer, matched freeze and patch modes, memory measurements, and CI regression budgets. Run `pnpm benchmark:immer:check` to validate every workload and `pnpm benchmark:immer` to measure them.

- Clone Mutative repo.
- Run `pnpm install` to install all the dependencies.
- Run `pnpm format` to format the code.
- `pnpm test --watch` runs an interactive test watcher.
- Run `pnpm commit` to make a git commit.

## License

Mutative is [MIT licensed](https://github.com/unadlib/mutative/blob/main/LICENSE).
