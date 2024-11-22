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

[original.ts:21](https://github.com/unadlib/mutative/blob/7129237bc42b8475743ffff427a1f8f85e8e1e51/src/original.ts#L21)
