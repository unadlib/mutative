[**mutative**](../README.md)

***

[mutative](../README.md) / unsafe

# Function: unsafe()

> **unsafe**\<`T`\>(`callback`): `T`

Defined in: [unsafe.ts:57](https://github.com/unadlib/mutative/blob/c2e96282fb77355d4c5f83d86c6d201dee734d45/src/unsafe.ts#L57)

`unsafe(callback)` to access mutable data directly in strict mode.

## Example

```ts
import { create, unsafe } from '../index';

class Foobar {
  bar = 1;
}

const baseState = { foobar: new Foobar() };
const state = create(
  baseState,
  (draft) => {
   unsafe(() => {
     draft.foobar.bar = 2;
   });
  },
  {
    strict: true,
  }
);

expect(state).toBe(baseState);
expect(state.foobar).toBe(baseState.foobar);
expect(state.foobar.bar).toBe(2);
```

## Type Parameters

### T

`T`

## Parameters

### callback

() => `T`

## Returns

`T`
