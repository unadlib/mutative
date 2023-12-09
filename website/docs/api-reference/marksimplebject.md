---
sidebar_position: 10
---

# markSimpleObject()

`markSimpleObject()` is a mark function that marks all objects as immutable.

## Usage

If you want to mark all objects as immutable(raw object,  plain object without prototype chains or cross-iframe objects with same domain), you can use `markSimpleObject()`.

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

