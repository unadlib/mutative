import { expectTypeOf } from 'vitest';
import {
  apply,
  create,
  makeCreator,
  type Draft,
  type Immutable,
  type Patches,
} from '../src';

// `pnpm type-check` checks the type assertions; the tests check that the
// runtime results match them.
type State = { count: number; list: number[] };
const base = (): State => ({ count: 1, list: [1] });

test('an async recipe yields a Promise, also with an explicit state type', async () => {
  const result = create<State>(base(), async (draft) => {
    await Promise.resolve();
    draft.count += 1;
  });
  expectTypeOf(result).toEqualTypeOf<Promise<State>>();
  expect((await result).count).toBe(2);

  const [state, patches] = await create<State, false, true>(
    base(),
    async (draft) => {
      draft.count += 1;
    },
    { enablePatches: true }
  );
  expectTypeOf(state).toEqualTypeOf<State>();
  expectTypeOf(patches).toEqualTypeOf<Patches<true>>();
  expect(state.count).toBe(2);

  const produce = create<State>(async (draft) => {
    draft.count += 1;
  });
  expectTypeOf(produce).returns.toEqualTypeOf<Promise<State>>();
  expect((await produce(base())).count).toBe(2);

  const inferred = create(base(), async (draft) => {
    draft.count += 1;
  });
  expectTypeOf(inferred).toEqualTypeOf<Promise<State>>();
  expect((await inferred).count).toBe(2);
});

test('a sync recipe keeps its result type with an explicit state type', () => {
  const changed = create<State>(base(), (draft) => {
    draft.count += 1;
  });
  expectTypeOf(changed).toEqualTypeOf<State>();
  expect(changed.count).toBe(2);

  const replaced = create<State>(base(), () => ({ count: 5, list: [] }));
  expectTypeOf(replaced).toEqualTypeOf<State>();
  expect(replaced.count).toBe(5);
});

test('a recipe that may return a Promise gives either result with an explicit state type', async () => {
  const recipe = (draft: State): void | Promise<void> => {
    if (draft.count > 1) {
      return Promise.resolve().then(() => {
        draft.count += 1;
      });
    }
    draft.count += 1;
  };
  const now = create<State>(base(), recipe);
  expectTypeOf(now).toEqualTypeOf<State | Promise<State>>();
  expect(now).toEqual({ count: 2, list: [1] });
  const later = create<State>({ count: 2, list: [] }, recipe);
  expect(later).toBeInstanceOf(Promise);
  expect(await later).toEqual({ count: 3, list: [] });

  const produce = create<State>(recipe);
  expectTypeOf(produce).toEqualTypeOf<
    (base: State) => State | Promise<State>
  >();
  expect(await produce({ count: 2, list: [] })).toEqual({ count: 3, list: [] });

  const withPatches = create<State, false, true>(base(), recipe, {
    enablePatches: true,
  });
  expectTypeOf(withPatches).toEqualTypeOf<
    | [State, Patches<true>, Patches<true>]
    | Promise<[State, Patches<true>, Patches<true>]>
  >();
  const [state, patches] = await withPatches;
  expect(apply(base(), patches)).toEqual(state);

  const frozen = makeCreator({ enableAutoFreeze: true })<State>(base(), recipe);
  expectTypeOf(frozen).toEqualTypeOf<
    Immutable<State> | Promise<Immutable<State>>
  >();
  expect(Object.isFrozen(await frozen)).toBe(true);
});

