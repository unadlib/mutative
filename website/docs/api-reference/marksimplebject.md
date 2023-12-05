---
sidebar_position: 10
---

# markSimpleObject()

`markSimpleObject()` is a mark function that marks all objects as immutable.

## Usage

```ts
const baseState = {
  foo: {
    bar: 'str',
  },
  simpleObject: Object.create(null),
};

const state = create(
  baseState,
  (draft) => {
    draft.foo.bar = 'new str';
    draft.simpleObject.a = 'a';
  },
  {
    mark: markSimpleObject,
  }
);

expect(state.simpleObject).not.toBe(baseState.simpleObject);
```

