[**mutative**](../README.md)

***

[mutative](../README.md) / PatchesOptions

# Type Alias: PatchesOptions

> **PatchesOptions** = `boolean` \| \{ `arrayLengthAssignment?`: `boolean`; `arrayPatchStrategy?`: [`ArrayPatchStrategy`](../interfaces/ArrayPatchStrategy.md); `pathAsArray?`: `boolean`; \}

The `enablePatches` option: `true` or an object generates patches, `false`
does not.

## Type Declaration

`boolean`

\{ `arrayLengthAssignment?`: `boolean`; `arrayPatchStrategy?`: [`ArrayPatchStrategy`](../interfaces/ArrayPatchStrategy.md); `pathAsArray?`: `boolean`; \}

### arrayLengthAssignment?

> `optional` **arrayLengthAssignment**: `boolean`

Whether an array that gets shorter gets a `replace` patch of its
`length`, as by default, or a `remove` patch for each index that it
loses, as JSON Patch requires. With `compactArrayPatches`, this applies
where an array loses elements at its end or the strategy leaves it to
the default; the `remove` patches of a deletion before the end do not
depend on it. Recreating holes in a sparse array still uses length
patches; JSON cannot represent holes.

### arrayPatchStrategy?

> `optional` **arrayPatchStrategy**: [`ArrayPatchStrategy`](../interfaces/ArrayPatchStrategy.md)

How to represent array changes. By default, patches compare the values
at each index, so an element that a change moved takes a patch.
`compactArrayPatches` keeps elements that stay in order out of the
patches, where that makes them smaller.

Both generate value-based patches. Compact patches only make them
smaller: they do not record the recipe's operations, preserve JavaScript
object aliases or give elements identities.

### pathAsArray?

> `optional` **pathAsArray**: `boolean`

Whether a patch path is an array of keys, as by default, or a JSON
Pointer string, such as `/list/0`.
