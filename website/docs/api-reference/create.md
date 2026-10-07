---
sidebar_position: 1
---

# create()

Use `create()` for draft mutation to get a new state, which also supports currying.

## Usage

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

## create(state, fn, options) - options

Then options is optional.

- [strict](/docs/advanced-guides/strict-mode) - `boolean`, the default is false.

  > Forbid accessing non-draftable values in strict mode(unless using [unsafe()](/docs/api-reference/unsafe)).

  > When strict mode is enabled, mutable data can only be accessed using [`unsafe()`](/docs/api-reference/unsafe).

  > **It is recommended to enable `strict` in development mode and disable `strict` in production mode.** This will ensure safe explicit returns and also keep good performance in the production build. If the value that does not mix any current draft or is `undefined` is returned, then use [rawReturn()](/docs/api-reference/rawreturn).

- [enablePatches](/docs/advanced-guides/pathes) - `boolean | { pathAsArray?: boolean; arrayLengthAssignment?: boolean; }`, the default is false.

  > Enable patch, and return the patches/inversePatches.

  > If you need to set the shape of the generated patch in more detail, then you can set `pathAsArray` and `arrayLengthAssignment`。`pathAsArray` default value is `true`, if it's `true`, the path will be an array, otherwise it is a string; `arrayLengthAssignment` default value is `true`, if it's `true`, the array length will be included in the patches, otherwise no include array length(**NOTE**: If `arrayLengthAssignment` is `false`, it is fully compatible with JSON Patch spec, but it may have additional performance loss), [view related discussions](https://github.com/unadlib/mutative/issues/6).

  > A string path is a JSON Pointer and holds only strings, so it cannot name a Map key that is not a string, or a symbol key: with `pathAsArray: false`, the patch of `draft.set(1, 'b')` would set the key `'1'`. Keep the default array paths for such keys; development builds throw an error when a string path would hold one.

- [enableAutoFreeze](/docs/advanced-guides/auto-freeze) - `boolean`, the default is false.

  > Enable autoFreeze, and return frozen state, and enable circular reference checking only in `development` mode.

- [mark](/docs/advanced-guides/mark) - `(target) => ('mutable'|'immutable'|function) | (target) => ('mutable'|'immutable'|function)[]`
  > Set a mark to determine if the value is mutable or if an instance is an immutable, and it can also return a shallow copy function(`AutoFreeze` and `Patches` should both be disabled, Some patches operation might not be equivalent).
  > When the mark function is (target) => 'immutable', it means all the objects in the state structure are immutable. In this specific case, you can totally turn on `AutoFreeze` and `Patches`.
  > `mark` supports multiple marks, and the marks are executed in order, and the first mark that returns a value will be used.

## Currying

```ts
const [draft, finalize] = create(baseState);
draft.foobar.bar = 'baz';
const state = finalize();
```

:::tip
Support set options:
```ts
const [draft, finalize] = create(baseState, { enableAutoFreeze: true });
```

:::

:::caution
Call `finalize()` only once. When it throws, for example because a development build rejects a patch path, the drafts are not revoked as they are when a recipe fails: they stay writable, and a second `finalize()` returns a state that can hold a revoked draft, with patches that miss changes. Create a new draft from the base state instead.
:::

More details about currying, please see [currying](/docs/advanced-guides/currying).

## create() on a draft

A recipe can pass a draft to a helper that calls `create()`. Unlike Immer's `produce`, which drafts the draft itself, `create()` drafts a copy of its current state, `current(draft)`: the values that the helper's recipe leaves unchanged are objects of the base state. Assigning the result back into the outer draft is safe, but changing one of those values afterwards changes the base state, because the outer draft returns an assigned value as it is ([#160](https://github.com/unadlib/mutative/issues/160)). Development builds warn once when `create()` receives a draft with a recipe.

```ts
const state = create(baseState, (draft) => {
  draft.node = create(draft.node, (node) => {
    node.name = 'renamed';
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
