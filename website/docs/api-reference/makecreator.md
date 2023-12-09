---
sidebar_position: 3
---

# makeCreator()

`makeCreator()` only takes [options](/docs/api-reference/create#createstate-fn-options---options) as the first argument, resulting in a custom `create()` function.

## Usage

This function can be particularly useful when dealing with drafts in state management. After initiating changes using mutative create, a draft state is created, which is a mutable proxy of the original state. This draft state can be modified without affecting the original state. The current() function allows you to access the state of this draft at any time, providing a snapshot of the state at the moment of invocation.

```ts
const baseState = {
  foo: {
    bar: 'str',
  },
};

const create = makeCreator({
  enablePatches: true,
});

const [state, patches, inversePatches] = create(baseState, (draft) => {
  draft.foo.bar = 'new str';
});

// you can use the custom `create()` function option to override the default `makeCreator()` options like this:
const nextState = create(
  baseState,
  (draft) => {
    draft.foo.bar = 'new str';
  },
  {
    enablePatches: false,
  }
);
```