test('synchronous recipes of a primitive state keep their result type', () => {
  const count = create<number>(0, (value) => value + 1);
  expectTypeOf(count).toEqualTypeOf<number>();
  expect(count).toBe(1);

  const [next, patches] = create<number, false, true>(0, (value) => value + 1, {
    enablePatches: true,
  });
  expectTypeOf(next).toEqualTypeOf<number>();
  expect(next).toBe(1);
  expect(patches).toEqual([{ op: 'replace', path: [], value: 1 }]);

  const unchanged = create<string>('a', () => {});
  expectTypeOf(unchanged).toEqualTypeOf<string>();
  expect(unchanged).toBe('a');

  const toggle = create<boolean>((value) => !value);
  expectTypeOf(toggle).toEqualTypeOf<(base: boolean) => boolean>();
  expect(toggle(true)).toBe(false);

  const add = create<number, [number]>((value, by) => value + by);
  expectTypeOf(add).toEqualTypeOf<(base: number, by: number) => number>();
  expect(add(1, 2)).toBe(3);

  const frozen = makeCreator({ enableAutoFreeze: true })<number>(
    0,
    (value) => value + 1
  );
  expectTypeOf(frozen).toEqualTypeOf<number>();
  expect(frozen).toBe(1);

  // A recipe that may return a Promise keeps the synchronous type here.
  const maybe = (value: number): number | Promise<number> =>
    value > 0 ? Promise.resolve(value) : value + 1;
  expectTypeOf(create<number>(0, maybe)).toEqualTypeOf<number>();
});

test('explicit state types contextualize literal replacement values', async () => {
  type Status = { status: 'idle' | 'done'; count: number };
  const source: Status = { status: 'idle', count: 0 };
  const direct = create<Status>(source, () => ({ status: 'done', count: 1 }));
  const spread = create<Status>(source, (draft) => ({
    ...draft,
    status: 'done',
  }));
  const produce = create<Status, [number]>((_draft, count) => ({
    status: 'done',
    count,
  }));
  const asynchronous = create<Status>(source, async () => ({
    status: 'done',
    count: 2,
  }));
  const asyncProduce = create<Status, [number]>(async (_draft, count) => ({
    status: 'done',
    count,
  }));
  expectTypeOf(direct).toEqualTypeOf<Status>();
  expectTypeOf(spread).toEqualTypeOf<Status>();
  expectTypeOf(produce).toEqualTypeOf<
    (state: Status, count: number) => Status
  >();
  expectTypeOf(asynchronous).toEqualTypeOf<Promise<Status>>();
  expectTypeOf(asyncProduce).toEqualTypeOf<
    (state: Status, count: number) => Promise<Status>
  >();
  expect(direct).toEqual({ status: 'done', count: 1 });
  expect(spread).toEqual({ status: 'done', count: 0 });
  expect(produce(source, 3)).toEqual({ status: 'done', count: 3 });
  expect(await asynchronous).toEqual({ status: 'done', count: 2 });
  expect(await asyncProduce(source, 3)).toEqual({ status: 'done', count: 3 });

  type Variant =
    | { kind: 'count'; count: number }
    | { kind: 'name'; name: string };
  const creator = makeCreator({ enableAutoFreeze: true, enablePatches: true });
  const initial: Variant = { kind: 'count', count: 0 };
  const result = creator<Variant>(initial, () => ({
    kind: 'name',
    name: 'next',
  }));
  const curried = creator<Variant, [string]>((_draft, name) => ({
    kind: 'name',
    name,
  }));
  type Output = [Immutable<Variant>, Patches<true>, Patches<true>];
  expectTypeOf(result).toEqualTypeOf<Output>();
  expectTypeOf(curried).toEqualTypeOf<
    (state: Variant, name: string) => Output
  >();
  for (const [state, patches, inverse] of [result, curried(initial, 'next')]) {
    expect(state).toEqual({ kind: 'name', name: 'next' });
    expect(Object.isFrozen(state)).toBe(true);
    expect(apply(initial, patches)).toEqual(state);
    expect(apply(state, inverse)).toEqual(initial);
  }
});

