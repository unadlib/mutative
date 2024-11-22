[**mutative**](../README.md) • **Docs**

***

[mutative](../README.md) / rawReturn

# Function: rawReturn()

> **rawReturn**\<`T`\>(`value`): `T`

Use rawReturn() to wrap the return value to skip the draft check and thus improve performance.

## Example

```ts
import { create, rawReturn } from '../index';

const baseState = { foo: { bar: 'str' }, arr: [] };
const state = create(
  baseState,
  (draft) => {
    return rawReturn(baseState);
  },
);
expect(state).toBe(baseState);
```

## Type Parameters

• **T** *extends* `undefined` \| `object`

## Parameters

• **value**: `T`

## Returns

`T`

## Defined in

[rawReturn.ts:21](https://github.com/unadlib/mutative/blob/7129237bc42b8475743ffff427a1f8f85e8e1e51/src/rawReturn.ts#L21)
