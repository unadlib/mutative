[**mutative**](../README.md)

***

[mutative](../README.md) / rawReturn

# Function: rawReturn()

> **rawReturn**\<`T`\>(`value`): `T`

Defined in: [rawReturn.ts:22](https://github.com/unadlib/mutative/blob/cbcd06102ce38252b6fa8b2c9f28a18ba9d9fbe9/src/rawReturn.ts#L22)

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

### T

`T` *extends* `undefined` \| `object`

## Parameters

### value

`T`

## Returns

`T`
