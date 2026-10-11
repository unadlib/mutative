[**mutative**](../README.md)

***

[mutative](../README.md) / rawReturn

# Function: rawReturn()

> **rawReturn**\<`T`\>(`value`): `T`

Defined in: [rawReturn.ts:22](https://github.com/unadlib/mutative/blob/8667c30c96a236a80844257728eb46826ca6f5d8/src/rawReturn.ts#L22)

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
