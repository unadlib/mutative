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

Then options is optional.

- strict - `boolean`, the default is false.

  > Forbid accessing non-draftable values in strict mode(unless using [unsafe()](#unsafe)).

  > When strict mode is enabled, mutable data can only be accessed using [`unsafe()`](#unsafe).

  > **It is recommended to enable `strict` in development mode and disable `strict` in production mode.** This will ensure safe explicit returns and also keep good performance in the production build. If the value that does not mix any current draft or is `undefined` is returned, then use [rawReturn()](#rawreturn).

- enablePatches - `boolean | { pathAsArray?: boolean; arrayLengthAssignment?: boolean; }`, the default is false.

  > Enable patch, and return the patches/inversePatches.

  > If you need to set the shape of the generated patch in more detail, then you can set `pathAsArray` and `arrayLengthAssignment`。`pathAsArray` default value is `true`, if it's `true`, the path will be an array, otherwise it is a string; `arrayLengthAssignment` default value is `true`, if it's `true`, the array length will be included in the patches, otherwise no include array length(**NOTE**: If `arrayLengthAssignment` is `false`, it is fully compatible with JSON Patch spec, but it may have additional performance loss), [view related discussions](https://github.com/unadlib/mutative/issues/6).

- enableAutoFreeze - `boolean`, the default is false.

  > Enable autoFreeze, and return frozen state, and enable circular reference checking only in `development` mode.

- mark - `(target) => ('mutable'|'immutable'|function) | (target) => ('mutable'|'immutable'|function)[]`
  > Set a mark to determine if the value is mutable or if an instance is an immutable, and it can also return a shallow copy function(`AutoFreeze` and `Patches` should both be disabled, Some patches operation might not be equivalent).
  > When the mark function is (target) => 'immutable', it means all the objects in the state structure are immutable. In this specific case, you can totally turn on `AutoFreeze` and `Patches`.
  > `mark` supports multiple marks, and the marks are executed in order, and the first mark that returns a value will be used.

## Currying

```ts
const [draft, finalize] = create(baseState);
draft.foobar.bar = 'baz';
const state = finalize();
```

> Support set options such as `const [draft, finalize] = create(baseState, { enableAutoFreeze: true });`
