---
sidebar_position: 8
---

# isDraftable()

Check if a value is draftable

## Usage

```ts
const baseState = {
  date: new Date(),
  list: [{ text: 'todo' }],
};

expect(isDraftable(baseState.date)).toBeFalsy();
expect(isDraftable(baseState.list)).toBeTruthy();
```

> You can set a mark to determine if the value is draftable, and the mark function should be the same as passing in `create()` mark option.


