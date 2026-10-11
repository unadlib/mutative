[**mutative**](../README.md)

***

[mutative](../README.md) / makeCreator

# Variable: makeCreator()

> `const` **makeCreator**: \<`_F`, `_O`\>(`options?`) => \{\<`T`, `F`, `O`\>(`base`, `mutate`, `options?`): `Result`\<`ExplicitState`\<`T`\>, `O`, `F`\>; \<`T`, `F`, `O`\>(`base`, `mutate`, `options?`): `Promise`\<`Result`\<`ExplicitState`\<`T`\>, `O`, `F`\>\>; \<`T`, `F`, `O`\>(`base`, `mutate`, `options?`): `Result`\<`ExplicitState`\<`T`\>, `O`, `F`\> \| `Promise`\<`Result`\<`ExplicitState`\<`T`\>, `O`, `F`\>\>; \<`T`, `F`, `O`, `R`\>(`base`, `mutate`, `options?`): `CreateResult`\<`T`, `O`, `F`, `R`\>; \<`T`, `F`, `O`, `R`\>(`base`, `mutate`, `options?`): `CreateResult`\<`T`, `O`, `F`, `R`\>; \<`T`, `P`, `F`, `O`\>(`mutate`, `options?`): (`base`, ...`args`) => `Result`\<`ExplicitState`\<`T`\>, `O`, `F`\>; \<`T`, `P`, `F`, `O`\>(`mutate`, `options?`): (`base`, ...`args`) => `Promise`\<`Result`\<`ExplicitState`\<`T`\>, `O`, `F`\>\>; \<`T`, `P`, `F`, `O`\>(`mutate`, `options?`): (`base`, ...`args`) => `Result`\<`ExplicitState`\<`T`\>, `O`, `F`\> \| `Promise`\<`Result`\<`ExplicitState`\<`T`\>, `O`, `F`\>\>; \<`T`, `P`, `F`, `O`, `R`\>(`mutate`, `options?`): (`base`, ...`args`) => `CreateResult`\<`T`, `O`, `F`, `R`\>; \<`T`, `O`, `F`\>(`base`, `options?`): \[[`Draft`](../type-aliases/Draft.md)\<`T`\>, () => `Result`\<`T`, `O`, `F`\>\]; \}

