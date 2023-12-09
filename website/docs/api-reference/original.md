---
sidebar_position: 5
---

# original()

Get the original value from a draft.

## Usage

The `original()` API in Mutative is an essential function that allows you to obtain the original state from a draft state. When working with immutable state management, it is often necessary to reference the state before any changes were made to understand the transformations that have occurred. This is where `original()` comes into play.

When you make changes to a state using Mutative's drafting system, you are essentially working on a mutable proxy that safely encapsulates changes without affecting the actual state. However, there may be instances where you need to compare the draft to the original, untouched state. The `original()` function provides a direct reference to this untouched state, enabling such comparisons and validations.

Here are some key points about the `original()` API:

- It returns a reference to the state before any modifications were made, allowing you to view the state as it was when the draft was first created.
- This is particularly useful when you need to compare the current draft to the original state to determine what changes have occurred.
- `original()` helps maintain the integrity of the immutable state by providing access to the unaltered state, ensuring that changes can be tracked and managed effectively.
- It is especially useful for debugging purposes and when you need to make decisions based on the history of the state changes.
- Just like with other Mutative APIs, `original()` is designed to be straightforward and easy to use, fitting seamlessly into the library’s philosophy of simplifying immutable state management.

In summary, `original()` is a function that underscores Mutative's commitment to providing tools that make immutable state management both efficient and intuitive, allowing developers to work with a clear understanding of the state throughout the mutation process.

```ts
const baseState = {
  foo: 'bar',
  list: [{ text: 'todo' }],
};

const state = create(baseState, (draft) => {
  draft.foo = 'foobar';
  draft.list.push({ text: 'learning' });
  expect(original(draft.list)).toEqual([{ text: 'todo' }]);
  expect(original(draft.list)).not.toBe(draft.list);
  expect(original(draft.list)).toBe(baseState.list);
});
```

:::tip
`original()` must only be invoked on draft objects and not on original state objects or finalized states.
:::
