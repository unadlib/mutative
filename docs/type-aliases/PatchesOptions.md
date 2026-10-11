[**mutative**](../README.md)

***

[mutative](../README.md) / PatchesOptions

# Type Alias: PatchesOptions

> **PatchesOptions** = `boolean` \| \{ `arrayLengthAssignment?`: `boolean`; `pathAsArray?`: `boolean`; \}

Defined in: [interface.ts:18](https://github.com/unadlib/mutative/blob/8667c30c96a236a80844257728eb46826ca6f5d8/src/interface.ts#L18)

## Type Declaration

`boolean`

\{ `arrayLengthAssignment?`: `boolean`; `pathAsArray?`: `boolean`; \}

### arrayLengthAssignment?

> `optional` **arrayLengthAssignment**: `boolean`

The default value is `true`. If it's `true`, the array length will be included in the patches, otherwise no include array length.

### pathAsArray?

> `optional` **pathAsArray**: `boolean`

The default value is `true`. If it's `true`, the path will be an array, otherwise it is a string.
