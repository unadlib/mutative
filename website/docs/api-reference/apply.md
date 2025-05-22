---
sidebar_position: 2
---

# apply()

Use `apply()` for applying [patches](/docs/advanced-guides/pathes) to get the new state.

## Usage

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

// you can apply patches to get the new state
const nextState = apply(baseState, patches);

expect(nextState).toEqual(state);
const prevState = apply(state, inversePatches);
expect(prevState).toEqual(baseState);
```


### `apply(state, patches, options)`

The options parameter is optional and supports two types of configurations:

1. Immutable options (similar to create options but without `enablePatches`):

   - `strict` - `boolean`, forbid accessing non-draftable values in strict mode
   - `enableAutoFreeze` - `boolean`, enable autoFreeze and return frozen state
   - `mark` - mark function to determine if a value is mutable/immutable

```ts
const baseState = { foo: { bar: 'test' } };

// This will create a new state.
const result = apply(baseState, [
  {
    op: 'replace',
    path: ['foo', 'bar'],
    value: 'test2',
  },
]);
expect(baseState).not.toEqual({ foo: { bar: 'test2' } });
expect(result).toEqual({ foo: { bar: 'test2' } });
```

2. Mutable option(Mutative v1.2.0+):
   - `mutable` - `boolean`, if true the state will be mutated directly instead of creating a new state

Example with mutable option:

```ts
const baseState = { foo: { bar: 'test' } };

// This will modify baseState directly
apply(
  baseState,
  [
    {
      op: 'replace',
      path: ['foo', 'bar'],
      value: 'test2',
    },
  ],
  {
    mutable: true,
  }
);
expect(baseState).toEqual({ foo: { bar: 'test2' } });
```

> ⚠️Note: The mutable option cannot be combined with other options. When using mutable option, apply() will return void instead of a new state.

