---
sidebar_position: 7
---

# unsafe()

When [strict mode](/docs/advanced-guides/strict-mode) is enabled, mutable data can only be accessed using `unsafe()`.

## Usage

The `unsafe()` provides a means to perform non-standard state mutations which are not typically allowed within the Mutative strict immutability constraints. This API enables direct mutations on draft states or original objects, allowing developers to bypass the protective layers that prevent accidental state mutations.

When used, unsafe() allows for direct assignment and manipulation of properties within a draft state, which can be necessary for certain operations that require a level of flexibility beyond the standard immutable update patterns. For example, it can be used when interacting with complex objects or when integrating with third-party libraries that may not adhere to immutable update patterns.

Key features of the unsafe() API include:

Key features of the `unsafe()` API include:

- Allowing mutations that would be restricted under the library’s strict mode.
- Providing the ability to directly manipulate draft state properties.
- Enabling integration with objects or libraries that require direct state mutation.
- Assisting in scenarios where controlled mutations are necessary and do not undermine the overall integrity of the state management process.

It's important to note that while `unsafe()` can be a powerful tool, it should be used with caution. Since it allows operations that circumvent the core immutability principles of Mutative, it should only be used when such operations are absolutely necessary and when the developer is aware of the potential risks involved. The `unsafe()` API underscores Mutative's commitment to offering robust and flexible state management tools while also catering to advanced use cases where exceptions to the immutability rules are required.

```ts
const baseState = {
  list: [],
  date: new Date(),
};

const state = create(
  baseState,
  (draft) => {
    unsafe(() => {
      draft.date.setFullYear(2000);
    });
    // or return the mutable data:
    // const date = unsafe(() => draft.date);
  },
  {
    strict: true,
  }
);
```

