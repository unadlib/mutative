[**mutative**](../README.md) • **Docs**

***

[mutative](../README.md) / makeCreator

# Function: makeCreator()

> **makeCreator**\<`_F`, `_O`\>(`options`?): \<`T`, `F`, `O`, `R`\>(`base`, `mutate`, `options`?) => `CreateResult`\<`T`, `O`, `F`, `R`\>\<`T`, `F`, `O`, `R`\>(`base`, `mutate`, `options`?) => `CreateResult`\<`T`, `O`, `F`, `R`\>\<`T`, `P`, `F`, `O`, `R`\>(`mutate`, `options`?) => (`base`, ...`args`) => `CreateResult`\<`T`, `O`, `F`, `R`\>\<`T`, `O`, `F`\>(`base`, `options`?) => [`T`, () => `Result`\<`T`, `O`, `F`\>]

`makeCreator(options)` to make a creator function.

## Example

```ts
import { makeCreator } from '../index';

const baseState = { foo: { bar: 'str' }, arr: [] };
const create = makeCreator({ enableAutoFreeze: true });
const state = create(
  baseState,
  (draft) => {
    draft.foo.bar = 'str2';
  },
);

expect(state).toEqual({ foo: { bar: 'str2' }, arr: [] });
expect(state).not.toBe(baseState);
expect(state.foo).not.toBe(baseState.foo);
expect(state.arr).toBe(baseState.arr);
expect(Object.isFrozen(state)).toBeTruthy();
```

## Type Parameters

• **_F** *extends* `boolean` = `false`

• **_O** *extends* [`PatchesOptions`](../type-aliases/PatchesOptions.md) = `false`

## Parameters

• **options?**: [`Options`](../interfaces/Options.md)\<`_O`, `_F`\>

## Returns

`Function`

### Type Parameters

• **T** *extends* `unknown`

• **F** *extends* `boolean` = `_F`

• **O** *extends* [`PatchesOptions`](../type-aliases/PatchesOptions.md) = `_O`

• **R** *extends* `unknown` = `void`

### Parameters

• **base**: `T`

• **mutate**

• **options?**: [`Options`](../interfaces/Options.md)\<`O`, `F`\>

### Returns

`CreateResult`\<`T`, `O`, `F`, `R`\>

### Type Parameters

• **T** *extends* `unknown`

• **F** *extends* `boolean` = `_F`

• **O** *extends* [`PatchesOptions`](../type-aliases/PatchesOptions.md) = `_O`

• **R** *extends* `void` \| `Promise`\<`void`\> = `void`

### Parameters

• **base**: `T`

• **mutate**

• **options?**: [`Options`](../interfaces/Options.md)\<`O`, `F`\>

### Returns

`CreateResult`\<`T`, `O`, `F`, `R`\>

### Type Parameters

• **T** *extends* `unknown`

• **P** *extends* `any`[] = []

• **F** *extends* `boolean` = `_F`

• **O** *extends* [`PatchesOptions`](../type-aliases/PatchesOptions.md) = `_O`

• **R** *extends* `void` \| `Promise`\<`void`\> = `void`

### Parameters

• **mutate**

• **options?**: [`Options`](../interfaces/Options.md)\<`O`, `F`\>

### Returns

`Function`

#### Parameters

• **base**: `T`

• ...**args**: `P`

#### Returns

`CreateResult`\<`T`, `O`, `F`, `R`\>

### Type Parameters

• **T** *extends* `unknown`

• **O** *extends* [`PatchesOptions`](../type-aliases/PatchesOptions.md) = `_O`

• **F** *extends* `boolean` = `_F`

### Parameters

• **base**: `T`

• **options?**: [`Options`](../interfaces/Options.md)\<`O`, `F`\>

### Returns

[`T`, () => `Result`\<`T`, `O`, `F`\>]

## Defined in

[makeCreator.ts:87](https://github.com/unadlib/mutative/blob/4e5a64df3bd670123a9179420fc5820dbbf11915/src/makeCreator.ts#L87)