test('async recipes preserve primitive literal replacement types', async () => {
  type Status = 'idle' | 'done';
  const status = create<Status>('idle', async () => 'done');
  const number = create<0 | 1>(0, async () => 1);
  const boolean = create<true>(true, async () => true);
  const single = create<'idle'>('idle', async () => 'idle');
  const afterAwait = create<Status>('idle', async () => {
    await Promise.resolve();
    return 'done';
  });
  const statusProducer = create<Status>(async () => 'done');
  const numberProducer = create<0 | 1>(async () => 1);
  expectTypeOf(status).toEqualTypeOf<Promise<Status>>();
  expectTypeOf(number).toEqualTypeOf<Promise<0 | 1>>();
  expectTypeOf(boolean).toEqualTypeOf<Promise<true>>();
  expectTypeOf(single).toEqualTypeOf<Promise<'idle'>>();
  expectTypeOf(afterAwait).toEqualTypeOf<Promise<Status>>();
  expectTypeOf(statusProducer).toEqualTypeOf<
    (state: Status) => Promise<Status>
  >();
  expectTypeOf(numberProducer).toEqualTypeOf<
    (state: 0 | 1) => Promise<0 | 1>
  >();
  expect(await status).toBe('done');
  expect(await number).toBe(1);
  expect(await boolean).toBe(true);
  expect(await single).toBe('idle');
  expect(await afterAwait).toBe('done');
  expect(await statusProducer('idle')).toBe('done');
  expect(await numberProducer(0)).toBe(1);

  const sync = create<Status>('idle', () => 'done');
  const untyped = create<Status>('idle', (): any => 'done');
  expectTypeOf(sync).toEqualTypeOf<Status>();
  expectTypeOf(untyped).toEqualTypeOf<Status>();
  expect(sync).toBe('done');
  expect(untyped).toBe('done');
});

test('async primitive replacements preserve patches and curried arguments', async () => {
  type Status = 'idle' | 'done';
  type Output = [Status, Patches<true>, Patches<true>];
  const creator = makeCreator({ enablePatches: true, enableAutoFreeze: true });
  const result = creator<Status>('idle', async () => 'done');
  const produce = creator<Status, [boolean?]>(async (_draft, done = true) =>
    done ? 'done' : 'idle'
  );
  expectTypeOf(result).toEqualTypeOf<Promise<Output>>();
  expectTypeOf(produce).toEqualTypeOf<
    (state: Status, done?: boolean) => Promise<Output>
  >();
  for (const output of [result, produce('idle')]) {
    expect(output).toBeInstanceOf(Promise);
    expect(await output).toEqual([
      'done',
      [{ op: 'replace', path: [], value: 'done' }],
      [{ op: 'replace', path: [], value: 'idle' }],
    ]);
  }
  expect((await produce('done', false))[0]).toBe('idle');
});

test('explicit replacement literals retain context for nested functions and tuples', () => {
  type Model = {
    mode: 'a' | 'b';
    tuple: [number, string];
    nested: { fn: (value: number) => number };
  };
  const source: Model = {
    mode: 'a',
    tuple: [0, 'a'],
    nested: { fn: (value) => value },
  };
  const explicit = create<Model>(source, () => ({
    mode: 'b',
    tuple: [1, 'b'],
    nested: { fn: (value) => value + 1 },
  }));
  const produce = create<Model>(() => ({
    mode: 'b',
    tuple: [1, 'b'],
    nested: { fn: (value) => value + 1 },
  }));
  expectTypeOf(explicit).toEqualTypeOf<Model>();
  expectTypeOf(produce).returns.toEqualTypeOf<Model>();
  for (const result of [explicit, produce(source)]) {
    expect(result.tuple).toEqual([1, 'b']);
    expect(result.nested.fn(2)).toBe(3);
  }
});

test('broad states keep concrete primitive and collection replacements synchronous', () => {
  const creator = makeCreator({ enablePatches: true });
  const results = [
    creator<unknown>(base(), () => 2),
    creator<object>(base(), () => [2]),
    creator<object>(base(), () => new Map([['count', 2]])),
    creator<object>(base(), () => new Set([2])),
    creator<object>(base(), () => new Date(0)),
  ];
  for (const result of results) {
    expectTypeOf(result).toMatchTypeOf<
      [unknown, Patches<true>, Patches<true>]
    >();
    expect(result).not.toBeInstanceOf(Promise);
    expect(result[1]).toEqual([{ op: 'replace', path: [], value: result[0] }]);
    expect(result[2]).toEqual([{ op: 'replace', path: [], value: base() }]);
  }
});

