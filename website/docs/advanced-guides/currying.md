---
sidebar_position: 2
---

# Currying

Mutative allows for the creation of more modular and reusable state manipulation functions. This is achieved through a technique called currying, which transforms a function that takes multiple arguments into a sequence of functions.

## Create a docs version

Currying in Mutative refers to the technique of transforming a function that takes multiple arguments into a sequence of functions, each with a single argument. This approach is particularly useful in the context of state management, where it allows for greater flexibility and modularity in handling state updates.

Key aspects of currying in Mutative include:

- **Modular State Management**: By using currying, developers can create more granular and composable functions to handle specific aspects of state updates. This enhances code readability and maintainability.

- **Flexibility in Function Invocation**: Currying allows for functions to be called with fewer arguments than they were defined to accept. This is useful in scenarios where state manipulation functions might need to be partially applied or reused across different contexts.

- **Enhanced Code Reusability**: With currying, the same base function can be adapted for different use cases by partially applying different arguments. This promotes code reusability and cleaner code architecture.

- **Integration with State Drafts**: Currying works well with Mutative's draft-based state management system, allowing developers to apply incremental changes to the state in a controlled and predictable manner.

Currying in Mutative offers a powerful way to handle state updates with more precision and clarity. It aligns with the principles of functional programming, bringing added benefits like modularity and reusability to state management. This makes Mutative a versatile tool for developers working on complex applications where efficient and maintainable state manipulation is key.

## Base Currying

### create draft

Support set options such as `const [draft, finalize] = create(baseState, { enableAutoFreeze: true })`.

```ts
const [draft, finalize] = create(baseState);
draft.foobar.bar = 'baz';
const state = finalize();
```
### create producer

Also support set options such as `const produce = create((draft) => {}, { enableAutoFreeze: true })`.

```ts
const produce = create((draft) => {
  draft.foobar.bar = 'baz';
});
const state = produce(baseState);
```

## Enable Patches

```ts
const baseState = {
  foobar: { foo: 'str', bar: 'str' },
  baz: { text: 'str' },
};

const [draft, finalize] = create(baseState, { enablePatches: true });
draft.foobar.bar = 'baz';
const [state, patches, inversePatches] = finalize();

expect(state).toEqual(expectedResult);
expect(state).not.toBe(baseState);
expect(state.foobar).not.toBe(baseState.foobar);
expect(state.baz).toBe(baseState.baz);
expect(patches).toEqual([
  {
    op: 'replace',
    path: ['foobar', 'bar'],
    value: 'baz',
  },
]);
expect(inversePatches).toEqual([
  {
    op: 'replace',
    path: ['foobar', 'bar'],
    value: 'str',
  },
]);
```

:::tip
You can use the custom `create()` function [option](/docs/api-reference/create#createstate-fn-options---options) to implement your own currying function.
:::
