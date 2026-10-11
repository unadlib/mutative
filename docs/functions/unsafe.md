[**mutative**](../README.md)

***

[mutative](../README.md) / unsafe

# Function: unsafe()

> **unsafe**\<`T`\>(`callback`): `T`

Defined in: [unsafe.ts:57](https://github.com/unadlib/mutative/blob/080a20500efdd03828f63d0f023fc6d7458b3e98/src/unsafe.ts#L57)

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
