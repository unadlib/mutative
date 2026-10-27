[**mutative**](../README.md)

***

[mutative](../README.md) / PatchesOptions

# Type Alias: PatchesOptions

> **PatchesOptions** = `boolean` \| \{ `arrayLengthAssignment?`: `boolean`; `pathAsArray?`: `boolean`; \}

The `enablePatches` option: `true` or an object generates patches, `false`
does not.

## Type Declaration

`boolean`

\{ `arrayLengthAssignment?`: `boolean`; `pathAsArray?`: `boolean`; \}

### arrayLengthAssignment?

> `optional` **arrayLengthAssignment**: `boolean`

Whether an array that gets shorter gets a `replace` patch of its
`length`, as by default, or a `remove` patch for each index that it
loses, as JSON Patch requires.
Recreating holes in a sparse array still uses length patches;
JSON cannot represent holes.

### pathAsArray?

> `optional` **pathAsArray**: `boolean`

Whether a patch path is an array of keys, as by default, or a JSON
Pointer string, such as `/list/0`.
