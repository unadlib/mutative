[**mutative**](../README.md)

***

[mutative](../README.md) / apply

# Function: apply()

## Call Signature

> **apply**\<`T`, `F`, `_A`\>(`state`, `patches`, `applyOptions?`): `ApplyState`\<`T`, `F`, `undefined`\>

Defined in: [apply.ts:62](https://github.com/unadlib/mutative/blob/080a20500efdd03828f63d0f023fc6d7458b3e98/src/apply.ts#L62)

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

Defined in: [apply.ts:71](https://github.com/unadlib/mutative/blob/080a20500efdd03828f63d0f023fc6d7458b3e98/src/apply.ts#L71)

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

Defined in: [apply.ts:78](https://github.com/unadlib/mutative/blob/080a20500efdd03828f63d0f023fc6d7458b3e98/src/apply.ts#L78)

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

Defined in: [apply.ts:89](https://github.com/unadlib/mutative/blob/080a20500efdd03828f63d0f023fc6d7458b3e98/src/apply.ts#L89)

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

Defined in: [apply.ts:94](https://github.com/unadlib/mutative/blob/080a20500efdd03828f63d0f023fc6d7458b3e98/src/apply.ts#L94)

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
