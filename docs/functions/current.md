[**mutative**](../README.md) • **Docs**

***

[mutative](../README.md) / current

# Function: current()

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

## Type Parameters

• **T** *extends* `object`

## Parameters

• **target**: `T`

## Returns

`T`

## Defined in

[current.ts:104](https://github.com/unadlib/mutative/blob/4e5a64df3bd670123a9179420fc5820dbbf11915/src/current.ts#L104)
