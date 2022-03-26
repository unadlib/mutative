[mutative](README.md) / Exports

# mutative

## Table of contents

### Functions

- [create](modules.md#create)

## Functions

### create

▸ **create**<`T`, `O`\>(`initialState`, `mutate`, `options?`): `Result`<`T`, `O`\>

something

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `object` |
| `O` | extends `boolean` = ``false`` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `initialState` | `T` |
| `mutate` | (`draftState`: `T`) => `void` |
| `options?` | `Object` |
| `options.enablePatches?` | `O` |

#### Returns

`Result`<`T`, `O`\>

#### Defined in

index.ts:387
