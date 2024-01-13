---
sidebar_position: 6
---

# rawReturn()

For return values that do not contain any drafts, you can use `rawReturn()` to wrap this return value to improve performance. It ensure that the return value is only returned explicitly.

## Usage

The `rawReturn()` API offers developers an advanced control mechanism over the return value of state mutation operations. Unlike the standard behavior where the state manipulation function returns the updated draft state, `rawReturn()` allows the return of a raw value directly, bypassing the draft mechanism.

When you invoke `rawReturn()` within a state manipulation function, you instruct Mutative to use the value you pass to `rawReturn()` as the final result of the current operation. This capability is particularly useful when the desired outcome of an operation is not a new draft state but a specific value that reflects a computed result or a status code.

Key aspects of the `rawReturn()` API include:

- It overrides the default draft return, enabling a direct and explicit return of any value from a state mutation function.
- This function can be used to return values such as `undefined`, `null`, or any other primitive or object, offering more flexibility in state management scenarios. `rawReturn()` can not return drafts or contain sub-drafts in draft tree, in strict mode `rawReturn()` will also warn if the return value contains drafts.
- It is particularly useful in cases where you want to terminate the draft operation early and return a predetermined value.
- The API helps maintain clear and explicit control over what is returned from mutation operations, aiding in creating predictable state management flows.

In essence, `rawReturn()` expands the versatility of state management in Mutative, enabling developers to return immediate values from within draft operations, thereby enhancing the control they have over state transitions and outcomes.

:::tip
If using Redux, you can use `rawReturn()` to return the default state directly.
:::

```ts
const baseState = { id: 'test' };
const state = create(baseState as { id: string } | undefined, (draft) => {
  return rawReturn(undefined);
});
expect(state).toBe(undefined);
```

> If the return value mixes drafts, you should not use `rawReturn()`.

```ts
const baseState = { a: 1, b: { c: 1 } };
const state = create(baseState, (draft) => {
  if (draft.b.c === 1) {
    return {
      ...draft,
      a: 2,
    };
  }
});
expect(state).toEqual({ a: 2, b: { c: 1 } });
expect(isDraft(state.b)).toBeFalsy();
```

If you use `rawReturn()`, we recommend that you enable [`strict` mode](/docs/advanced-guides/strict-mode) in development.

```ts
const baseState = { a: 1, b: { c: 1 } };
const state = create(
  baseState,
  (draft) => {
    if (draft.b.c === 1) {
      // it will warn `The return value contains drafts, please don't use 'rawReturn()' to wrap the return value.` in strict mode.
      return rawReturn({
        ...draft,
        a: 2,
      });
    }
  },
  {
    strict: true,
  }
);
expect(state).toEqual({ a: 2, b: { c: 1 } });
expect(isDraft(state.b)).toBeFalsy();
```

:::warning
In strict mode, if the return value contains drafts, it will warn:
```
The return value contains drafts, please don't use 'rawReturn()' to wrap the return value
```

If the return value may contain a draft, then please do NOT use `rawReturn()` to wrap the return value.
:::
