mutative

# mutative

## Table of contents

### Interfaces

- [Options](interfaces/Options.md)

### Type aliases

- [Draft](README.md#draft)
- [Immutable](README.md#immutable)
- [Patch](README.md#patch)
- [Patches](README.md#patches)

### Functions

- [apply](README.md#apply)
- [castDraft](README.md#castdraft)
- [castImmutable](README.md#castimmutable)
- [create](README.md#create)
- [current](README.md#current)
- [isDraft](README.md#isdraft)
- [isDraftable](README.md#isdraftable)
- [original](README.md#original)
- [safeReturn](README.md#safereturn)
- [unsafe](README.md#unsafe)

## Type aliases

### Draft

Ƭ **Draft**<`T`\>: `T` extends `Primitive` \| `AtomicObject` ? `T` : `T` extends `IfAvailable`<`ReadonlyMap`<infer K, infer V\>\> ? `DraftedMap`<`K`, `V`\> : `T` extends `IfAvailable`<`ReadonlySet`<infer V\>\> ? `DraftedSet`<`V`\> : `T` extends `WeakReferences` ? `T` : `T` extends `object` ? `DraftedObject`<`T`\> : `T`

#### Type parameters

| Name |
| :------ |
| `T` |

#### Defined in

[interface.ts:167](https://github.com/unadlib/mutative/blob/557d56b/src/interface.ts#L167)

___

### Immutable

Ƭ **Immutable**<`T`\>: `T` extends `Primitive` \| `AtomicObject` ? `T` : `T` extends `IfAvailable`<`ReadonlyMap`<infer K, infer V\>\> ? `ImmutableMap`<`K`, `V`\> : `T` extends `IfAvailable`<`ReadonlySet`<infer V\>\> ? `ImmutableSet`<`V`\> : `T` extends `WeakReferences` ? `T` : `T` extends `object` ? `ImmutableObject`<`T`\> : `T`

#### Type parameters

| Name |
| :------ |
| `T` |

#### Defined in

[interface.ts:149](https://github.com/unadlib/mutative/blob/557d56b/src/interface.ts#L149)

___

### Patch

Ƭ **Patch**<`P`\>: `P` extends { `pathAsArray`: ``false``  } ? `IPatch` & { `path`: `string`  } : `P` extends ``true`` \| `object` ? `IPatch` & { `path`: (`string` \| `number`)[]  } : `IPatch` & { `path`: `string` \| (`string` \| `number`)[]  }

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | extends `PatchesOptions` = `any` |

#### Defined in

[interface.ts:63](https://github.com/unadlib/mutative/blob/557d56b/src/interface.ts#L63)

___

### Patches

Ƭ **Patches**<`P`\>: [`Patch`](README.md#patch)<`P`\>[]

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | extends `PatchesOptions` = `any` |

#### Defined in

[interface.ts:77](https://github.com/unadlib/mutative/blob/557d56b/src/interface.ts#L77)

## Functions

### apply

▸ **apply**<`T`, `F`\>(`state`, `patches`, `applyOptions?`): `T` \| `F` extends ``true`` ? [`Immutable`](README.md#immutable)<`T`\> : `T`

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

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `object` |
| `F` | extends `boolean` = ``false`` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `state` | `T` |
| `patches` | [`Patches`](README.md#patches)<`any`\> |
| `applyOptions?` | `Pick`<[`Options`](interfaces/Options.md)<`boolean`, `F`\>, ``"mark"`` \| ``"strict"`` \| ``"enableAutoFreeze"``\> |

#### Returns

`T` \| `F` extends ``true`` ? [`Immutable`](README.md#immutable)<`T`\> : `T`

#### Defined in

[apply.ts:26](https://github.com/unadlib/mutative/blob/557d56b/src/apply.ts#L26)

___

### castDraft

▸ **castDraft**<`T`\>(`value`): [`Draft`](README.md#draft)<`T`\>

Cast a value to an Draft type value.

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `T` |

#### Returns

[`Draft`](README.md#draft)<`T`\>

#### Defined in

[utils/cast.ts:7](https://github.com/unadlib/mutative/blob/557d56b/src/utils/cast.ts#L7)

___

### castImmutable

▸ **castImmutable**<`T`\>(`value`): [`Immutable`](README.md#immutable)<`T`\>

Cast a value to an Immutable type value.

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `T` |

#### Returns

[`Immutable`](README.md#immutable)<`T`\>

#### Defined in

[utils/cast.ts:14](https://github.com/unadlib/mutative/blob/557d56b/src/utils/cast.ts#L14)

___

### create

▸ **create**<`T`, `F`, `O`, `R`\>(`base`, `mutate`, `options?`): `CreateResult`<`T`, `O`, `F`, `R`\>

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

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `unknown` |
| `F` | extends `boolean` = ``false`` |
| `O` | extends `PatchesOptions` = ``false`` |
| `R` | extends `unknown` = `void` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `base` | `T` |
| `mutate` | (`draft`: [`Draft`](README.md#draft)<`T`\>) => `R` |
| `options?` | [`Options`](interfaces/Options.md)<`O`, `F`\> |

#### Returns

`CreateResult`<`T`, `O`, `F`, `R`\>

#### Defined in

[create.ts:41](https://github.com/unadlib/mutative/blob/557d56b/src/create.ts#L41)

▸ **create**<`T`, `F`, `O`, `R`\>(`base`, `mutate`, `options?`): `CreateResult`<`T`, `O`, `F`, `R`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `unknown` |
| `F` | extends `boolean` = ``false`` |
| `O` | extends `PatchesOptions` = ``false`` |
| `R` | extends `void` \| `Promise`<`void`\> = `void` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `base` | `T` |
| `mutate` | (`draft`: `T`) => `R` |
| `options?` | [`Options`](interfaces/Options.md)<`O`, `F`\> |

#### Returns

`CreateResult`<`T`, `O`, `F`, `R`\>

#### Defined in

[create.ts:51](https://github.com/unadlib/mutative/blob/557d56b/src/create.ts#L51)

▸ **create**<`T`, `P`, `F`, `O`, `R`\>(`mutate`, `options?`): (`base`: `T`, ...`args`: `P`) => `CreateResult`<`T`, `O`, `F`, `R`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `unknown` |
| `P` | extends `any`[] = [] |
| `F` | extends `boolean` = ``false`` |
| `O` | extends `PatchesOptions` = ``false`` |
| `R` | extends `void` \| `Promise`<`void`\> = `void` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `mutate` | (`draft`: [`Draft`](README.md#draft)<`T`\>, ...`args`: `P`) => `R` |
| `options?` | [`Options`](interfaces/Options.md)<`O`, `F`\> |

#### Returns

`fn`

▸ (`base`, ...`args`): `CreateResult`<`T`, `O`, `F`, `R`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `base` | `T` |
| `...args` | `P` |

##### Returns

`CreateResult`<`T`, `O`, `F`, `R`\>

#### Defined in

[create.ts:61](https://github.com/unadlib/mutative/blob/557d56b/src/create.ts#L61)

▸ **create**<`T`, `O`, `F`\>(`base`, `options?`): [`T`, () => `Result`<`T`, `O`, `F`\>]

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `unknown` |
| `O` | extends `PatchesOptions` = ``false`` |
| `F` | extends `boolean` = ``false`` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `base` | `T` |
| `options?` | [`Options`](interfaces/Options.md)<`O`, `F`\> |

#### Returns

[`T`, () => `Result`<`T`, `O`, `F`\>]

#### Defined in

[create.ts:71](https://github.com/unadlib/mutative/blob/557d56b/src/create.ts#L71)

___

### current

▸ **current**<`T`\>(`target`): `T`

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

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `object` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `target` | `T` |

#### Returns

`T`

#### Defined in

[current.ts:81](https://github.com/unadlib/mutative/blob/557d56b/src/current.ts#L81)

___

### isDraft

▸ **isDraft**(`target`): `boolean`

Check if the value is a draft

#### Parameters

| Name | Type |
| :------ | :------ |
| `target` | `any` |

#### Returns

`boolean`

#### Defined in

[utils/draft.ts:11](https://github.com/unadlib/mutative/blob/557d56b/src/utils/draft.ts#L11)

___

### isDraftable

▸ **isDraftable**(`value`, `options?`): `boolean`

Check if a value is draftable

#### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `any` |
| `options?` | `Object` |
| `options.mark?` | `Mark`<`any`, `any`\> |

#### Returns

`boolean`

#### Defined in

[utils/draft.ts:28](https://github.com/unadlib/mutative/blob/557d56b/src/utils/draft.ts#L28)

___

### original

▸ **original**<`T`\>(`target`): `T`

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

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `target` | `T` |

#### Returns

`T`

#### Defined in

[original.ts:21](https://github.com/unadlib/mutative/blob/557d56b/src/original.ts#L21)

___

### safeReturn

▸ **safeReturn**<`T`\>(`value`): `T`

It is used as a safe return value to ensure that this value replaces the finalized value.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `undefined` \| `object` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `T` |

#### Returns

`T`

#### Defined in

[safeReturn.ts:6](https://github.com/unadlib/mutative/blob/557d56b/src/safeReturn.ts#L6)

___

### unsafe

▸ **unsafe**<`T`\>(`callback`): `T`

`unsafe(callback)` to access mutable data directly in strict mode.

## Example

```ts
import { create, unsafe } from '../index';

class Foobar {
  bar = 1;
}

const baseState = { foobar: new Foobar() };
const state = create(
  baseState,
  (draft) => {
   unsafe(() => {
     draft.foobar.bar = 2;
   });
  },
  {
    strict: true,
  }
);

expect(state).toBe(baseState);
expect(state.foobar).toBe(baseState.foobar);
expect(state.foobar.bar).toBe(2);
```

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `callback` | () => `T` |

#### Returns

`T`

#### Defined in

[unsafe.ts:53](https://github.com/unadlib/mutative/blob/557d56b/src/unsafe.ts#L53)