test('a sync curried recipe can return a new state or its draft', () => {
  const replace = create<State, [number]>((_draft, count) => ({
    count,
    list: [],
  }));
  expectTypeOf(replace).toEqualTypeOf<(state: State, count: number) => State>();
  expect(replace(base(), 5)).toEqual({ count: 5, list: [] });

  const returnDraft = create<State>((draft) => {
    draft.count += 1;
    return draft;
  });
  expectTypeOf(returnDraft).returns.toEqualTypeOf<State>();
  expect(returnDraft(base()).count).toBe(2);
});

test('a curried recipe with an annotated draft can return a new state', async () => {
  const increment = create((draft: State) => ({
    ...draft,
    count: draft.count + 1,
  }));
  expectTypeOf(increment).toEqualTypeOf<(base: State) => State>();
  expect(increment(base())).toEqual({ count: 2, list: [1] });

  const add = create((draft: Draft<State>, by: number) => ({
    ...draft,
    count: draft.count + by,
  }));
  expectTypeOf(add).toEqualTypeOf<(base: State, by: number) => State>();
  expect(add(base(), 2).count).toBe(3);

  const reset = create(async (draft: State) => ({ ...draft, count: 0 }));
  expectTypeOf(reset).toEqualTypeOf<(base: State) => Promise<State>>();
  expect((await reset(base())).count).toBe(0);

  const mutate = create((draft: State) => {
    draft.count += 1;
  });
  expectTypeOf(mutate).toEqualTypeOf<(base: State) => State>();
  expect(mutate(base()).count).toBe(2);
});

test('generic helpers keep synchronous replacement results', () => {
  function update<T>(state: T, recipe: (draft: T) => T): T {
    return create<T>(state, recipe);
  }
  function maybeReplace<T>(state: T, recipe: (draft: T) => void | T): T {
    return create<T>(state, recipe);
  }
  const source = base();
  const replaced = update(source, (draft) => ({ ...draft, count: 2 }));
  const unchanged = maybeReplace(source, () => {});
  expectTypeOf(replaced).toEqualTypeOf<State>();
  expectTypeOf(unchanged).toEqualTypeOf<State>();
  expect(replaced.count).toBe(2);
  expect(unchanged).toBe(source);
  expect(source.count).toBe(1);

  const creator = makeCreator({ enableAutoFreeze: true, enablePatches: true });
  function withOptions<T>(
    state: T,
    recipe: (draft: T) => void | T
  ): [Immutable<T>, Patches<true>, Patches<true>] {
    return creator<T>(state, recipe);
  }
  const [frozen, patches, inverse] = withOptions(source, (draft) => ({
    ...draft,
    count: 2,
  }));
  expectTypeOf(frozen).toEqualTypeOf<Immutable<State>>();
  expect(Object.isFrozen(frozen.list)).toBe(true);
  expect(apply(source, patches)).toEqual(frozen);
  expect(apply(frozen, inverse)).toEqual(source);
});

test('the result type of apply() follows mutable and enableAutoFreeze', () => {
  const patches: Patches = [{ op: 'replace', path: ['count'], value: 2 }];
  expectTypeOf(apply(base(), patches)).toEqualTypeOf<State>();

  const target = base();
  const mutated = apply(target, patches, { mutable: true });
  expectTypeOf(mutated).toEqualTypeOf<void>();
  expect(target.count).toBe(2);

  const options = { mutable: true };
  const maybe = apply(base(), patches, options);
  expectTypeOf(maybe).toEqualTypeOf<State | void>();
  expect(maybe).toBeUndefined();

  const frozen = apply(base(), patches, { enableAutoFreeze: true });
  expectTypeOf(frozen).toEqualTypeOf<Immutable<State>>();
  expect(Object.isFrozen(frozen)).toBe(true);
  expect(frozen.count).toBe(2);

  const explicit = apply<State, true>(base(), patches, {
    enableAutoFreeze: true,
  });
  expectTypeOf(explicit).toEqualTypeOf<Immutable<State>>();
  expect(Object.isFrozen(explicit.list)).toBe(true);
});

