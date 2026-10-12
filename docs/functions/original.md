[**mutative**](../README.md)

***

[mutative](../README.md) / original

# Function: original()

> **original**\<`T`\>(`target`): `T`

`original(draft)` to get original state in the draft mutation function.

## Example

```ts
import { create, original } from 'mutative';

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
