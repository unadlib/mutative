mutative

# mutative

## Table of contents

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
- [original](README.md#original)
- [unsafe](README.md#unsafe)

## Type aliases

### Draft

Ƭ **Draft**<`T`\>: `T` extends `Primitive` \| `AtomicObject` ? `T` : `T` extends `IfAvailable`<`ReadonlyMap`<infer K, infer V\>\> ? `DraftedMap`<`K`, `V`\> : `T` extends `IfAvailable`<`ReadonlySet`<infer V\>\> ? `DraftedSet`<`V`\> : `T` extends `WeakReferences` ? `T` : `T` extends `object` ? `DraftedObject`<`T`\> : `T`

#### Type parameters

| Name |
| :------ |
| `T` |

#### Defined in

[interface.ts:121](https://github.com/unadlib/mutative/blob/0ec70ad/src/interface.ts#L121)

___

### Immutable

Ƭ **Immutable**<`T`\>: `T` extends `Primitive` \| `AtomicObject` ? `T` : `T` extends `IfAvailable`<`ReadonlyMap`<infer K, infer V\>\> ? `ImmutableMap`<`K`, `V`\> : `T` extends `IfAvailable`<`ReadonlySet`<infer V\>\> ? `ImmutableSet`<`V`\> : `T` extends `WeakReferences` ? `T` : `T` extends `object` ? `ImmutableObject`<`T`\> : `T`

#### Type parameters

| Name |
| :------ |
| `T` |

#### Defined in

[interface.ts:103](https://github.com/unadlib/mutative/blob/0ec70ad/src/interface.ts#L103)

___

### Patch

Ƭ **Patch**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `op` | `Lowercase`<keyof typeof `Operation`\> |
| `path` | (`string` \| `number`)[] |
| `value?` | `any` |

#### Defined in

[interface.ts:27](https://github.com/unadlib/mutative/blob/0ec70ad/src/interface.ts#L27)

___

### Patches

Ƭ **Patches**: [`Patch`](README.md#patch)[]

#### Defined in

[interface.ts:33](https://github.com/unadlib/mutative/blob/0ec70ad/src/interface.ts#L33)

## Functions

### apply

▸ **apply**<`T`, `F`\>(`state`, `patches`, `applyOptions?`): `T` \| `F` extends ``true`` ? [`Immutable`](README.md#immutable)<`T`\> : `T`

`apply(state, patches)` to apply patches to state

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `object` |
| `F` | extends `boolean` = ``false`` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `state` | `T` |
| `patches` | [`Patches`](README.md#patches) |
| `applyOptions?` | `Pick`<`Options`<`boolean`, `F`\>, ``"strict"`` \| ``"enableAutoFreeze"`` \| ``"mark"``\> |

#### Returns

`T` \| `F` extends ``true`` ? [`Immutable`](README.md#immutable)<`T`\> : `T`

#### Defined in

[apply.ts:9](https://github.com/unadlib/mutative/blob/0ec70ad/src/apply.ts#L9)

___

### castDraft

▸ **castDraft**<`T`\>(`value`): `T` extends `object` ? [`Draft`](README.md#draft)<`T`\> : `T`

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

`T` extends `object` ? [`Draft`](README.md#draft)<`T`\> : `T`

#### Defined in

[utils/cast.ts:6](https://github.com/unadlib/mutative/blob/0ec70ad/src/utils/cast.ts#L6)

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

[utils/cast.ts:13](https://github.com/unadlib/mutative/blob/0ec70ad/src/utils/cast.ts#L13)

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
| `T` | extends `object` |
| `F` | extends `boolean` = ``false`` |
| `O` | extends `boolean` = ``false`` |
| `R` | extends `void` \| `Promise`<`void`\> = `void` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `base` | `T` |
| `mutate` | (`draft`: [`Draft`](README.md#draft)<`T`\>) => `R` |
| `options?` | `Options`<`O`, `F`\> |

#### Returns

`CreateResult`<`T`, `O`, `F`, `R`\>

#### Defined in

[create.ts:29](https://github.com/unadlib/mutative/blob/0ec70ad/src/create.ts#L29)

▸ **create**<`T`, `F`, `O`, `R`\>(`base`, `mutate`, `options?`): `CreateResult`<`T`, `O`, `F`, `R`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `object` |
| `F` | extends `boolean` = ``false`` |
| `O` | extends `boolean` = ``false`` |
| `R` | extends `void` \| `Promise`<`void`\> = `void` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `base` | `T` |
| `mutate` | (`draft`: `T`) => `R` |
| `options?` | `Options`<`O`, `F`\> |

#### Returns

`CreateResult`<`T`, `O`, `F`, `R`\>

#### Defined in

[create.ts:39](https://github.com/unadlib/mutative/blob/0ec70ad/src/create.ts#L39)

▸ **create**<`T`, `P`, `F`, `O`, `R`\>(`mutate`, `options?`): (`base`: `T`, ...`args`: `P`) => `CreateResult`<`T`, `O`, `F`, `R`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `object` |
| `P` | extends `any`[] = [] |
| `F` | extends `boolean` = ``false`` |
| `O` | extends `boolean` = ``false`` |
| `R` | extends `void` \| `Promise`<`void`\> = `void` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `mutate` | (`draft`: [`Draft`](README.md#draft)<`T`\>, ...`args`: `P`) => `R` |
| `options?` | `Options`<`O`, `F`\> |

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

[create.ts:49](https://github.com/unadlib/mutative/blob/0ec70ad/src/create.ts#L49)

▸ **create**<`T`, `O`, `F`\>(`base`, `options?`): [`T`, () => `Result`<`T`, `O`, `F`\>]

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `object` |
| `O` | extends `boolean` = ``false`` |
| `F` | extends `boolean` = ``false`` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `base` | `T` |
| `options?` | `Options`<`O`, `F`\> |

#### Returns

[`T`, () => `Result`<`T`, `O`, `F`\>]

#### Defined in

[create.ts:59](https://github.com/unadlib/mutative/blob/0ec70ad/src/create.ts#L59)

___

### current

▸ **current**<`T`\>(`target`): `T`

`current(draft)` to get current state

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

[current.ts:56](https://github.com/unadlib/mutative/blob/0ec70ad/src/current.ts#L56)

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

[utils/draft.ts:11](https://github.com/unadlib/mutative/blob/0ec70ad/src/utils/draft.ts#L11)

___

### original

▸ **original**<`T`\>(`target`): `T`

`original(draft)` to get original state

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

[original.ts:21](https://github.com/unadlib/mutative/blob/0ec70ad/src/original.ts#L21)

___

### unsafe

▸ **unsafe**<`T`\>(`callback`): `T`

`unsafe(callback)` to access mutable data directly

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

[unsafe.ts:26](https://github.com/unadlib/mutative/blob/0ec70ad/src/unsafe.ts#L26)
