[**mutative**](../README.md)

***

[mutative](../README.md) / apply

# Function: apply()

## Call Signature

> **apply**\<`T`, `F`, `_A`\>(`state`, `patches`, `applyOptions?`): `ApplyState`\<`T`, `F`, `undefined`\>

Defined in: [apply.ts:63](https://github.com/unadlib/mutative/blob/c2e96282fb77355d4c5f83d86c6d201dee734d45/src/apply.ts#L63)

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

### Type Parameters

#### T

`T` *extends* `object`

#### F

`F` *extends* `boolean` = `false`

#### _A

`_A` *extends* `undefined` \| `ApplyOptions`\<`boolean`\> = `ApplyImmutableOptions`\<`F`\>

### Parameters

#### state

`T`

#### patches

[`Patches`](../type-aliases/Patches.md)

#### applyOptions?

`undefined`

### Returns

`ApplyState`\<`T`, `F`, `undefined`\>

## Call Signature

> **apply**\<`T`, `F`, `A`\>(`state`, `patches`, `applyOptions`): `ApplyResult`\<`T`, `F`, `A`\>

Defined in: [apply.ts:72](https://github.com/unadlib/mutative/blob/c2e96282fb77355d4c5f83d86c6d201dee734d45/src/apply.ts#L72)

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

### Type Parameters

#### T

`T` *extends* `object`

#### F

`F` *extends* `boolean` = `false`

#### A

`A` *extends* `undefined` \| `ApplyOptions`\<`boolean`\> = `ApplyImmutableOptions`\<`F`\>

### Parameters

#### state

`T`

#### patches

[`Patches`](../type-aliases/Patches.md)

#### applyOptions

`A`

### Returns

`ApplyResult`\<`T`, `F`, `A`\>

## Call Signature

> **apply**\<`T`, `F`, `A`\>(`state`, `patches`, `applyOptions?`): `ApplyResult`\<`T`, `F`, `undefined` \| `A`\>

Defined in: [apply.ts:79](https://github.com/unadlib/mutative/blob/c2e96282fb77355d4c5f83d86c6d201dee734d45/src/apply.ts#L79)

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

### Type Parameters

#### T

`T` *extends* `object`

#### F

`F` *extends* `boolean` = `false`

#### A

`A` *extends* `undefined` \| `ApplyOptions`\<`boolean`\> = `ApplyImmutableOptions`\<`F`\>

### Parameters

#### state

`T`

#### patches

[`Patches`](../type-aliases/Patches.md)

#### applyOptions?

`A`

### Returns

`ApplyResult`\<`T`, `F`, `undefined` \| `A`\>

## Call Signature

> **apply**\<`T`, `F`\>(`state`, `patches`, `applyOptions`): `void`

Defined in: [apply.ts:90](https://github.com/unadlib/mutative/blob/c2e96282fb77355d4c5f83d86c6d201dee734d45/src/apply.ts#L90)

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

### Type Parameters

#### T

`T` *extends* `object`

#### F

`F` *extends* `boolean` = `false`

### Parameters

#### state

`T`

#### patches

[`Patches`](../type-aliases/Patches.md)

#### applyOptions

##### mutable

`true`

### Returns

`void`

## Call Signature

> **apply**\<`T`, `F`\>(`state`, `patches`, `applyOptions`): `ApplyResult`\<`T`, `F`, `undefined` \| `ApplyMutableOptions`\>

Defined in: [apply.ts:95](https://github.com/unadlib/mutative/blob/c2e96282fb77355d4c5f83d86c6d201dee734d45/src/apply.ts#L95)

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

### Type Parameters

#### T

`T` *extends* `object`

#### F

`F` *extends* `boolean` = `false`

### Parameters

#### state

`T`

#### patches

[`Patches`](../type-aliases/Patches.md)

#### applyOptions

`undefined` | `ApplyMutableOptions`

### Returns

`ApplyResult`\<`T`, `F`, `undefined` \| `ApplyMutableOptions`\>
