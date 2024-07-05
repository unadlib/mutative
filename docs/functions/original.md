[**mutative**](../README.md) • **Docs**

***

[mutative](../README.md) / original

# Function: original()

> **original**\<`T`\>(`target`): `T`

`original(draft)` to get original state in the draft mutation function.

## Example

```ts
import { create, original } from '../index';

const baseState = { foo: { bar: 'str' }, arr: [] };
const state = create(
  baseState,
  (draft) => {
    draft.foo.bar = 'str2';
    expect(original(draft.foo)).toEqual({ bar: 'str' });
  }
);
```

## Type Parameters

• **T**

## Parameters

• **target**: `T`

## Returns

`T`

## Defined in

[original.ts:21](https://github.com/unadlib/mutative/blob/4e5a64df3bd670123a9179420fc5820dbbf11915/src/original.ts#L21)
