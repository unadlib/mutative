[**mutative**](../README.md)

***

[mutative](../README.md) / PatchesOptions

# Type Alias: PatchesOptions

> **PatchesOptions** = `boolean` \| \{ `arrayLengthAssignment?`: `boolean`; `pathAsArray?`: `boolean`; \}

Defined in: [interface.ts:18](https://github.com/unadlib/mutative/blob/c2e96282fb77355d4c5f83d86c6d201dee734d45/src/interface.ts#L18)

## Type Declaration

`boolean`

\{ `arrayLengthAssignment?`: `boolean`; `pathAsArray?`: `boolean`; \}

### arrayLengthAssignment?

> `optional` **arrayLengthAssignment**: `boolean`

The default value is `true`. If it's `true`, the array length will be included in the patches, otherwise no include array length.

### pathAsArray?

> `optional` **pathAsArray**: `boolean`

The default value is `true`. If it's `true`, the path will be an array, otherwise it is a string.