Defined in: [makeCreator.ts:184](https://github.com/unadlib/mutative/blob/8667c30c96a236a80844257728eb46826ca6f5d8/src/makeCreator.ts#L184)

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

### _F

`_F` *extends* `boolean` = `false`

### _O

`_O` *extends* [`PatchesOptions`](../type-aliases/PatchesOptions.md) = `false`

## Parameters

### options?

[`Options`](../interfaces/Options.md)\<`_O`, `_F`\>

## Returns

> \<`T`, `F`, `O`\>(`base`, `mutate`, `options?`): `Result`\<`ExplicitState`\<`T`\>, `O`, `F`\>

### Type Parameters

#### T

`T` = `never`

#### F

`F` *extends* `boolean` = `_F`

#### O

`O` *extends* [`PatchesOptions`](../type-aliases/PatchesOptions.md) = `_O`

### Parameters

#### base

`ExplicitState`\<`T`\>

#### mutate

`ExplicitRecipe`\<`T`, \[\], `ExplicitSyncReturn`\<`T`\>\>

#### options?

[`Options`](../interfaces/Options.md)\<`O`, `F`\>

### Returns

`Result`\<`ExplicitState`\<`T`\>, `O`, `F`\>

> \<`T`, `F`, `O`\>(`base`, `mutate`, `options?`): `Promise`\<`Result`\<`ExplicitState`\<`T`\>, `O`, `F`\>\>

### Type Parameters

#### T

`T` = `never`

#### F

`F` *extends* `boolean` = `_F`

#### O

`O` *extends* [`PatchesOptions`](../type-aliases/PatchesOptions.md) = `_O`

### Parameters

#### base

`ExplicitState`\<`T`\>

#### mutate

`ExplicitRecipe`\<`T`, \[\], `Promise`\<`ExplicitReturn`\<`T`\>\>\>

#### options?

[`Options`](../interfaces/Options.md)\<`O`, `F`\>

### Returns

`Promise`\<`Result`\<`ExplicitState`\<`T`\>, `O`, `F`\>\>

> \<`T`, `F`, `O`\>(`base`, `mutate`, `options?`): `Result`\<`ExplicitState`\<`T`\>, `O`, `F`\> \| `Promise`\<`Result`\<`ExplicitState`\<`T`\>, `O`, `F`\>\>

### Type Parameters

#### T

`T` = `never`

#### F

`F` *extends* `boolean` = `_F`

#### O

`O` *extends* [`PatchesOptions`](../type-aliases/PatchesOptions.md) = `_O`

### Parameters

#### base

`ExplicitState`\<`T`\>

#### mutate

`ExplicitMaybeAsyncRecipe`\<`T`, \[\]\>

#### options?

[`Options`](../interfaces/Options.md)\<`O`, `F`\>

### Returns

`Result`\<`ExplicitState`\<`T`\>, `O`, `F`\> \| `Promise`\<`Result`\<`ExplicitState`\<`T`\>, `O`, `F`\>\>

> \<`T`, `F`, `O`, `R`\>(`base`, `mutate`, `options?`): `CreateResult`\<`T`, `O`, `F`, `R`\>

### Type Parameters

#### T

`T` *extends* `unknown`

#### F

`F` *extends* `boolean` = `_F`

#### O

`O` *extends* [`PatchesOptions`](../type-aliases/PatchesOptions.md) = `_O`

#### R

`R` *extends* `unknown` = `void`

### Parameters

#### base

`T`

#### mutate

(`draft`) => `R`

#### options?

[`Options`](../interfaces/Options.md)\<`O`, `F`\>

### Returns

`CreateResult`\<`T`, `O`, `F`, `R`\>

> \<`T`, `F`, `O`, `R`\>(`base`, `mutate`, `options?`): `CreateResult`\<`T`, `O`, `F`, `R`\>

### Type Parameters

#### T

`T` *extends* `unknown`

#### F

`F` *extends* `boolean` = `_F`

#### O

`O` *extends* [`PatchesOptions`](../type-aliases/PatchesOptions.md) = `_O`

#### R

`R` *extends* `void` \| `Promise`\<`void`\> = `void`

### Parameters

#### base

`T`

#### mutate

(`draft`) => `R`

#### options?

[`Options`](../interfaces/Options.md)\<`O`, `F`\>

### Returns

`CreateResult`\<`T`, `O`, `F`, `R`\>

> \<`T`, `P`, `F`, `O`\>(`mutate`, `options?`): (`base`, ...`args`) => `Result`\<`ExplicitState`\<`T`\>, `O`, `F`\>

### Type Parameters

#### T

`T` = `never`

#### P

`P` *extends* `any`[] = \[\]

#### F

`F` *extends* `boolean` = `_F`

#### O

`O` *extends* [`PatchesOptions`](../type-aliases/PatchesOptions.md) = `_O`

### Parameters

#### mutate

`ExplicitRecipe`\<`T`, `P`, `ExplicitSyncReturn`\<`T`\>\>

#### options?

[`Options`](../interfaces/Options.md)\<`O`, `F`\>

### Returns

> (`base`, ...`args`): `Result`\<`ExplicitState`\<`T`\>, `O`, `F`\>

#### Parameters

##### base

`ExplicitState`\<`T`\>

##### args

...`P`

#### Returns

`Result`\<`ExplicitState`\<`T`\>, `O`, `F`\>

> \<`T`, `P`, `F`, `O`\>(`mutate`, `options?`): (`base`, ...`args`) => `Promise`\<`Result`\<`ExplicitState`\<`T`\>, `O`, `F`\>\>

### Type Parameters

#### T

`T` = `never`

#### P

`P` *extends* `any`[] = \[\]

#### F

`F` *extends* `boolean` = `_F`

#### O

`O` *extends* [`PatchesOptions`](../type-aliases/PatchesOptions.md) = `_O`

### Parameters

#### mutate

`ExplicitRecipe`\<`T`, `P`, `Promise`\<`ExplicitReturn`\<`T`\>\>\>

#### options?

[`Options`](../interfaces/Options.md)\<`O`, `F`\>

### Returns

> (`base`, ...`args`): `Promise`\<`Result`\<`ExplicitState`\<`T`\>, `O`, `F`\>\>

#### Parameters

##### base

`ExplicitState`\<`T`\>

##### args

...`P`

#### Returns

`Promise`\<`Result`\<`ExplicitState`\<`T`\>, `O`, `F`\>\>

> \<`T`, `P`, `F`, `O`\>(`mutate`, `options?`): (`base`, ...`args`) => `Result`\<`ExplicitState`\<`T`\>, `O`, `F`\> \| `Promise`\<`Result`\<`ExplicitState`\<`T`\>, `O`, `F`\>\>

### Type Parameters

#### T

`T` = `never`

#### P

`P` *extends* `any`[] = \[\]

#### F

`F` *extends* `boolean` = `_F`

#### O

`O` *extends* [`PatchesOptions`](../type-aliases/PatchesOptions.md) = `_O`

### Parameters

#### mutate

`ExplicitMaybeAsyncRecipe`\<`T`, `P`\>

#### options?

[`Options`](../interfaces/Options.md)\<`O`, `F`\>

### Returns

> (`base`, ...`args`): `Result`\<`ExplicitState`\<`T`\>, `O`, `F`\> \| `Promise`\<`Result`\<`ExplicitState`\<`T`\>, `O`, `F`\>\>

#### Parameters

##### base

`ExplicitState`\<`T`\>

##### args

...`P`

#### Returns

`Result`\<`ExplicitState`\<`T`\>, `O`, `F`\> \| `Promise`\<`Result`\<`ExplicitState`\<`T`\>, `O`, `F`\>\>

> \<`T`, `P`, `F`, `O`, `R`\>(`mutate`, `options?`): (`base`, ...`args`) => `CreateResult`\<`T`, `O`, `F`, `R`\>

### Type Parameters

#### T

`T` *extends* `unknown`

#### P

`P` *extends* `any`[] = \[\]

#### F

`F` *extends* `boolean` = `_F`

#### O

`O` *extends* [`PatchesOptions`](../type-aliases/PatchesOptions.md) = `_O`

#### R

`R` *extends* `unknown` = `void`

### Parameters

#### mutate

(`draft`, ...`args`) => `R`

#### options?

[`Options`](../interfaces/Options.md)\<`O`, `F`\>

### Returns

> (`base`, ...`args`): `CreateResult`\<`T`, `O`, `F`, `R`\>

#### Parameters

##### base

`T`

##### args

...`P`

#### Returns

`CreateResult`\<`T`, `O`, `F`, `R`\>

> \<`T`, `O`, `F`\>(`base`, `options?`): \[[`Draft`](../type-aliases/Draft.md)\<`T`\>, () => `Result`\<`T`, `O`, `F`\>\]

### Type Parameters

#### T

`T` *extends* `unknown`

#### O

`O` *extends* [`PatchesOptions`](../type-aliases/PatchesOptions.md) = `_O`

#### F

`F` *extends* `boolean` = `_F`

### Parameters

#### base

`T`

#### options?

[`Options`](../interfaces/Options.md)\<`O`, `F`\>

### Returns

\[[`Draft`](../type-aliases/Draft.md)\<`T`\>, () => `Result`\<`T`, `O`, `F`\>\]
