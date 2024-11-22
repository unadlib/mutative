[**mutative**](../README.md) • **Docs**

***

[mutative](../README.md) / current

# Function: current()

## current(target)

> **current**\<`T`\>(`target`): `T`

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

• **T** *extends* `object`

### Parameters

• **target**: [`Draft`](../type-aliases/Draft.md)\<`T`\>

### Returns

`T`

### Defined in

[current.ts:120](https://github.com/unadlib/mutative/blob/7129237bc42b8475743ffff427a1f8f85e8e1e51/src/current.ts#L120)

## current(target)

> **current**\<`T`\>(`target`): `T`

### Type Parameters

• **T** *extends* `object`

### Parameters

• **target**: `T`

### Returns

`T`

### Deprecated

You should call current only on `Draft<T>` types.

### Defined in

[current.ts:122](https://github.com/unadlib/mutative/blob/7129237bc42b8475743ffff427a1f8f85e8e1e51/src/current.ts#L122)
