---
sidebar_position: 7
---

# Strict Mode

Strict mode in Mutative is a feature designed to reinforce the library’s immutability guarantees by ensuring that state mutations adhere to the principles of immutable update patterns.

## Strict mode options

strict option is `boolean` type, the default is `false`.

- Forbid accessing non-draftable values in strict mode(unless using [unsafe()](/docs/api-reference/unsafe)).

- When strict mode is enabled, mutable data can only be accessed using [`unsafe()`](/docs/api-reference/unsafe).

:::tip
**It is recommended to enable `strict` in development mode and disable `strict` in production mode.** This will ensure safe explicit returns and also keep good performance in the production build. If the value that does not mix any current draft or is `undefined` is returned, then use [rawReturn()](/docs/api-reference/rawreturn).

If you'd like to enable strict mode by default in a development build and turn it off for production, you can use `strict: process.env.NODE_ENV !== 'production'`.
:::

## Enable strict mode

Mutative's strict mode is a safeguard that developers can activate to enforce immutable state updates, thereby maintaining the integrity and predictability of state transitions. When strict mode is enabled, any attempt to directly modify the original state within a draft will throw an error, serving as an immediate alert to the developer that an immutable update rule has been violated. This helps catch potentially harmful mutations during development, allowing developers to address issues before they impact the application's stability.

Key characteristics of strict mode include:

- **Enforcing immutability**: By preventing direct state mutations, strict mode ensures that changes to the application state are made without side effects, preserving the original state until an explicit update is committed.
- **Debugging aid**: It acts as a development aid by providing immediate feedback on improper state mutations, thus helping to identify and rectify bugs early in the development process.
- **Compatibility with advanced operations**: Even in strict mode, Mutative provides APIs like [`unsafe()`](/docs/api-reference/unsafe) and [`rawReturn()`](/docs/api-reference/rawreturn) that allow developers to explicitly bypass immutability checks when necessary. These APIs must be used with a clear understanding of their implications to ensure they do not compromise the application’s state integrity.

Strict mode is indicative of Mutative's commitment to offering robust, error-resistant state management. It is a testament to the library's philosophy of providing tools that encourage best practices while still offering the flexibility to handle advanced state manipulation scenarios when needed. As such, strict mode is an invaluable feature for developers aiming to build applications with a solid foundation in immutable state management principles.

```ts
class Foobar {
  bar = 1;
}

const foobar = new Foobar();
const foobar0 = new Foobar();
const data = {
  foo: {
    bar: 'str',
  },
  foobar,
  foobar0,
};

const state = create(
  data,
  (draft) => {
    unsafe(() => {
      draft.foobar.bar = 2;
    });
    // it will throw an error in strict mode
    draft.foobar0.bar = 3;
  },
  {
    strict: true,
  }
);
```
