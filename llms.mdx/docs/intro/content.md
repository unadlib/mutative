# Introduction (/docs/intro)

Mutative is a JavaScript library for efficient immutable updates. Change a draft with ordinary JavaScript, and get the next immutable state.

**Mutative** is a JavaScript library for efficient immutable updates. A recipe changes a draft of the state with ordinary JavaScript, and Mutative produces the next state, copying only what the recipe changed. It was about 3.6x faster than Immer with matched settings and 6.6x faster with each library's defaults, across [97 benchmarked workloads](/docs/getting-started/performance).

## What is Mutative? [#what-is-mutative]

State that React, Redux and many other libraries compare by reference must not change in place: each update produces a new state, which copies the objects on the path to every change and shares all the others. Written by hand with spread syntax, such an update grows with the depth of the change, and a missed copy changes the previous state.

For example, take a state with a list, and mark its last item as done and add a new item, first by hand and then with Mutative:

```ts
import { create } from 'mutative';

const state = {
  list: [
    { text: 'Learn TypeScript', done: true },
    { text: 'Learn React', done: true },
    { text: 'Learn Redux', done: false },
  ],
};

// By hand, copying each level on the path to the changes:
const byHand = {
  ...state,
  list: [
    ...state.list.slice(0, 2),
    { ...state.list[2], done: true },
    { text: 'Learn Mutative', done: true },
  ],
};

// With Mutative, changing a draft:
const nextState = create(state, (draft) => {
  draft.list[2].done = true;
  draft.list.push({ text: 'Learn Mutative', done: true });
});

expect(nextState).toEqual(byHand);
// The unchanged items are shared, and the base state is unchanged.
expect(nextState.list[0]).toBe(state.list[0]);
expect(state.list[2].done).toBe(false);
```

The draft is a proxy of the state: Mutative copies an object the first time the recipe changes it, and the next state shares every object that the recipe left unchanged. See [Concepts](/docs/getting-started/concepts) for how it works.

## Features and Benefits [#features-and-benefits]

* **Mutation makes immutable updates** - Immutable updates of objects, arrays, Maps and Sets, written as mutations of a draft.
* **High performance** - About 6.6x faster than Immer with each library's defaults, and faster than hand-written spreads in measured wide-object and large-array insertion workloads.
* **Optional freezing state** - No freezing of immutable data by default, and [auto-freeze](/docs/advanced-guides/auto-freeze) when you want it.
* **Support for JSON Patch** - [Patches](/docs/advanced-guides/patches) use the `add`, `remove` and `replace` operations of JSON Patch, and with `pathAsArray: false` and `arrayLengthAssignment: false`, those of objects and arrays are JSON Patch operations.
* **Custom shallow copy** - [Marks](/docs/advanced-guides/mark) draft class instances and other types of immutable data, with their own shallow copies if needed.
* **Support mark for immutable and mutable data** - Marks set what is drafted without changing the data or its classes.
* **Safer mutable data access in strict mode** - [Strict mode](/docs/advanced-guides/strict-mode) makes reads of data that cannot be drafted explicit.
* **Support for reducer** - [Producers](/docs/advanced-guides/currying) work as reducers for Redux and any other immutable state library, and recipes can be async.

## Motivation [#motivation]

Immer made it easy to write immutable updates as mutations of a draft. Mutative keeps that model and focuses on performance: it copies each object at most once per update, drafts objects only when a recipe reads them, finalizes only the drafts that changed, and runs array methods that move elements natively on its copies. Immer freezes the next state by default, which costs time on every update; Mutative freezes it only when asked to.

Mutative also takes its options per call instead of from global configuration, drafts class instances through marks instead of changing their classes, supports async recipes and Map and Set subclasses, and handles [edge cases](https://github.com/unadlib/mutative/blob/main/test/immer-non-support.test.ts) that Immer gets wrong. [Comparison with Immer](/docs/extra-topics/comparison-with-immer) lists the differences.

## Next steps [#next-steps]

<Cards>
  <Card title="Installation" href="/docs/getting-started/installation">
    Add Mutative to a project, or load it from a CDN.
  </Card>

  <Card title="Usages" href="/docs/getting-started/usages">
    Update objects, arrays, Maps and Sets with `create()`.
  </Card>

  <Card title="Concepts" href="/docs/getting-started/concepts">
    Drafts, structural sharing, patches and marks.
  </Card>

  <Card title="Migration from Immer" href="/docs/advanced-guides/migration">
    Replace Immer's APIs with their Mutative counterparts.
  </Card>
</Cards>

## Credits [#credits]

Mutative is inspired by [Immer](https://immerjs.github.io/immer/), which has helped many people write simpler immutable updates. Mutative is based on the same idea, with a different implementation and more features.
