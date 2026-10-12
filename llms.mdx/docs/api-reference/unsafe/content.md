# unsafe() (/docs/api-reference/unsafe)

Read values that are not drafted in strict mode.

In [strict mode](/docs/advanced-guides/strict-mode), reading an object that Mutative does not draft throws, such as a `Date`, a class instance that no mark makes draftable, or a value that a `mark` makes mutable. `unsafe(callback)` runs the callback with such reads allowed and returns what it returns.

```ts
unsafe<T>(callback: () => T): T
```

## Usage [#usage]

```ts
import { create, unsafe } from 'mutative';

const baseState = {
  createdAt: new Date(Date.UTC(2020, 0, 1)),
  updatedAt: new Date(Date.UTC(2020, 0, 1)),
};

const state = create(
  baseState,
  (draft) => {
    // Reading a Date from a draft throws in strict mode:
    expect(() => draft.createdAt.getTime()).toThrow();

    const year = unsafe(() => draft.createdAt.getUTCFullYear());
    expect(year).toBe(2020);

    // Assigning a value is no read and needs no unsafe().
    draft.updatedAt = new Date(Date.UTC(2021, 0, 1));
  },
  {
    strict: true,
  }
);

expect(state.updatedAt.getUTCFullYear()).toBe(2021);
expect(baseState.updatedAt.getUTCFullYear()).toBe(2020);
```

Strict mode makes such reads explicit because Mutative does not copy the values that it does not draft: the draft and the base state share them, so a change to one of them, such as `draft.createdAt.setFullYear(2000)`, changes the base state as well, and the next state holds the same object. Replace such values, as the recipe above replaces `updatedAt`, or [mark](/docs/advanced-guides/mark) their class as `immutable` so that Mutative drafts and copies them.

* `unsafe()` allows the reads of all producers until its callback returns. A nested call keeps the access of the outer call until the outer one returns.
* Outside strict mode, `unsafe()` only calls the callback.
* Values that a recipe reads inside `unsafe()` are still drafts when they are draftable, so changes to them are recorded as usual.
