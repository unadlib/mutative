[**mutative**](../README.md)

***

[mutative](../README.md) / original

# Function: original()

> **original**\<`T`\>(`target`): `T`

Defined in: [original.ts:22](https://github.com/unadlib/mutative/blob/8667c30c96a236a80844257728eb46826ca6f5d8/src/original.ts#L22)

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

### T

`T`

## Parameters

### target

`T`

## Returns

`T`
