[**mutative**](../README.md) • **Docs**

***

[mutative](../README.md) / create

# Function: create()

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

## create(base, mutate, options)

> **create**\<`T`, `F`, `O`, `R`\>(`base`, `mutate`, `options`?): `CreateResult`\<`T`, `O`, `F`, `R`\>

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

### Type Parameters

• **T** *extends* `unknown`

• **F** *extends* `boolean` = `false`

• **O** *extends* [`PatchesOptions`](../type-aliases/PatchesOptions.md) = `false`

• **R** *extends* `unknown` = `void`

### Parameters

• **base**: `T`

• **mutate**

• **options?**: [`Options`](../interfaces/Options.md)\<`O`, `F`\>

### Returns

`CreateResult`\<`T`, `O`, `F`, `R`\>

### Defined in

[create.ts:25](https://github.com/unadlib/mutative/blob/7129237bc42b8475743ffff427a1f8f85e8e1e51/src/create.ts#L25)

## create(base, mutate, options)

> **create**\<`T`, `F`, `O`, `R`\>(`base`, `mutate`, `options`?): `CreateResult`\<`T`, `O`, `F`, `R`\>

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

### Type Parameters

• **T** *extends* `unknown`

• **F** *extends* `boolean` = `false`

• **O** *extends* [`PatchesOptions`](../type-aliases/PatchesOptions.md) = `false`

• **R** *extends* `void` \| `Promise`\<`void`\> = `void`

### Parameters

• **base**: `T`

• **mutate**

• **options?**: [`Options`](../interfaces/Options.md)\<`O`, `F`\>

### Returns

`CreateResult`\<`T`, `O`, `F`, `R`\>

### Defined in

[create.ts:25](https://github.com/unadlib/mutative/blob/7129237bc42b8475743ffff427a1f8f85e8e1e51/src/create.ts#L25)

## create(mutate, options)

> **create**\<`T`, `P`, `F`, `O`, `R`\>(`mutate`, `options`?): (`base`, ...`args`) => `CreateResult`\<`T`, `O`, `F`, `R`\>

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

### Type Parameters

• **T** *extends* `unknown`

• **P** *extends* `any`[] = []

• **F** *extends* `boolean` = `false`

• **O** *extends* [`PatchesOptions`](../type-aliases/PatchesOptions.md) = `false`

• **R** *extends* `void` \| `Promise`\<`void`\> = `void`

### Parameters

• **mutate**

• **options?**: [`Options`](../interfaces/Options.md)\<`O`, `F`\>

### Returns

`Function`

#### Parameters

• **base**: `T`

• ...**args**: `P`

#### Returns

`CreateResult`\<`T`, `O`, `F`, `R`\>

### Defined in

[create.ts:25](https://github.com/unadlib/mutative/blob/7129237bc42b8475743ffff427a1f8f85e8e1e51/src/create.ts#L25)

## create(base, options)

> **create**\<`T`, `O`, `F`\>(`base`, `options`?): [[`Draft`](../type-aliases/Draft.md)\<`T`\>, () => `Result`\<`T`, `O`, `F`\>]

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

### Type Parameters

• **T** *extends* `unknown`

• **O** *extends* [`PatchesOptions`](../type-aliases/PatchesOptions.md) = `false`

• **F** *extends* `boolean` = `false`

### Parameters

• **base**: `T`

• **options?**: [`Options`](../interfaces/Options.md)\<`O`, `F`\>

### Returns

[[`Draft`](../type-aliases/Draft.md)\<`T`\>, () => `Result`\<`T`, `O`, `F`\>]

### Defined in

[create.ts:25](https://github.com/unadlib/mutative/blob/7129237bc42b8475743ffff427a1f8f85e8e1e51/src/create.ts#L25)
