[**mutative**](../README.md)

***

[mutative](../README.md) / create

# Variable: create()

> `const` **create**: \{\<`T`, `F`, `O`\>(`base`, `mutate`, `options?`): `Result`\<`ExplicitState`\<`T`\>, `O`, `F`\>; \<`T`, `F`, `O`\>(`base`, `mutate`, `options?`): `Promise`\<`Result`\<`ExplicitState`\<`T`\>, `O`, `F`\>\>; \<`T`, `F`, `O`\>(`base`, `mutate`, `options?`): `Result`\<`ExplicitState`\<`T`\>, `O`, `F`\> \| `Promise`\<`Result`\<`ExplicitState`\<`T`\>, `O`, `F`\>\>; \<`T`, `F`, `O`, `R`\>(`base`, `mutate`, `options?`): `CreateResult`\<`T`, `O`, `F`, `R`\>; \<`T`, `F`, `O`, `R`\>(`base`, `mutate`, `options?`): `CreateResult`\<`T`, `O`, `F`, `R`\>; \<`T`, `P`, `F`, `O`\>(`mutate`, `options?`): (`base`, ...`args`) => `Result`\<`ExplicitState`\<`T`\>, `O`, `F`\>; \<`T`, `P`, `F`, `O`\>(`mutate`, `options?`): (`base`, ...`args`) => `Promise`\<`Result`\<`ExplicitState`\<`T`\>, `O`, `F`\>\>; \<`T`, `P`, `F`, `O`\>(`mutate`, `options?`): (`base`, ...`args`) => `Result`\<`ExplicitState`\<`T`\>, `O`, `F`\> \| `Promise`\<`Result`\<`ExplicitState`\<`T`\>, `O`, `F`\>\>; \<`T`, `P`, `F`, `O`, `R`\>(`mutate`, `options?`): (`base`, ...`args`) => `CreateResult`\<`T`, `O`, `F`, `R`\>; \<`T`, `O`, `F`\>(`base`, `options?`): \[[`Draft`](../type-aliases/Draft.md)\<`T`\>, () => `Result`\<`T`, `O`, `F`\>\]; \}

