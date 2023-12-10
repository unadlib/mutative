---
sidebar_position: 2
---

# Marking data structure

Mark options provides additional controls or flags to determine `immutability` or `mutability` of data nodes in drafts function execution process, or `customize shallow copy` for creating drafts.

## Customize mark

Mark options are a set of configurations that dictate how the `immutable` or `mutable` handles state during the drafting and updating process. These options offer developers more control and flexibility in managing state changes, allowing for customized behavior based on the specific requirements of the application.

Key aspects of mark options include:

- **Customizable State Management**: Mark options enable developers to tailor the state management process. This includes defining how state changes are tracked, how drafts are created about shallow copy, and how changes are finalized.

- **Enhanced Flexibility**: Mark options support array marking, which allows for more granular and composable control over state updates. This is particularly useful in scenarios where different parts of the state might require different handling.

- **Non-invasive marking**: Mark options are designed to be non-invasive, meaning that they do not affect the state itself. This ensures that the state remains unaltered and can be safely accessed at any time.

```ts
class FooBar {
  constructor(public bar?: string) {}
}

const bar = {
  bar: 'str',
};

const baseState = {
  bar,
  date: new Date(0),
  fooBar: new FooBar('str'),
};

const nextState = create(
  baseState,
  (draft) => {
    draft.date.setFullYear(2000);
    draft.bar.bar = 'new str';
    draft.fooBar.bar = 'new str';
  },
  {
    mark: (target, { mutable, immutable }) => {
      if (target instanceof Date) return () => new Date(target.getTime());
      if (target === bar) return mutable;
      if (target instanceof FooBar) return immutable;
    },
  }
);
expect(nextState).not.toBe(baseState);
expect(nextState.bar).toBe(baseState.bar);
expect(nextState.date).not.toBe(baseState.date);
expect(nextState.fooBar).not.toBe(baseState.fooBar);
```

:::tip
Set a mark to determine if the value is mutable or if an instance is an immutable, and it can also return a shallow copy function(AutoFreeze and Patches should both be disabled, Some patches operation might not be equivalent). When the mark function is (target) => 'immutable', it means all the objects in the state structure are immutable. In this specific case, you can totally turn on AutoFreeze and Patches. mark supports multiple marks, and the marks are executed in order, and the first mark that returns a value will be used.
:::
