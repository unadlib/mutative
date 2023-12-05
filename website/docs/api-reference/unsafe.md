---
sidebar_position: 7
---

# unsafe()

When strict mode is enabled, mutable data can only be accessed using `unsafe()`.

## Usage

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