Defined in: [create.ts:25](https://github.com/unadlib/mutative/blob/080a20500efdd03828f63d0f023fc6d7458b3e98/src/create.ts#L25)

`create(baseState, callback, options)` to create the next state

## Example

```ts
import { create } from '../index';

const baseState = { foo: { bar: 'str' }, arr: [] };
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
```

## Call Signature

> \<`T`, `F`, `O`\>(`base`, `mutate`, `options?`): `Result`\<`ExplicitState`\<`T`\>, `O`, `F`\>

### Type Parameters

#### T

`T` = `never`

#### F

`F` *extends* `boolean` = `false`

#### O

`O` *extends* [`PatchesOptions`](../type-aliases/PatchesOptions.md) = `false`

### Parameters

#### base

`ExplicitState`\<`T`\>

#### mutate

`ExplicitRecipe`\<`T`, \[\], `ExplicitSyncReturn`\<`T`\>\>

#### options?

[`Options`](../interfaces/Options.md)\<`O`, `F`\>

### Returns

`Result`\<`ExplicitState`\<`T`\>, `O`, `F`\>

## Call Signature

> \<`T`, `F`, `O`\>(`base`, `mutate`, `options?`): `Promise`\<`Result`\<`ExplicitState`\<`T`\>, `O`, `F`\>\>

### Type Parameters

#### T

`T` = `never`

#### F

`F` *extends* `boolean` = `false`

#### O

`O` *extends* [`PatchesOptions`](../type-aliases/PatchesOptions.md) = `false`

### Parameters

#### base

`ExplicitState`\<`T`\>

#### mutate

`ExplicitRecipe`\<`T`, \[\], `Promise`\<`ExplicitReturn`\<`T`\>\>\>

#### options?

[`Options`](../interfaces/Options.md)\<`O`, `F`\>

### Returns

`Promise`\<`Result`\<`ExplicitState`\<`T`\>, `O`, `F`\>\>

## Call Signature

> \<`T`, `F`, `O`\>(`base`, `mutate`, `options?`): `Result`\<`ExplicitState`\<`T`\>, `O`, `F`\> \| `Promise`\<`Result`\<`ExplicitState`\<`T`\>, `O`, `F`\>\>

### Type Parameters

#### T

`T` = `never`

#### F

`F` *extends* `boolean` = `false`

#### O

`O` *extends* [`PatchesOptions`](../type-aliases/PatchesOptions.md) = `false`

### Parameters

#### base

`ExplicitState`\<`T`\>

#### mutate

`ExplicitRecipe`\<`T`, \[\], `ExplicitMaybeAsyncReturn`\<`T`\>\>

#### options?

[`Options`](../interfaces/Options.md)\<`O`, `F`\>

### Returns

`Result`\<`ExplicitState`\<`T`\>, `O`, `F`\> \| `Promise`\<`Result`\<`ExplicitState`\<`T`\>, `O`, `F`\>\>

## Call Signature

> \<`T`, `F`, `O`, `R`\>(`base`, `mutate`, `options?`): `CreateResult`\<`T`, `O`, `F`, `R`\>

### Type Parameters

#### T

`T` *extends* `unknown`

#### F

`F` *extends* `boolean` = `false`

#### O

`O` *extends* [`PatchesOptions`](../type-aliases/PatchesOptions.md) = `false`

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

## Call Signature

> \<`T`, `F`, `O`, `R`\>(`base`, `mutate`, `options?`): `CreateResult`\<`T`, `O`, `F`, `R`\>

### Type Parameters

#### T

`T` *extends* `unknown`

#### F

`F` *extends* `boolean` = `false`

#### O

`O` *extends* [`PatchesOptions`](../type-aliases/PatchesOptions.md) = `false`

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

## Call Signature

> \<`T`, `P`, `F`, `O`\>(`mutate`, `options?`): (`base`, ...`args`) => `Result`\<`ExplicitState`\<`T`\>, `O`, `F`\>

### Type Parameters

#### T

`T` = `never`

#### P

`P` *extends* `any`[] = \[\]

#### F

`F` *extends* `boolean` = `false`

#### O

`O` *extends* [`PatchesOptions`](../type-aliases/PatchesOptions.md) = `false`

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

## Call Signature

> \<`T`, `P`, `F`, `O`\>(`mutate`, `options?`): (`base`, ...`args`) => `Promise`\<`Result`\<`ExplicitState`\<`T`\>, `O`, `F`\>\>

### Type Parameters

#### T

`T` = `never`

#### P

`P` *extends* `any`[] = \[\]

#### F

`F` *extends* `boolean` = `false`

#### O

`O` *extends* [`PatchesOptions`](../type-aliases/PatchesOptions.md) = `false`

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

## Call Signature

> \<`T`, `P`, `F`, `O`\>(`mutate`, `options?`): (`base`, ...`args`) => `Result`\<`ExplicitState`\<`T`\>, `O`, `F`\> \| `Promise`\<`Result`\<`ExplicitState`\<`T`\>, `O`, `F`\>\>

### Type Parameters

#### T

`T` = `never`

#### P

`P` *extends* `any`[] = \[\]

#### F

`F` *extends* `boolean` = `false`

#### O

`O` *extends* [`PatchesOptions`](../type-aliases/PatchesOptions.md) = `false`

### Parameters

#### mutate

`ExplicitRecipe`\<`T`, `P`, `ExplicitMaybeAsyncReturn`\<`T`\>\>

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

## Call Signature

> \<`T`, `P`, `F`, `O`, `R`\>(`mutate`, `options?`): (`base`, ...`args`) => `CreateResult`\<`T`, `O`, `F`, `R`\>

### Type Parameters

#### T

`T` *extends* `unknown`

#### P

`P` *extends* `any`[] = \[\]

#### F

`F` *extends* `boolean` = `false`

#### O

`O` *extends* [`PatchesOptions`](../type-aliases/PatchesOptions.md) = `false`

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

## Call Signature

> \<`T`, `O`, `F`\>(`base`, `options?`): \[[`Draft`](../type-aliases/Draft.md)\<`T`\>, () => `Result`\<`T`, `O`, `F`\>\]

### Type Parameters

#### T

`T` *extends* `unknown`

#### O

`O` *extends* [`PatchesOptions`](../type-aliases/PatchesOptions.md) = `false`

#### F

`F` *extends* `boolean` = `false`

### Parameters

#### base

`T`

#### options?

[`Options`](../interfaces/Options.md)\<`O`, `F`\>

### Returns

\[[`Draft`](../type-aliases/Draft.md)\<`T`\>, () => `Result`\<`T`, `O`, `F`\>\]
