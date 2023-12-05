---
sidebar_position: 9
---

# isDraft()

Check if a value is a draft.

## Usage

```ts
const baseState = {
  date: new Date(),
  list: [{ text: 'todo' }],
};

const state = create(baseState, (draft) => {
  expect(isDraft(draft.date)).toBeFalsy();
  expect(isDraft(draft.list)).toBeTruthy();
});
```