test.each([false, true])(
  'apply() includes void for optional mutable flags (mutable: %s)',
  (mutable) => {
    const patches: Patches = [{ op: 'replace', path: ['count'], value: 2 }];
    const optionalTrue: { mutable?: true } = mutable ? { mutable: true } : {};
    const optionalBoolean: { mutable?: boolean } = { mutable };
    const maybeOptions: { mutable: true } | undefined = mutable
      ? { mutable: true }
      : undefined;

    const target = base();
    const result = apply(target, patches, optionalTrue);
    const booleanResult = apply(base(), patches, optionalBoolean);
    const optionalResult = apply(base(), patches, maybeOptions);
    expectTypeOf(result).toEqualTypeOf<State | void>();
    expectTypeOf(booleanResult).toEqualTypeOf<State | void>();
    expectTypeOf(optionalResult).toEqualTypeOf<State | void>();
    if (mutable) {
      expect(result).toBeUndefined();
      expect(booleanResult).toBeUndefined();
      expect(optionalResult).toBeUndefined();
      expect(target.count).toBe(2);
      // @ts-expect-error The result may be void when mutable is optional.
      expect(() => result.count).toThrow(TypeError);
    } else {
      expect(result).toEqual({ count: 2, list: [1] });
      expect(booleanResult).toEqual(result);
      expect(optionalResult).toEqual(result);
      expect(target.count).toBe(1);
    }

    const union: { enableAutoFreeze: true } | { mutable?: boolean } = mutable
      ? optionalBoolean
      : { enableAutoFreeze: true };
    const unionResult = apply(base(), patches, union);
    expectTypeOf(unionResult).toEqualTypeOf<State | Immutable<State> | void>();
    if (mutable) expect(unionResult).toBeUndefined();
    else expect(Object.isFrozen(unionResult)).toBe(true);
  }
);

test('apply() keeps precise results for omitted and explicit options', () => {
  const source = base();
  expectTypeOf(apply(source, [])).toEqualTypeOf<State>();
  expectTypeOf(apply(source, [], undefined)).toEqualTypeOf<State>();
  expectTypeOf(apply<State>(source, [])).toEqualTypeOf<State>();
  expectTypeOf(apply<State>(source, [], {})).toEqualTypeOf<State>();
  expectTypeOf(
    apply<State>(source, [], { strict: true })
  ).toEqualTypeOf<State>();
  expectTypeOf(
    apply<State>(source, [], { mutable: false })
  ).toEqualTypeOf<State>();
  expectTypeOf(
    apply<State>(source, [], { mutable: true })
  ).toEqualTypeOf<void>();
  expectTypeOf(
    apply<State, true>(source, [], { enableAutoFreeze: true })
  ).toEqualTypeOf<Immutable<State>>();

  const optionalFalse: { mutable?: false } = {};
  expectTypeOf(apply(source, [], optionalFalse)).toEqualTypeOf<State>();
  const optionalBoolean: { mutable?: boolean } = { mutable: true };
  expectTypeOf(
    apply<State>(source, [], optionalBoolean)
  ).toEqualTypeOf<State | void>();
});

test('apply() accepts omitted options with all three type arguments', () => {
  const source = base();
  const patches: Patches = [{ op: 'replace', path: ['count'], value: 2 }];
  const omitted = apply<State, false, { mutable?: false }>(source, patches);
  const explicitUndefined = apply<State, false, { mutable: true }>(
    source,
    patches,
    undefined
  );
  expectTypeOf(omitted).toEqualTypeOf<State>();
  expectTypeOf(explicitUndefined).toEqualTypeOf<State>();
  expect(omitted).toEqual({ count: 2, list: [1] });
  expect(explicitUndefined).toEqual(omitted);
  expect(source.count).toBe(1);

  const mutable = apply<State, false, { mutable: true }>(source, patches, {
    mutable: true,
  });
  expectTypeOf(mutable).toEqualTypeOf<void>();
  expect(mutable).toBeUndefined();
  expect(source.count).toBe(2);
});

