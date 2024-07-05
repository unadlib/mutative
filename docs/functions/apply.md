[**mutative**](../README.md) • **Docs**

***

[mutative](../README.md) / apply

# Function: apply()

> **apply**\<`T`, `F`\>(`state`, `patches`, `applyOptions`?): `T` \| `F` *extends* `true` ? [`Immutable`](../type-aliases/Immutable.md)\<`T`\> : `T`

`apply(state, patches)` to apply patches to state

## Example

```ts
import { create, apply } from '../index';

const baseState = { foo: { bar: 'str' }, arr: [] };
const [state, patches] = create(
  baseState,
  (draft) => {
    draft.foo.bar = 'str2';
  },
  { enablePatches: true }
);
expect(state).toEqual({ foo: { bar: 'str2' }, arr: [] });
expect(patches).toEqual([{ op: 'replace', path: ['foo', 'bar'], value: 'str2' }]);
expect(state).toEqual(apply(baseState, patches));
```

## Type Parameters

• **T** *extends* `object`

• **F** *extends* `boolean` = `false`

## Parameters

• **state**: `T`

• **patches**: [`Patches`](../type-aliases/Patches.md)

• **applyOptions?**: `Pick`\<`Options`\<`boolean`, `F`\>, `"mark"` \| `"strict"` \| `"enableAutoFreeze"`\>

## Returns

`T` \| `F` *extends* `true` ? [`Immutable`](../type-aliases/Immutable.md)\<`T`\> : `T`

## Defined in

[apply.ts:26](https://github.com/unadlib/mutative/blob/4e5a64df3bd670123a9179420fc5820dbbf11915/src/apply.ts#L26)
