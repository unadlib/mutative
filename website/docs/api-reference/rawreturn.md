---
sidebar_position: 6
---

# rawReturn()

For return values that do not contain any drafts, you can use `rawReturn()` to wrap this return value to improve performance. It ensure that the return value is only returned explicitly.

## Usage

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

If you use `rawReturn()`, we recommend that you enable `strict` mode in development.

```ts
const baseState = { a: 1, b: { c: 1 } };
const state = create(
  baseState,
  (draft) => {
    if (draft.b.c === 1) {
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
// it will warn `The return value contains drafts, please don't use 'rawReturn()' to wrap the return value.` in strict mode.
expect(state).toEqual({ a: 2, b: { c: 1 } });
expect(isDraft(state.b)).toBeFalsy();
```

