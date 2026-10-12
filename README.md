# Mutative

<a href="https://mutative.js.org/" target="_blank"><img src="https://raw.githubusercontent.com/unadlib/mutative/main/website/static/img/ mutative.png" height="120" alt="Mutative Logo" style="max-width: 100%;height: 128px;"/></a>

![Node CI](https://github.com/unadlib/mutative/workflows/Node%20CI/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/unadlib/mutative/badge.svg?branch=main)](https://coveralls.io/github/unadlib/mutative?branch=main)
[![npm](https://img.shields.io/npm/v/mutative.svg)](https://www.npmjs.com/package/mutative)
[![NPM Downloads](https://img.shields.io/npm/dm/mutative)](https://npmtrends.com/mutative)
![license](https://img.shields.io/npm/l/mutative)

**Mutative** - A JavaScript library for efficient immutable updates ([documentation](https://mutative.js.org/)). In the [benchmark](./perf-testing/reports/SUMMARY.md), it was about 3.6x faster than Immer with the same settings and 6.6x faster with each library's defaults across 97 workloads.

In that benchmark the gap widened on large arrays, where Mutative moved elements up to 1,052x faster than Immer. When copying dominates, such as updating objects with thousands of keys, inserting at the front of a large array or adding an item to a large Set, Mutative is even faster than hand-written reducers.

**How does Mutative compare with the spread operation (hand-written reducers)?**

- <a href="https://www.richsnapp.com/article/2019/06-09-reduce-spread-anti-pattern" target="_blank">The reduce ({...spread}) anti-pattern</a>
- <a href="https://jonlinnell.co.uk/articles/spread-operator-performance?fbclid=IwAR0mElQwz2aOxl8rcsqoYwkcQDlcXcwuyIsTmTAbmyzrarysS8-BC1lSY9k" target="_blank">How slow is the Spread operator in JavaScript?</a>

Mutative copies each object at most once per update, however many changes a recipe makes.

## Motivation

Immer made it easy to write immutable updates as mutations of a draft. Mutative keeps that model and focuses on performance: it copies each object at most once per update, drafts objects only when a recipe reads them, finalizes only the drafts that changed, and runs array methods that move elements natively on its copies. Immer freezes the next state by default, which costs time on every update; Mutative freezes it only when asked to.

Mutative also takes its options per call instead of from global configuration, drafts class instances through marks instead of changing their classes, supports async recipes and Map and Set subclasses, and handles [edge cases](test/immer-non-support.test.ts) that Immer gets wrong. [Comparison with Immer](https://mutative.js.org/docs/extra-topics/comparison-with-immer) lists the differences.

## Performance

> Mutative passed all of Immer's test cases.

The [benchmark suite](./perf-testing/README.md) times 97 workloads: Immer's own performance tests, array methods, reads, Map and Set values, object records, class instances, a deep path, patch application, returned values, and searches. It compares Mutative with Immer 11.1.18 and with reducers written by hand, after checking every result against those reducers. The [performance summary](./perf-testing/reports/SUMMARY.md) has the complete results, the method, and their limits.

With matched settings, both freezing or both not and both generating patches or both not, Mutative was faster than Immer in 595 of 614 measured cases, 3.6x on geometric mean. With each library's defaults, Mutative without auto-freeze and Immer with it, Mutative was faster in 154 of 157 cases, 6.6x on geometric mean.

Times are microseconds per update, medians of three runs on an Apple M1 Max with Node.js 24.16.0, each library in a process of its own; lower is better. Mutative, the first Immer column, and the hand-written reducers run without auto-freeze; the second Immer column shows Immer's default.

| Workload                            |   Rows | Mutative |  Immer | Immer, auto-freeze | Hand-written |
| ----------------------------------- | -----: | -------: | -----: | -----------------: | -----------: |
| Update one field of a small object  |      — |     0.51 |   0.69 |               0.95 |         0.02 |
| Update an array item found by ID    |    100 |     1.12 |   1.82 |               25.0 |         0.38 |
| 200 RTK Query-style updates         |      — |    1,001 |  1,133 |              4,795 |          352 |
| Read every row by index             | 10,000 |    4,756 |  9,584 |              9,687 |         57.7 |
| Remove the first row                | 10,000 |     7.04 |  7,408 |              8,137 |         1.40 |
| Update every row                    | 10,000 |    6,462 | 12,570 |             15,607 |          211 |
| Update one of 10,000 records        | 10,000 |    1,200 |  2,094 |              3,131 |        2,088 |
| Insert into a 1,000-property object |      — |     50.3 |    149 |                229 |          126 |
| Update a Map value                  | 10,000 |      518 |    526 |                733 |          519 |
| Add a number to a Set               | 10,000 |     29.5 |    904 |                975 |         61.2 |
| Update a class instance             | 10,000 |     2.92 |   3.44 |                668 |         1.42 |
| Update a value ten levels deep      |      — |     3.50 |   4.41 |               7.84 |         0.76 |
| Apply patches to 10% of rows        | 10,000 |      734 |  1,166 |              2,095 |            — |
| Search `current()` after `shift()`  | 10,000 |      257 | 11,255 |             11,846 |         64.8 |
| Return draft.filter()               | 10,000 |    2,658 |  4,251 |              4,736 |         77.7 |
| Return a new state                  | 10,000 |    2,604 |  5,718 |               0.79 |         0.02 |
| Return it with rawReturn()          | 10,000 |     0.26 |  5,703 |               0.79 |         0.02 |

Each library ran each workload in a process of its own. With all of them in one process every library ran slower, and not by the same amount: Mutative took 1.1 times as long on geometric mean, Immer 1.2 times, and the hand-written reducers 1.7 times. The search removes the first row with `shift()`, then finds the last row in a snapshot of the array and updates it. Immer has no `rawReturn()` and returns the same plain value in the last two rows; with auto-freeze, Mutative skips a returned state that is already frozen, as Immer does, taking 0.53 µs. Immer was faster in 6 of the 614 matched cases, all with auto-freeze: four updates of class instances with 100 to 10,000 fields, and two array updates at 100 rows whose runs overlapped those of Mutative.

Run `pnpm benchmark:immer` to measure the suite; the [benchmark guide](./perf-testing/README.md) describes its options.

### Large arrays

At 1,000 and 10,000 rows the gap grows. Against Immer without its array-method plugin, Mutative was faster in 222 of 232 cases at these sizes, 4.7x on geometric mean, and faster in every case that moves elements:

| Auto-freeze | Patches | All workloads, 1,000 rows | All workloads, 10,000 rows | Moves, 1,000 rows | Moves, 10,000 rows |
| ----------- | ------- | ------------------------: | -------------------------: | ----------------: | -----------------: |
| off         | off     |                      8.7x |                      10.8x |              209x |               430x |
| off         | on      |                      4.1x |                       4.5x |              7.1x |               7.3x |
| on          | off     |                      3.9x |                       4.2x |               32x |                39x |
| on          | on      |                      2.7x |                       2.8x |              6.6x |               6.8x |

Each value is the geometric mean of Immer's time over Mutative's; moves are `shift`, `unshift`, `splice` insertion, and `reverse`. Mutative moves elements natively on its copy, while Immer moves each one through its draft proxy: removing the first of 10,000 rows took 7.04 µs against 7,408 µs, 1,052x. With patches, both libraries emit one patch per moved index, which bounds the gain to 5-9x. The [performance summary](./perf-testing/reports/SUMMARY.md) breaks these results down by scenario.

### With patches

With patches on and auto-freeze off, Mutative was faster than Immer in 148 of 150 cases and within 5% in the other 2, 3.3x on geometric mean, and faster than Mutative 1.3.0 in 131 and within 5% in the rest, 4.6x. In every array case measured it was faster than both: 4.4x Immer and 13x Mutative 1.3.0 on geometric mean. Patches cost little when an update changes a few paths: pushing a row and inserting a property at 10,000 rows took 63.2 µs with patches against 63.8 µs without. Moving elements emits one patch per moved index in every library, so removing the first of 10,000 rows produces 10,000 forward and 10,000 inverse patches.

Times are microseconds per update with patches on and auto-freeze off:

| Workload                           |   Rows | Mutative |  Immer | Mutative 1.3.0 |
| ---------------------------------- | -----: | -------: | -----: | -------------: |
| Push a row and insert a property   | 10,000 |     63.2 |    360 |            210 |
| Update an array item found by ID   |    100 |     1.50 |   3.22 |           3.35 |
| 200 RTK Query-style updates        |      — |    1,140 |  1,470 |          2,116 |
| Remove the first row with `splice` |    100 |     11.5 |   83.6 |          2,982 |
| Insert a row in the middle         |    100 |     8.83 |   48.0 |          1,191 |
| Sort rows                          |    100 |      105 |    129 |          2,466 |
| Remove the first row with `shift`  | 10,000 |    1,063 |  8,943 |        265,439 |
| Reverse the rows                   | 10,000 |    1,071 |  9,424 |        280,542 |
| Update every row                   | 10,000 |    8,555 | 21,767 |         22,549 |
| Update one of 10,000 records       | 10,000 |    1,184 |  2,104 |          1,181 |

Immer's optional `enableArrayMethods()` plugin also runs array methods on the draft's copy, and with patches it comes within 1.13-1.70x of Mutative when moving elements of 1,000 or 10,000 rows. These comparisons leave it off because in Immer 11.1.18 it breaks guarantees that Immer otherwise keeps: `shift`, `pop` and `splice` return raw base objects, so editing a removed object changes the previous state; reordering can expose original objects the same way and leave revoked drafts in the result; and its forward patches can fail to replay. In [the audit](./test/immer-array-methods.md), 123 of 4,913 three-step operation sequences break with the plugin and none without it. The [performance summary](./perf-testing/reports/SUMMARY.md) reports Immer with the plugin separately.

### Bundle size

Mutative ships patches, `Map`/`Set` support and native array methods built in; Immer provides them as opt-in plugins. The following Brotli sizes were measured with esbuild 0.24.0 from the ESM entry that bundlers resolve for each library (Immer 11.1.21 `dist/immer.mjs`; Mutative 2.0), with `process.env.NODE_ENV` defined as `production`, bundled for the browser with `--minify --target=es2018 --format=esm`. The first row imports only `produce` or `create`. The second adds `applyPatches`, `current` and `original` with Immer's `enablePatches`, `enableMapSet` and `enableArrayMethods`, and `apply`, `current` and `original` for Mutative.

| Bundle                                      |  Immer | Mutative |
| ------------------------------------------- | -----: | -------: |
| `produce` / `create` only                   | 3.6 kB |   7.9 kB |
| With patches, `Map`/`Set` and array methods | 6.4 kB |   8.5 kB |

Mutative's `create` includes patches, `Map`/`Set` support and the native array methods even when a recipe does not use them: they are part of `create`, not separate imports, so bundlers cannot drop them. The difference buys the draft fast paths and the native array methods measured in the [performance summary](./perf-testing/reports/SUMMARY.md), which also records the artifact sizes of each measured source. See the [array methods FAQ](#faqs) for the supported fast paths and their contract, and the [Immer regression cases](./test/immer-array-methods.md) for the behavior of its array-method plugin.

## Features and Benefits

- **Mutation makes immutable updates** - Immutable updates of objects, arrays, Maps and Sets, written as mutations of a draft.
- **High performance** - About 6.6x faster than Immer with each library's defaults, and faster than hand-written spreads in measured wide-object and large-array insertion workloads.
- **Optional freezing state** - No freezing of immutable data by default, and [auto-freeze](https://mutative.js.org/docs/advanced-guides/auto-freeze) when you want it.
- **Support for JSON Patch** - [Patches](https://mutative.js.org/docs/advanced-guides/patches) use the `add`, `remove` and `replace` operations of JSON Patch, and with `pathAsArray: false` and `arrayLengthAssignment: false`, those of objects and arrays are JSON Patch operations.
- **Custom shallow copy** - [Marks](https://mutative.js.org/docs/advanced-guides/mark) draft class instances and other types of immutable data, with their own shallow copies if needed.
- **Support mark for immutable and mutable data** - Marks set what is drafted without changing the data or its classes.
- **Safer mutable data access in strict mode** - [Strict mode](https://mutative.js.org/docs/advanced-guides/strict-mode) makes reads of data that cannot be drafted explicit.
- **Support for reducer** - [Producers](https://mutative.js.org/docs/advanced-guides/currying) work as reducers for Redux and any other immutable state library, and recipes can be async.

## Difference between Mutative and Immer

|                                                       | Mutative |     Immer     |
| :---------------------------------------------------- | :------: | :-----------: |
| Auto-freeze off by default                            |    ✅    |      ❌       |
| Options per call, without global settings or plugins  |    ✅    |      ❌       |
| Drafts of class instances without changing the class  |    ✅    |      ❌       |
| Custom shallow copies                                 |    ✅    |      ❌       |
| Strict mode                                           |    ✅    |      ❌       |
| Async recipes                                         |    ✅    |      ❌       |
| Map and Set subclasses keep their class               |    ✅    |      ❌       |
| ES2025 Set methods on Set drafts                      |    ✅    |      ❌       |
| Freezing reaches the objects used as Map keys         |    ✅    |      ❌       |
| Array methods that run natively on drafts             |    ✅    | Opt-in plugin |
| JSON Pointer string paths in patches                  |    ✅    |      ❌       |

[Comparison with Immer](https://mutative.js.org/docs/extra-topics/comparison-with-immer) lists every difference, checked against Immer 11.1.18: the APIs that replace Immer's, defaults and configuration, drafts, patches, and the Immer failures that Mutative's tests pin.

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
- ES module: `import { create } from 'https://unpkg.com/mutative/dist/mutative.esm.production.min.mjs';`

The package's other ESM files read `process.env.NODE_ENV`, which bundlers and Node.js provide; a browser without a bundler needs the production file above.

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

`create(baseState, recipe, options?)` drafts the base state and passes the draft to the recipe. The recipe changes the draft with ordinary JavaScript, and `create()` returns the next state, which copies the objects that the recipe changed and shares all the others with the base state. The base state does not change.

Use `create()` for more advanced features by [setting `options`](#createstate-fn-options). The [documentation](https://mutative.js.org/docs/getting-started/usages) shows common updates of objects, arrays, Maps and Sets.

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

`create()` produces the next state from the changes that a recipe makes to a draft of the base state, and also makes [producers and manual drafts](#create---currying).

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

The recipe changes the draft as if it were mutable, and `create()` returns the next state with those changes, while `baseState` stays as it was.

The recipe can be an async function: `create()` then returns a Promise of the result, and the draft stays usable until that Promise settles. `create()` recognizes the Promises of the current JavaScript realm only, so an async function from another realm, such as a `vm` context or an iframe, needs a wrapper from this realm: `create(baseState, async (draft) => { return await recipe(draft); })`. TypeScript types the result as a Promise as well, except with an explicit state type that is a type parameter, as in `create<T>(base, async (draft) => { … })` in a generic function, or that includes Promises, such as `object` or `unknown`, which gives the state type itself. In generic code, leave out the type argument: `create(base, async (draft) => { … })` gives `Promise<T>`, and `create(async (draft: T) => { … })` gives `(base: T) => Promise<T>`.

#### `create(state, fn, options)`

The `options` argument is optional; [`makeCreator()`](#makecreator) sets defaults for it.

- `strict` - `boolean`, the default is `false`.

  In strict mode, reading an object that cannot be drafted from a draft, such as a `Date` or a class instance that no mark makes draftable, or a value that `mark` makes mutable, throws unless the read happens inside [`unsafe()`](#unsafe). A value that the recipe returns with [`rawReturn()`](#rawreturn) is still searched for drafts, and development builds warn when it holds one. In development builds, strict mode also warns once when a recipe leaves 1,000 or more drafts unchanged, as a search through a large draft array does; see [`current()`](#current) for searching without creating drafts.

  Strict mode checks every value that the recipe reads, so enable it in development and disable it in production, for example with `strict: process.env.NODE_ENV !== 'production'`.

- `enablePatches` - `boolean | { pathAsArray?: boolean; arrayLengthAssignment?: boolean }`, the default is `false`.

  `true` makes `create()` return `[nextState, patches, inversePatches]`. An object sets the shape of the patches as well:

  - `pathAsArray`, `true` by default: a path is an array of keys, such as `['list', 0]`. With `false`, it is a JSON Pointer string, such as `'/list/0'`. A string path holds only strings, so it cannot name a Map key that is not a string, or a symbol key: with `pathAsArray: false`, the patch of `draft.set(1, 'b')` would set the key `'1'`. Keep the default array paths for such keys; development builds throw an error when a string path would hold one.
  - `arrayLengthAssignment`, `true` by default: an array that gets shorter gets a `replace` patch of its `length`. With `false`, it gets a `remove` patch for each index that it loses, which takes more time for large arrays.

  With `pathAsArray: false` and `arrayLengthAssignment: false`, the patches of objects and arrays are JSON Patch operations ([RFC 6902](https://datatracker.ietf.org/doc/html/rfc6902)); see the [related discussion](https://github.com/unadlib/mutative/issues/6).

  TypeScript types the result from the type of `enablePatches` in the options passed to `create()` or `makeCreator()`: `true` or an object gives `[state, patches, inversePatches]`, and `boolean` gives either. Options typed `{ enablePatches: true }` that may be `undefined`, such as an optional parameter of a wrapper, or typed `{ enablePatches?: true }` still give the tuple, although `create()` returns the state alone when patches are off; type the flag as `boolean` there. With an explicit state type, TypeScript infers no other type argument, so pass `boolean` as the type argument for `enablePatches` as well, as in `create<State, false, boolean>(base, recipe, options)` or `create<State, [], false, boolean>(recipe, options)`.

- `enableAutoFreeze` - `boolean`, the default is `false`.

  Freeze the next state deeply, also the parts that it shares with the base state, and, in development builds, throw for an object that holds itself.

- `mark` - `Mark | Mark[]`, where `Mark` is `(target, { mutable, immutable }) => 'mutable' | 'immutable' | (() => copy) | undefined`.

  A mark decides how a value is drafted. It receives each value that the recipe reads, and returns:

  - `'immutable'` to make the value draftable, such as a class instance, which is then copied when the recipe changes it.
  - `'mutable'` to keep the value out of drafts: the recipe reads and changes it in place, as it does all the values that it holds.
  - A function that returns a shallow copy of the value, which drafts it with that copy. Patches and auto-freeze must be off, and some patches might not apply to such values.
  - `undefined` to draft the value as usual.

  With an array of marks, the first one that returns a value decides. When a mark makes every object immutable, as `() => 'immutable'` does, patches and auto-freeze work as usual. An instance that `mark` makes `immutable` is copied with all its own properties, and those that are enumerable, writable and configurable are assigned, so an own property that shadows a setter of its class runs it, and one that shadows a getter or a read-only property throws; see [Copying marked instances](https://mutative.js.org/docs/advanced-guides/mark#copying-marked-instances).

#### `create()` - Currying

- A base state without a recipe gives a draft and a `finalize()` function, which returns what `create()` returns with a recipe:

```ts
const [draft, finalize] = create(baseState);
draft.foo = "foobar";
const state = finalize();
```

> Options follow the base state, as in `const [draft, finalize] = create(baseState, { enableAutoFreeze: true });`.

> Call `finalize()` only once. When it throws, for example because a development build rejects a patch path, the drafts are not revoked as they are when a recipe fails: they stay writable, and a second `finalize()` returns a state that can hold a revoked draft, with patches that miss changes. Create a new draft from the base state instead.

- A recipe without a base state gives a producer, which takes the base state and passes its other arguments to the recipe:

```ts
const produce = create((draft) => {
  draft.foo = "foobar";
});
const state = produce(baseState);
```

> Options follow the recipe, as in `const produce = create((draft) => {}, { enableAutoFreeze: true });`.

#### `create()` on a draft

A recipe can pass a draft to a helper that calls `create()`. Unlike Immer's `produce`, which drafts the draft itself, `create()` drafts a copy of its current state, `current(draft)`: the values that the helper's recipe leaves unchanged are objects of the base state. Assigning the result back into the outer draft is safe, but changing one of those values afterwards changes the base state, because the outer draft returns an assigned value as it is ([#160](https://github.com/unadlib/mutative/issues/160)). Development builds warn once when `create()` receives a draft with a recipe.

```ts
const state = create(baseState, (draft) => {
  draft.node = create(draft.node, (node) => {
    node.name = "renamed";
  });
  // `draft.node` is now the helper's result, and `draft.node.metadata` is an
  // object of `baseState`: writing to it here would change `baseState`.
});
```

To avoid it, let such a helper change a draft in place, and call `create()` only on other values:

```ts
type Item = { name: string; metadata: { value: string } };

function rename(item: Item, name: string): Item {
  if (isDraft(item)) {
    item.name = name;
    return item;
  }
  return create(item, (draft) => {
    draft.name = name;
  });
}
```

On a draft, `rename()` returns the draft itself, so the outer recipe changes its result through the outer draft, and the values that it leaves unchanged keep their references. Unlike a call to `create()`, it changes the outer draft even if the caller discards the result.

Where that does not fit, make such changes in the helper's recipe, or through the outer draft before calling the helper. If the helper's result must not share objects with the base state, give `create()` a deep copy, as in `create(structuredClone(current(draft)), recipe)`, at the cost of copying the draft on each call and of new references for the values that the recipe leaves unchanged; `structuredClone` turns class instances into plain objects and throws on functions. To catch such writes, enable `enableAutoFreeze` in development, for example with `makeCreator({ enableAutoFreeze: process.env.NODE_ENV !== 'production' })` for such helpers: it freezes the helper's result together with the objects of the base state that it shares, so a write to them throws instead of changing the base state, as Immer's default auto-freeze does.

A draft belongs to the `create()` call that made it, also the draft that `create(base)` returns. Do not store it in the draft of another call, or in an object that you assign there: it is revoked when its own call ends, so the other call's result can hold a draft that throws when it is read, and a Set draft that received it may no longer find it with `has()` or `delete()`. Store `current(draft)`, the original object or the result of that call instead.

### `apply()`

`apply()` applies patches, such as those that `create()` returns with `enablePatches`, and returns the next state.

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

The `options` argument is optional. `enableAutoFreeze`, `strict` and `mark` work as the [options of `create()`](#createstate-fn-options) do. Pass `apply()` the same `mark` as the `create()` calls that generated the patches, so that it drafts the same values, such as class instances.

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

`mutable: true`, available since Mutative 1.2.0, changes the state in place instead, and `apply()` then returns `undefined`:

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

> The `mutable` option cannot be combined with the other options, which development builds report with a warning. It throws for a patch that replaces the root state with another value, such as the patch of a recipe that returns a new state, because the state cannot be replaced in place.

> `apply()` throws for a patch path through the `__proto__` or `constructor` of an object or array, or through the `prototype` of a function, so that patches cannot change the prototypes of objects; Map keys of these names are ordinary keys. It reads the other path segments as properties, as Immer does, and does not guard against prototypes that other code has already changed.

> Patches add and remove Set elements by value, also a changed element of a Set that added or removed elements, and `apply()` copies patch values, so inverse patches cannot remove an object that `apply()` added to a Set, as in an undo after a redo. `apply()` also appends the elements that it adds, so such a Set can hold its elements in another order, and the patches of a later recipe, which find Set elements by position, can then change another element. See [Sets of objects](https://mutative.js.org/docs/advanced-guides/patches#sets-of-objects).

### `current()`

`current(draft)` returns a snapshot of the current value of a draft, with the changes that the recipe has made so far and without the proxies of the draft.

- For a draft that the recipe has not changed, it returns the original value without copying it.
- A changed draft is copied, together with its changed descendants, on every call, so each call returns new objects for it. Take one snapshot for a series of reads rather than calling `current()` in a loop.

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

When strict mode is enabled, reading a value that Mutative does not draft, such as a `Date`, a class instance that no mark makes draftable, or a value that a mark makes mutable, throws outside `unsafe()`.

```ts
import { create, unsafe } from "mutative";

const baseState = {
  createdAt: new Date(Date.UTC(2020, 0, 1)),
  updatedAt: new Date(Date.UTC(2020, 0, 1)),
};

const state = create(
  baseState,
  (draft) => {
    const year = unsafe(() => draft.createdAt.getUTCFullYear());
    expect(year).toBe(2020);
    // Assigning a value is no read and needs no unsafe().
    draft.updatedAt = new Date(Date.UTC(2021, 0, 1));
  },
  {
    strict: true,
  },
);
```

Mutative does not copy the values that it does not draft, so changing one of them, such as with `draft.createdAt.setFullYear(2000)`, changes the base state as well. Replace such values, or mark their class as immutable so that Mutative drafts them.

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

Check if a value is draftable: plain objects, arrays, Maps and Sets are, and other values are when a `mark` makes them draftable.

```ts
const baseState = {
  date: new Date(),
  list: [{ text: "todo" }],
};

expect(isDraftable(baseState.date)).toBeFalsy();
expect(isDraftable(baseState.list)).toBeTruthy();
```

> A mark makes other values draftable. Pass `isDraftable()` the same `mark` as the `create()` calls, as in `isDraftable(value, { mark })`, to get their answer.

### `rawReturn()`

For return values that do not contain any drafts, you can use `rawReturn()` to wrap this return value to improve performance: `create()` then returns it as it is, without searching it for drafts. `rawReturn(undefined)` also makes `undefined` the next state.

Mutative searches the value a recipe returns for drafts, so that drafts mixed into it are replaced. With auto-freeze enabled, production builds do not search frozen objects or the values they hold, so returning an earlier, frozen state, or state built from one, costs little even without `rawReturn()`. Development builds still search them and throw when they find a draft there, so never put a draft in a frozen object or in a value it holds.

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

`markSimpleObject()` is a mark function that makes simple objects draftable: plain objects, objects without a prototype, such as those of `Object.create(null)`, and plain objects of other realms, such as same-origin iframes.

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

See the [API reference](https://mutative.js.org/docs/api-reference) on the website for every option and behavior, and the [generated API docs](./docs/README.md) for the type signatures.

## Using TypeScript

Mutative's types support TypeScript 5.0 and later; the package checks compile them with TypeScript 5.0. The [TypeScript guide](https://mutative.js.org/docs/advanced-guides/typescript) describes how they type drafts, results and producers.

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
- [zustand-mutative](https://github.com/mutativejs/zustand-mutative) - A Zustand middleware that makes `set()` take a Mutative recipe.

[Using Mutative with React](https://mutative.js.org/docs/getting-started/mutative-with-react) shows `create()` with `useState()` and `useReducer()`, and the [ecosystem](https://mutative.js.org/docs/extra-topics/mutative-ecosystem) lists the integrations for Jotai, XState, Yjs, undo and redo, and more.

## FAQs

- I'm already using Immer, can I migrate smoothly to Mutative?

Yes. Unless you have to be compatible with Internet Explorer, Mutative supports almost all of Immer's features, and the [migration guide](https://mutative.js.org/docs/advanced-guides/migration) shows how to replace each API. [Comparison with Immer](https://mutative.js.org/docs/extra-topics/comparison-with-immer) lists the APIs that replace Immer's and every behavior that differs.

> Mutative, like Immer, needs `Proxy`. On Android, React Native supports it since version 0.59 with JavaScriptCore and since version 0.64 with [Hermes](https://reactnative.dev/blog/2021/03/12/version-0.64#hermes-with-proxy-support).

- Can Mutative be integrated with Redux?

Yes. A [producer](https://mutative.js.org/docs/advanced-guides/currying) with an action argument is a reducer, and a recipe can return a new state, for example the initial state with [`rawReturn()`](#rawreturn). Redux Toolkit drafts state with Immer in `createSlice()` and `createReducer()`, and an RFC to make its [`produce()` configurable](https://github.com/reduxjs/redux-toolkit/pull/3074) is open.

- Which array methods run natively on drafts?

`shift`, `unshift`, `splice` and `reverse` move elements directly on the copy of a plain array without holes, including `undefined` elements; `indexOf`, `lastIndexOf` and `includes` search the current array natively; `sort` and `join` run natively on arrays of primitives. Removed elements are returned as drafts, patches replay in both directions, and a call that changes nothing keeps the state. Sparse arrays, array subclasses, an own `constructor` or `Symbol.isConcatSpreadable`, arrays under a custom `mark`, every method with a callback, `at`, `slice`, `fill` and `copyWithin` use the proxy path. An argument that can run user code, such as an object passed as `fromIndex` or as a `splice` index, is converted on the proxy path, so a conversion that changes the array is observed as the native methods observe it. The fast paths are made for data arrays: an accessor property defined on an array index is read as a data value, and the number and order of such getter calls, their re-entrant effects on the draft, and the identity of objects they return are not guaranteed to match element-by-element execution through the proxy. With auto-freeze, Mutative may also read such a getter twice when it copies a frozen, sealed or non-extensible array.

Optimized searches give the same results as the proxy path, comparing elements as a read returns them. Drafts, values assigned in the recipe, non-draftable objects and primitives are found. An object of the base state is drafted when it is read, so it is never found, whether or not it was read before, unless the recipe assigned or inserted it and it is not at its original index; use [`original()`](#original) to search the base state, for example `original(draft.list).indexOf(item)`. The search never reads a property of the value it is given.

In strict mode, outside [`unsafe()`](#unsafe), optimized calls on an array that may hold objects take the proxy path unchanged, so reading a non-draftable element fails exactly as it always did; arrays of primitives, recognized with `typeof` alone, keep the native paths. Elements are moved and compared without being inspected, while the proxy path inspects each element it reads. An element that is itself a Proxy may therefore see fewer calls to its internal methods on the native paths, never more and never at other times; a revoked Proxy element that a search passes over, for example, does not throw there.

Draftable base elements removed or moved by these methods are drafted before they are exposed. Methods with callbacks, such as `forEach`, `map`, `filter` and `find`, go through the draft so that their callbacks see every change and can modify elements; use [`current()`](#current) for read-only scans of large arrays.

- Can a recipe change a Map draft while iterating over it?

Yes. Deleting the entry being visited and changing the values of other entries work as on a Map, and Set drafts iterate like Sets. One difference remains: an iteration over a Map draft that starts before the recipe has changed that Map, or read an object value from it, walks the entries of the base Map. An entry that the recipe deletes later in such an iteration is still visited, with `undefined` as its value, and an entry that it adds is not visited. To delete other entries while iterating, iterate over `Array.from(draft.keys())` and skip the keys for which `draft.has()` returns false.

- Do the Set methods such as `union()` and `isSubsetOf()` work on Set drafts?

Yes, but they compare elements as iterating the draft returns them. An object of the base state is a draft there, so these methods do not match it with the original object, although `has()` accepts the original object. To compare a Set draft with objects of the base state, call the method on `current(draft)`, in which unchanged objects keep their identity, or on `original(draft)` for the base state, or compare ids, for example `[...draft].filter((item) => ids.has(item.id))`. This applies to `union()`, `intersection()`, `difference()`, `symmetricDifference()`, `isSubsetOf()`, `isSupersetOf()` and `isDisjointFrom()`.

- Can a draft be a Map key?

No. Map keys are used as they are, and a draft is revoked when its producer ends, so a Map that kept a draft as a key, and the patches that name that key, would hold a revoked draft, whose properties throw when they are read. Use `original(draft)`, `current(draft)` or an id as the key. Development builds throw when a recipe passes a draft to the `set()` method of a Map draft.

- Does Mutative support shared references?

Yes, Mutative supports shared references, but **each path to a shared object gets its own independent draft**. Modifications to one path do not automatically reflect in others. If you want to preserve shared references in the result, you must explicitly assign them (e.g., `draft.b = draft.a`). [Read more details](https://mutative.js.org/docs/extra-topics/shared-references).

## Migration from Immer to Mutative

[Comparison with Immer](https://mutative.js.org/docs/extra-topics/comparison-with-immer) maps every Immer API to Mutative and lists the behaviors that differ, and the [migration guide](https://mutative.js.org/docs/advanced-guides/migration) also covers manual drafts, classes and async recipes.

> [mutative-compat](https://github.com/exuanbo/mutative-compat) wraps Mutative in Immer's API, for a quick switch before you migrate the calls themselves.

1. `produce()` -> `create()`

Mutative leaves the next state unfrozen unless `enableAutoFreeze` is set, while Immer freezes it by default.

> Check whether your code relies on frozen state, for example to catch accidental mutations. If it does, enable auto-freeze in Mutative.

```ts
import { produce } from "immer";

const baseState = [
  { title: "Learn TypeScript", done: true },
  { title: "Try Immer", done: false },
];

const nextState = produce(baseState, (draft) => {
  draft[1].done = true;
  draft.push({ title: "Tweet about it", done: false });
});
```

Use Mutative

```ts
import { create } from "mutative";

const baseState = [
  { title: "Learn TypeScript", done: true },
  { title: "Try Mutative", done: false },
];

const nextState = create(baseState, (draft) => {
  draft[1].done = true;
  draft.push({ title: "Tweet about it", done: false });
});
```

2. `Patches`

```ts
import { applyPatches, enablePatches, produceWithPatches } from "immer";

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
import { nothing, produce } from "immer";

const baseState: { count: number } | undefined = { count: 1 };

const nextState = produce(baseState, () => nothing);
```

Use Mutative

```ts
import { create, rawReturn } from "mutative";

const baseState: { count: number } | undefined = { count: 1 };

const nextState = create(baseState, () => rawReturn(undefined));
```

## Migration from Mutative v1 to v2

Mutative v2 keeps the v1 API. The changes below, made since v1.3.0, can affect existing code.

### Build output and package entries

- **ES2018 output.** Every build targets ES2018 instead of ES2015, so object spread stays native. Engines that support Proxy but not ES2018 syntax, such as Chrome 49–59, Firefox 18–54, Safari 10–11.0 and Edge 12–18, need Mutative transpiled by your build.
- **Bundlers.** The ESM entry compares `process.env.NODE_ENV` at each development check instead of always running development code. Production bundles, in which the bundler defines `NODE_ENV` as `production`, drop the development checks and warnings and throw minified errors, as CommonJS consumers already did. Bundles that target Node.js without defining `NODE_ENV`, such as esbuild with `platform: 'node'`, now include both CommonJS builds; define `NODE_ENV` or keep Mutative external.
- **Node.js ESM.** In Node.js, `import` resolves a module that re-exports the CommonJS build, so `import` and `require` share one instance and both follow `NODE_ENV`. Previously, `import` always ran the development ESM build as a separate instance.
- **Browsers without a bundler.** `dist/mutative.esm.mjs` and `dist/mutative.esm.js` read `process.env.NODE_ENV`, so a page that loads them directly, for example from a raw CDN URL, fails with `process is not defined`. Load `dist/mutative.esm.production.min.mjs` instead, or the UMD build that the `unpkg` and `jsdelivr` fields point to.
- **Production errors.** Production builds throw `Minified Mutative error #<code>` with a link to the [errors page](https://mutative.js.org/docs/extra-topics/errors) instead of the full message, also for `apply()`, `original()` and `rawReturn()`. Development builds keep the messages. Code that matches error messages in production must match the codes instead.

### Patches

- **Order.** The patches of a nested draft now come before those of its parents, the order Immer uses. For example, `const item = draft.list[0]; draft.list.length = 0; item.text = 'b'; draft.item = item;` yields the `list` length replace before the `item` add. Applying the patches gives the same state as before, and replace patches that only restated an unchanged draft at its original index are no longer emitted.
- **Values.** A patch value that was a draft is now the object that the next state holds instead of a deep copy, and it is frozen with the state when `enableAutoFreeze` is on. `apply()` still copies patch values before applying them. Copy a patch value before mutating it.
- **Moved drafts.** A changed draft that leaves its key, because `sort()` or an assignment moved it or another value replaced it there, no longer emits patches under its old path; the patches of its parent carry its value. In v1, the patches of such a recipe could fail to apply, for example the inverse patches once a primitive took the old key.
- **Set items.** A changed item of a Set that also added or removed items is carried by the Set's `remove` and `add` patches. v1 also emitted patches under the item's position in the changed Set, which replay applied to whatever sat at that position in the base Set, or could not apply at all. A Set that only changed its items keeps the patches under each item's position.
- **Original objects assigned over drafts.** Assigning the original object of a draft to the key that holds the draft is recorded like any other assignment: when the draft was read at that key, the key holds its original value again and emits no patch; when the draft was moved there from another key, the key emits the patch of that assignment. In v1, both cases emitted a `remove` patch for an object key that the state kept, and the second emitted no patch for an array element, so replaying the patches dropped the key or lost the element.

### Arrays

- `shift`, `unshift`, `splice` and `reverse` run natively on the draft's copy of a plain array, and `indexOf`, `lastIndexOf` and `includes` search it natively; see [which array methods run natively](#faqs). For data arrays, the results are those of v1 and the patches replay in both directions. An accessor property on an array index is read as a data value, so its getter may run a different number of times.
- `current()` of a changed array copies the current array instead of reading every element through the draft. Base elements that a native method moved and that hold drafts of an outer `create()` call are left as they are, as unmoved elements always were.
- To search a large array without drafting each element it visits, search `current(draft.list)` and change the match through the draft; see [`current()`](#current).

### Returned values

- With `enableAutoFreeze`, production builds no longer search frozen objects in a value returned from a recipe, the returned value included, or the values they hold, for drafts, and leave a draft there unresolved. Development builds still search them and throw when they find one, also in an unfrozen object that a frozen one holds, where v1 replaced it. Never put a draft in a frozen object or in a value it holds. Without auto-freeze, returned values are searched as in v1.

### Development builds

- In strict mode, development builds warn once when a recipe leaves 1,000 or more drafts unchanged, as a search through a large draft array does.
- In strict mode, `rawReturn()` of a value without drafts no longer prints contradictory warnings.
- With `enablePatches: { pathAsArray: false }`, development builds throw when a patch path would hold a Map key that is not a string, or a symbol key, as a string path cannot name such a key: applying the patch writes another key, for example `'1'` instead of `1`, or fails for a change below that key. Production builds still generate such patches, as v1 did, and still throw a `TypeError` for a symbol key. Keep the default array paths for such keys.
- With `enableAutoFreeze`, development builds report a circular reference only for an object that holds itself. A changed draft that holds its original, as `draft.prev = original(draft)` makes it, or that links to a shared object through another path no longer throws; production builds always froze such states. For a real cycle, the error names the path of the object that repeats, which can be one key longer than in v1.
- Development builds throw when a recipe passes a draft to the `set()` method of a Map draft, as in `draft.map.set(draft.key, value)`: Map keys are used as they are, so the next state would keep the draft as a key, revoked, and reading its properties would throw. Production builds still keep such a key, as v1 did. Use `original(draft)`, `current(draft)` or an id as the key.

### TypeScript

- `create()` with an explicit state type and an async recipe, such as `create<State>(base, async (draft) => { … })`, returns `Promise<State>`, and so do curried producers; v1 typed the result as `State`. A state type that is a type parameter, as in a generic function, or that includes Promises, such as `object` or `unknown`, still gives the state type for async recipes and for recipes that may return a Promise, as in v1; leave out the type argument in generic code.
- `apply()` accepts `enableAutoFreeze: true` and then returns `Immutable<State>`, as `apply<State, true>()` does; v1 rejected the option and typed the frozen result as mutable. With `enableAutoFreeze` typed as `boolean` or optional `true`, the result is `State | Immutable<State>`. With `mutable` typed as `boolean`, optional `boolean`, or optional `true`, `apply()` returns `State | void`.
- A curried producer whose recipe annotates its draft and returns a new state, such as `create((draft: State) => ({ ...draft, count: 0 }))`, returns `State`, or `Promise<State>` for an async recipe. v1 typed such a call as a manual draft, so calling the producer did not compile. A recipe whose draft is annotated with a type parameter, as in `create((draft: T) => { … })` in a generic function, also gives a producer, which v1 typed as a manual draft as well.
- With an explicit state type, a recipe that may or may not return a Promise, such as one typed `(draft: State) => void | Promise<void>`, gives `State | Promise<State>`, also for a primitive state type, such as `number`, and in curried producers and creators from `makeCreator()`. v1 typed the result as `State`.

### Fixes that change results

- With `enablePatches`, every changed item of a Set keeps its changes. In v1, when two or more items of a Set that was not the root changed below their first level, the state kept the change of only one of them.
- A Set that receives an unchanged draft holds the original object, as the rest of the state does, instead of the draft's shallow copy.
- A Set draft that the recipe moves to another place, such as another key, an array, a Map, another Set or a new object, keeps its added, deleted and changed items there when its old place gets another value or is removed; v1 kept its original items.
- A draft of a Set subclass changes its copy, an instance of the subclass, as Map drafts do: the subclass's own `add`, `has`, `delete` and `clear` take effect during the recipe, while the draft iterates the items in the order in which the Set holds them. v1 kept the items of a changed Set in a separate map, which bypassed those methods until it rebuilt the Set after the recipe. As a Map subclass's `set` already had to in v1, a Set subclass's `add` must store the value that it receives: an `add` that stores a copy of a draft, or of an object that holds drafts, leaves those drafts in the next state, where reading them throws.
- Assigning `undefined` to a key that `delete`, `shift`, `unshift` or a shrinking `splice` removed from a draft adds the key back; v1 left a hole or kept the shorter length.
- Under a `mark` that returns `mutable`, a value that the recipe assigned or moved is read back as assigned, through the draft and in `current()`; v1 returned the original value.
- `current()` of a draft whose state holds a plain Set with drafts returns a snapshot; v1 threw.
- `current()` snapshots an object that the recipe assigned and that `mark` makes draftable, such as a class instance, together with the drafts it holds; v1 returned the object as it was, so a later change to those drafts showed through the snapshot.
- With `enableAutoFreeze`, Map and Set instances are frozen too, so adding a property or replacing a method fails as on any frozen object; v1 only replaced their mutators. Later producers skip a frozen Map or Set instead of walking its entries again, and a Map or Set that holds itself no longer overflows the stack in production builds.
- The iterators that Map and Set drafts return behave like built-in iterators: iterating one that was partly consumed continues where it stopped, and iterator helpers such as `toArray()` are available where the engine has them. In v1, iterating such an iterator started over, and only a Map's `keys()` had the helpers.
- Consume Map value and entry iterators, and all Set iterators, while their draft is active. After the producer finishes or fails, or a manual draft is finalized, an iterator cannot yield another value and throws a `TypeError`. Lazy iterator helpers follow the same lifetime; an exhausted iterator stays exhausted. Map keys are not drafted, and `keys()` continues to return a native iterator.
- `apply()` copies the own symbol keys of patch values, and an own `__proto__` key, as `JSON.parse()` creates one, stays a data property. v1 dropped symbol keys there and turned an own `__proto__` key into the prototype of the copy.
- `apply()` rejects a patch whose path ends in `__proto__` on an object or array, as it rejects `__proto__` earlier in a path. Coercible property keys, such as a boxed string, are checked after conversion too. With `mutable: true`, v1 assigned the value and so replaced the prototype of the object.
- In a patch path, `apply()` reads an item of a Set only at its index, such as `1` or `'1'`, and throws for any other key, such as `__proto__`. v1 read any property of an array of the Set's items there, which let a path through `__proto__` reach `Array.prototype`.
- `apply()` with `mutable: true` throws for a patch that replaces the root state with another value, such as the patch of a recipe that returns a new state, as the state cannot be replaced in place. v1 ignored the replacement and applied the patches after it to the replacing value, so the state stayed as it was and the value of that patch changed.
- An object that `mark` makes draftable, such as a plain object under `markSimpleObject`, keeps an own `__proto__` key, as `JSON.parse()` creates one, as a property of its copy; v1 assigned it, which replaced the prototype of the copy.
- A patch for a Map key that is an array holds the key as one path segment; v1 spread the array into the path, so applying the patch wrote to other keys.
- `apply()` uses a Map key of a patch path as it is. v1 converted it to a string first, which threw for an object without a prototype.
- Array patches record a change between `0` and `-0`, which the state already kept; in v1, applying the patches lost the sign. An element that stays `NaN` no longer yields a replace patch.
- When a recipe shortens an array and lengthens it again, as `draft.length = 1; draft.length = 3` does, the patches replace the indices that the longer length exposes again. In v1, applying the patches kept the removed elements at those indices, and applying the inverse patches left holes there.
- In strict mode, a nested `unsafe()` call no longer ends the access of the outer call; in v1, reading mutable data after it in the outer callback threw.
- A producer that fails after its recipe returned, for example because the recipe changed the draft and returned another value, revokes its drafts and releases its array method cache, as a recipe that throws does; v1 left them usable. This also covers errors while inspecting a returned Proxy or calling a returned Promise's `then` method, and preserves the original error.
- A draft of an array whose `Symbol.isConcatSpreadable` is false copies its elements; v1 put the whole array into the copy as its only element.

## Contributing

Mutative's goal is efficient immutable updates. The focus is on performance and on APIs that make development easier, and pull requests that help with either are welcome. For a larger change, open an [issue](https://github.com/unadlib/mutative/issues) or a [discussion](https://github.com/unadlib/mutative/discussions) first.

Development workflow:

- Clone the repository, and use Node.js 22 or 24 with the pnpm version that `package.json` declares.
- Run `pnpm install` to install all the dependencies.
- Run `pnpm test` to run the tests, or `pnpm test --watch` for an interactive test watcher.
- Run `pnpm format`, `pnpm lint` and `pnpm type-check` before you commit.
- Run `pnpm commit` to write a commit message in the [Conventional Commits](https://www.conventionalcommits.org/) format.
- Create a pull request.

[Building and validating Mutative](./BUILDING.md) describes the build pipeline, the package checks, the bundle size limits and the generated API reference. [The benchmark suite](./perf-testing/README.md) compares the current build with Mutative 1.3.0, Immer and hand-written reducers, and describes the regression budgets that CI checks: run `pnpm benchmark:immer:check` to validate every workload and `pnpm benchmark:immer` to measure them.

The [contributing guide](https://mutative.js.org/docs/extra-topics/contributing) also covers the docs: code examples in this README and on the website that import from `mutative` run as tests.

## License

Mutative is [MIT licensed](https://github.com/unadlib/mutative/blob/main/LICENSE).