test.each([false, true])(
  'apply() supports optional options in generic wrappers (provided: %s)',
  (provided) => {
    function update<
      T extends object,
      A extends { mutable?: boolean } | { enableAutoFreeze?: boolean },
    >(state: T, patches: Patches, options?: A) {
      return apply<T, false, A>(state, patches, options);
    }

    const patches: Patches = [{ op: 'replace', path: ['count'], value: 2 }];
    const source = base();
    const mutableOptions = provided ? { mutable: true as const } : undefined;
    const maybeMutable = update(source, patches, mutableOptions);
    const explicitMutable = apply<State, false, { mutable: true }>(
      base(),
      patches,
      mutableOptions
    );
    expectTypeOf(maybeMutable).toEqualTypeOf<State | void>();
    expectTypeOf(explicitMutable).toEqualTypeOf<State | void>();
    if (provided) {
      expect(maybeMutable).toBeUndefined();
      expect(explicitMutable).toBeUndefined();
      expect(source.count).toBe(2);
    } else {
      expect(maybeMutable).toEqual({ count: 2, list: [1] });
      expect(explicitMutable).toEqual(maybeMutable);
      expect(source.count).toBe(1);
    }

    const frozenOptions = provided
      ? { enableAutoFreeze: true as const }
      : undefined;
    const maybeFrozen = update(base(), patches, frozenOptions);
    const explicitFrozen = apply<State, false, { enableAutoFreeze: true }>(
      base(),
      patches,
      frozenOptions
    );
    expectTypeOf(maybeFrozen).toEqualTypeOf<State | Immutable<State>>();
    expectTypeOf(explicitFrozen).toEqualTypeOf<State | Immutable<State>>();
    expect(maybeFrozen.count).toBe(2);
    expect(Object.isFrozen(maybeFrozen.list)).toBe(provided);
    expect(Object.isFrozen(explicitFrozen.list)).toBe(provided);
  }
);

test.each([false, true])(
  'apply() accounts for boolean and optional freeze options (freeze: %s)',
  (freeze) => {
    const patches: Patches = [{ op: 'replace', path: ['count'], value: 2 }];
    const options = { enableAutoFreeze: freeze };
    const state = apply(base(), patches, options);
    expectTypeOf(state).toEqualTypeOf<State | Immutable<State>>();
    expect(state.count).toBe(2);
    expect(Object.isFrozen(state.list)).toBe(freeze);
    if (freeze) {
      expect(() => {
        // @ts-expect-error The result may be frozen.
        state.list.push(2);
      }).toThrow(TypeError);
    }

    const optional: { enableAutoFreeze?: boolean } = freeze ? options : {};
    const maybeFrozen = apply(base(), patches, optional);
    expectTypeOf(maybeFrozen).toEqualTypeOf<State | Immutable<State>>();
    expect(Object.isFrozen(maybeFrozen)).toBe(freeze);

    const optionalTrue: { enableAutoFreeze?: true } = freeze
      ? { enableAutoFreeze: true }
      : {};
    const optionalState = apply(base(), patches, optionalTrue);
    expectTypeOf(optionalState).toEqualTypeOf<State | Immutable<State>>();
    expect(Object.isFrozen(optionalState)).toBe(freeze);

    const unionOptions: { enableAutoFreeze: boolean } | { mutable: true } =
      freeze ? options : { mutable: true };
    const target = base();
    const unionState = apply(target, patches, unionOptions);
    expectTypeOf(unionState).toEqualTypeOf<State | Immutable<State> | void>();
    if (freeze) {
      expect(Object.isFrozen(unionState)).toBe(true);
      expect(target.count).toBe(1);
    } else {
      expect(unionState).toBeUndefined();
      expect(target.count).toBe(2);
    }
  }
);

test('apply() keeps mutable result types when freezing cannot be enabled', () => {
  expectTypeOf(apply(base(), [], {})).toEqualTypeOf<State>();
  expectTypeOf(apply(base(), [], { strict: true })).toEqualTypeOf<State>();

  const options = { enableAutoFreeze: false } as const;
  const state = apply(base(), [], options);
  expectTypeOf(state).toEqualTypeOf<State>();
  state.list.push(2);
  expect(state.list).toEqual([1, 2]);

  const optional: { enableAutoFreeze?: false } = {};
  expectTypeOf(apply(base(), [], optional)).toEqualTypeOf<State>();
});
