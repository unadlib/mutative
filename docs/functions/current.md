[**mutative**](../README.md)

***

[mutative](../README.md) / current

# Function: current()

## Call Signature

> **current**\<`T`\>(`target`): `T`

Defined in: [current.ts:198](https://github.com/unadlib/mutative/blob/8667c30c96a236a80844257728eb46826ca6f5d8/src/current.ts#L198)

`current(draft)` to get current state in the draft mutation function.

## Example

```ts
import { create, current } from '../index';

const baseState = { foo: { bar: 'str' }, arr: [] };
const state = create(
  baseState,
  (draft) => {
    draft.foo.bar = 'str2';
    expect(current(draft.foo)).toEqual({ bar: 'str2' });
  },
);
```

### Type Parameters

#### T

`T` *extends* `object`

### Parameters

#### target

[`Draft`](../type-aliases/Draft.md)\<`T`\>

### Returns

`T`

## Call Signature

> **current**\<`T`\>(`target`): `T`

Defined in: [current.ts:200](https://github.com/unadlib/mutative/blob/8667c30c96a236a80844257728eb46826ca6f5d8/src/current.ts#L200)

### Type Parameters

#### T

`T` *extends* `object`

### Parameters

#### target

`T`

### Returns

`T`

### Deprecated

You should call current only on `Draft<T>` types.
