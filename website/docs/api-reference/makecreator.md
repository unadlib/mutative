---
sidebar_position: 3
---

# makeCreator()

`makeCreator()` only takes [options](#createstate-fn-options) as the first argument, resulting in a custom `create()` function.

## Usage

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
```
