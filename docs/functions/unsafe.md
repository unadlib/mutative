[**mutative**](../README.md) • **Docs**

***

[mutative](../README.md) / unsafe

# Function: unsafe()

> **unsafe**\<`T`\>(`callback`): `T`

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

• **T**

## Parameters

• **callback**

## Returns

`T`

## Defined in

[unsafe.ts:53](https://github.com/unadlib/mutative/blob/4e5a64df3bd670123a9179420fc5820dbbf11915/src/unsafe.ts#L53)
