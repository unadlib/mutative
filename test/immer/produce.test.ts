import { assert } from './assert';
import {
  create,
  Draft,
  Immutable,
  apply,
  castDraft,
  castImmutable,
  safeReturn,
} from '../../src';

interface State {
  readonly num: number;
  readonly foo?: string;
  bar: string;
  readonly baz: {
    readonly x: number;
    readonly y: number;
  };
  readonly arr: ReadonlyArray<{ readonly value: string }>;
  readonly arr2: { readonly value: string }[];
}

const _: any = {};

const state: State = {
  num: 0,
  bar: 'foo',
  baz: {
    x: 1,
    y: 2,
  },
  arr: [{ value: 'asdf' }],
  arr2: [{ value: 'asdf' }],
};

const expectedState: State = {
  num: 1,
  foo: 'bar',
  bar: 'foo',
  baz: {
    x: 2,
    y: 3,
  },
  arr: [{ value: 'foo' }, { value: 'asf' }],
  arr2: [{ value: 'foo' }, { value: 'asf' }],
};

it('can update readonly state via standard api', () => {
  const newState = create(state, (draft) => {
    draft.num++;
    draft.foo = 'bar';
    draft.bar = 'foo';
    draft.baz.x++;
    draft.baz.y++;
    draft.arr[0].value = 'foo';
    draft.arr.push({ value: 'asf' });
    draft.arr2[0].value = 'foo';
    draft.arr2.push({ value: 'asf' });
  });
  assert(newState, _ as State);
});

// NOTE: only when the function type is inferred
it('can infer state type from default state', () => {
  type State = { readonly a: number };
  type Recipe = (state: State) => State;

  let foo = create((_: State) => {});
  assert(foo, _ as Recipe);
});

it('can infer state type from recipe function', () => {
  type A = { readonly a: string };
  type B = { readonly b: string };
  type State = A | B;
  type Recipe = (state: State) => State;

  let foo = create((draft: State) => {
    assert(draft, _ as State);
  });
  const x = foo({ a: '' });
  const y = foo({ b: '' });
  assert(foo, _ as Recipe);
});

it('can infer state type from recipe function with arguments', () => {
  type State = { readonly a: string } | { readonly b: string };
  type Recipe = (state: State, x: number) => State;

  let foo = create<State, [number]>((draft, x) => {
    assert(draft, _ as Draft<State>);
    assert(x, _ as number);
  });
  assert(foo, _ as Recipe);
});

it('can infer state type from recipe function with arguments and initial state', () => {
  type State = { readonly a: string } | { readonly b: string };
  type Recipe = (state: State, x: number) => State;

  let foo = create<State, [number]>((draft, x) => {});
  assert(foo, _ as Recipe);
});

it('cannot infer state type when the function type and default state are missing', () => {
  type Recipe = <S extends any>(state: S) => S;
  const foo = create((_: any) => {});
  // @ts-expect-error
  assert(foo, _ as Recipe);
});

it('can update readonly state via curried api', () => {
  const newState = create(state, (draft: Draft<State>) => {
    draft.num++;
    draft.foo = 'bar';
    draft.bar = 'foo';
    draft.baz.x++;
    draft.baz.y++;
    draft.arr[0].value = 'foo';
    draft.arr.push({ value: 'asf' });
    draft.arr2[0].value = 'foo';
    draft.arr2.push({ value: 'asf' });
  });
  expect(newState).not.toBe(state);
  expect(newState).toEqual(expectedState);
});

it('can update use the non-default export', () => {
  const newState = create(state, (draft: Draft<State>) => {
    draft.num++;
    draft.foo = 'bar';
    draft.bar = 'foo';
    draft.baz.x++;
    draft.baz.y++;
    draft.arr[0].value = 'foo';
    draft.arr.push({ value: 'asf' });
    draft.arr2[0].value = 'foo';
    draft.arr2.push({ value: 'asf' });
  });
  expect(newState).not.toBe(state);
  expect(newState).toEqual(expectedState);
});

it('can apply patches', () => {
  const [, patches] = create(
    { x: 3 },
    (d) => {
      d.x++;
    },
    {
      enablePatches: true,
    }
  );

  expect(apply({}, patches)).toEqual({ x: 4 });
});

describe('curried producer', () => {
  it('supports rest parameters', () => {
    type State = { readonly a: 1 };

    // No initial state:
    {
      type Recipe = (state: State, a: number, b: number) => State;
      let foo = create((s: State, a: number, b: number) => {});
      assert(foo, _ as Recipe);
      foo(_ as State, 1, 2);
    }

    // Using argument parameters:
    {
      type Recipe = (state: State, ...rest: number[]) => State;
      let woo = create((state: Draft<State>, ...args: number[]) => {});
      assert(woo, _ as Recipe);
      woo(_ as State, 1, 2);
    }

    // With initial state:
    // {
    //   type Recipe = (state?: State | undefined, ...rest: number[]) => State;
    //   let bar = create((state: Draft<State>, ...args: number[]) => {},
    //   _ as State);
    //   assert(bar, _ as Recipe);
    //   bar(_ as State, 1, 2);
    //   bar(_ as State);
    //   bar();
    // }

    // When args is a tuple:
    {
      type Recipe = (state: State, first: string, ...rest: number[]) => State;
      let tup = create(
        (state: Draft<State>, ...args: [string, ...number[]]) => {}
        // _ as State
      );
      assert(tup, _ as Recipe);
      tup({ a: 1 }, '', 2);
    }
  });

  it('can be passed a array', () => {
    // No initial state:
    {
      let foo = create((state: string[]) => {});
      assert(foo, _ as (state: string[]) => string[]);
      foo([] as Array<string>);
    }

    {
      let foo = create((state: string[]) => {}, { enableAutoFreeze: true });
      assert(foo, _ as (state: string[]) => readonly string[]);
      foo([] as Array<string>);
    }

    // With initial state:
    // {
    //   let bar = create(() => {}, [] as ReadonlyArray<string>);
    //   assert(
    //     bar,
    //     _ as (state?: readonly string[] | undefined) => readonly string[]
    //   );
    //   bar([] as ReadonlyArray<string>);
    //   bar(undefined);
    //   bar();
    // }
  });
});

it('works with return type of: number', () => {
  let base = { a: 0 } as { a: number };
  {
    if (Math.random() === 100) {
      // @ts-expect-error, this return accidentally a number, this is probably a dev error!
      let result = create(base, (draft) => draft.a++);
    }
  }
  {
    let result = create(base, (draft) => void draft.a++);
    assert(result, _ as { a: number });
  }
});

// it('can return an object type that is identical to the base type', () => {
//   let base = { a: 0 } as { a: number };
//   let result = create(base, (draft) => {
//     return draft.a < 0 ? { a: 0 } : undefined;
//   });
//   assert(result, _ as { a: number });
// });

it('can NOT return an object type that is _not_ assignable to the base type', () => {
  let base = { a: 0 } as { a: number };
  // @ts-expect-error
  let result = create(base, (draft) => {
    return draft.a < 0 ? { a: true } : undefined;
  });
});

it('does not enforce immutability at the type level', () => {
  let result = create([] as any[], (draft) => {
    draft.push(1);
  });
  assert(result, _ as any[]);
});

it('can produce an undefined value', () => {
  type State = { readonly a: number } | undefined;
  const base = { a: 0 } as State;

  // Return only nothing.
  let result = create(base, (_) => safeReturn(undefined));
  assert(result, _ as State);

  // Return maybe nothing.
  let result2 = create(base, (draft) => {
    if (draft?.a ?? 0 > 0) return safeReturn(undefined);
  });
  assert(result2, _ as State);
});

it('can return the draft itself', () => {
  let base = _ as { readonly a: number };
  let result = create(base, (draft) => {
    //
  });

  assert(result, _ as { readonly a: number });
});

it('can return a promise', () => {
  type Base = { readonly a: number };
  let base = { a: 0 } as Base;

  // Return a promise only.
  let res1 = create(base, (draft) => {
    return Promise.resolve();
  });
  assert(res1, _ as Promise<Base>);

  // Return a promise or undefined.
  let res2 = create(base, (draft) => {
    return Promise.resolve();
  });
  assert(res2, _ as Promise<Base>);
});

it('works with `void` hack', () => {
  let base = { a: 0 } as { readonly a: number };
  let copy = create(base, (s) => void s.a++);
  assert(copy, base);
});

it('works with generic parameters', () => {
  let insert = <T>(array: readonly T[], index: number, elem: T) => {
    // Need explicit cast on draft as T[] is wider than readonly T[]
    return create(
      array,
      (draft) => {
        draft.push(castDraft(elem));
        draft.splice(index, 0, castDraft(elem));
        draft.concat([castDraft(elem)]);
      },
      {
        enableAutoFreeze: true,
      }
    );
  };
  let val: { readonly a: ReadonlyArray<number> } = { a: [] } as any;
  let arr: ReadonlyArray<typeof val> = [] as any;
  insert(arr, 0, val);
});

it('can work with non-readonly base types', () => {
  const state = {
    price: 10,
    todos: [
      {
        title: 'test',
        done: false,
      },
    ],
  };
  type State = typeof state;

  const newState = create(state, (draft) => {
    draft.price += 5;
    draft.todos.push({
      title: 'hi',
      done: true,
    });
  });
  assert(newState, _ as State);

  const reducer = (draft: State) => {
    draft.price += 5;
    draft.todos.push({
      title: 'hi',
      done: true,
    });
  };

  // base case for with-initial-state
  const newState4 = create(reducer)(state);
  assert(newState4, _ as State);
  // // no argument case, in that case, immutable version recipe first arg will be inferred
  // const newState5 = create(reducer)(state);
  // assert(newState5, _ as State);
  // // we can force the return type of the reducer by casting the initial state
  // const newState3 = create(reducer, state as State)();
  // assert(newState3, _ as State);
});

it('can work with readonly base types', () => {
  type State = {
    readonly price: number;
    readonly todos: readonly {
      readonly title: string;
      readonly done: boolean;
    }[];
  };

  const state: State = {
    price: 10,
    todos: [
      {
        title: 'test',
        done: false,
      },
    ],
  };

  const newState = create(state, (draft) => {
    draft.price + 5;
    draft.todos.push({
      title: 'hi',
      done: true,
    });
  });
  assert(newState, _ as State);
  assert(newState, _ as Immutable<State>); // cause that is the same!

  const reducer = (draft: Draft<State>) => {
    draft.price += 5;
    draft.todos.push({
      title: 'hi',
      done: true,
    });
  };
  const newState2: State = create(reducer)(castDraft(state));
  assert(newState2, _ as State);

  // // base case for with-initial-state
  // const newState4 = create(reducer, state)(state);
  // assert(newState4, _ as State);
  // // no argument case, in that case, immutable version recipe first arg will be inferred
  // const newState5 = create(reducer, state)();
  // assert(newState5, _ as State);
  // // we can force the return type of the reducer by casting initial argument
  // const newState3 = create(reducer, state as State)();
  // assert(newState3, _ as State);
});

it('works with generic array', () => {
  const append = <T>(queue: T[], item: T) =>
    // T[] is needed here v. Too bad.
    create(queue, (queueDraft: T[]) => {
      queueDraft.push(item);
    });

  const queueBefore = [1, 2, 3];

  const queueAfter = append(queueBefore, 4);

  expect(queueAfter).toEqual([1, 2, 3, 4]);
  expect(queueBefore).toEqual([1, 2, 3]);
});

it('works with Map and Set', () => {
  const m = new Map([['a', { x: 1 }]]);
  const s = new Set([{ x: 2 }]);

  const res1 = create(m, (draft) => {
    assert(draft, _ as Map<string, { x: number }>);
  });
  assert(res1, _ as Map<string, { x: number }>);

  const res2 = create(s, (draft) => {
    assert(draft, _ as Set<{ x: number }>);
  });
  assert(res2, _ as Set<{ x: number }>);
});

it('works with readonly Map and Set', () => {
  type S = { readonly x: number };
  const m: ReadonlyMap<string, S> = new Map([['a', { x: 1 }]]);
  const s: ReadonlySet<S> = new Set([{ x: 2 }]);

  const res1 = create(m, (draft: Draft<Map<string, S>>) => {
    assert(draft, _ as Map<string, { x: number }>);
  });
  assert(res1, _ as ReadonlyMap<string, { readonly x: number }>);

  const res2 = create(s, (draft: Draft<Set<S>>) => {
    assert(draft, _ as Set<{ x: number }>);
  });
  assert(res2, _ as ReadonlySet<{ readonly x: number }>);
});

it('works with ReadonlyMap and ReadonlySet', () => {
  type S = { readonly x: number };
  const m: ReadonlyMap<string, S> = new Map([['a', { x: 1 }]]);
  const s: ReadonlySet<S> = new Set([{ x: 2 }]);

  const res1 = create(m, (draft: Draft<Map<string, S>>) => {
    assert(draft, _ as Map<string, { x: number }>);
  });
  assert(res1, _ as ReadonlyMap<string, { readonly x: number }>);

  const res2 = create(s, (draft: Draft<Set<S>>) => {
    assert(draft, _ as Set<{ x: number }>);
  });
  assert(res2, _ as ReadonlySet<{ readonly x: number }>);
});

it('shows error in production if called incorrectly', () => {
  expect(() => {
    create(null);
  }).toThrowErrorMatchingInlineSnapshot(
    `"Invalid base state: create() only supports plain objects, arrays, Set, Map or using mark() to mark the state as immutable."`
  );
});

it('#749 types Immer', () => {
  const t = {
    x: 3,
  };

  const z = create(t, (d) => {
    d.x++;
    // @ts-expect-error
    d.y = 0;
  });
  expect(z.x).toBe(4);
  // @ts-expect-error
  expect(z.z).toBeUndefined();
});

it('infers draft, #720', () => {
  function nextNumberCalculator(
    fn: (base: Draft<{ s: number }>) => { s: number }
  ) {
    // noop
  }

  const res2 = nextNumberCalculator(
    create((draft) => {
      draft.s++;
    })
  );

  const res = nextNumberCalculator(
    create((draft) => {
      draft.s++;
    })
  );
});

it('infers draft, #720', () => {
  function nextNumberCalculator(fn: (base: { s: number }) => { s: number }) {
    // noop
  }

  const res2 = nextNumberCalculator(
    create((draft) => {
      draft.s++;
    })
  );

  const res = nextNumberCalculator(
    create((draft) => {
      draft.s++;
    })
  );
});

it('infers draft, #720 - 2', () => {
  function useState<S>(
    initialState: S | (() => S)
  ): [S, Dispatch<SetStateAction<S>>] {
    return [initialState, function () {}] as any;
  }
  type Dispatch<A> = (value: A) => void;
  type SetStateAction<S> = S | ((prevState: S) => S);

  const [n, setN] = useState({ x: 3 });

  setN(
    create((draft) => {
      // @ts-expect-error
      draft.y = 4;
      draft.x = 5;
    })
  );

  setN(
    create((draft) => {
      // @ts-expect-error
      draft.y = 4;
      draft.x = 5;
      // return draft + 1;
      return undefined;
    })
  );

  setN(
    create((draft) => {
      //
    })
  );
});

it('infers draft, #720 - 3', () => {
  function useState<S>(
    initialState: S | (() => S)
  ): [S, Dispatch<SetStateAction<S>>] {
    return [initialState, function () {}] as any;
  }
  type Dispatch<A> = (value: A) => void;
  type SetStateAction<S> = S | ((prevState: S) => S);

  const [n, setN] = useState({ x: 3 } as { readonly x: number });

  setN(
    create((draft) => {
      // @ts-expect-error
      draft.y = 4;
      draft.x = 5;
    })
  );

  setN(
    create((draft) => {
      // @ts-expect-error
      draft.y = 4;
      draft.x = 5;
      // return draft + 1;
      return undefined;
    })
  );

  setN(
    create((draft) => {
      //
    })
  );
});

it('infers curried', () => {
  type Todo = { title: string };
  {
    const fn = create((draft: Todo) => {
      let x: string = draft.title;
    });

    fn({ title: 'test' });
    // @ts-expect-error
    fn([]);
  }
  {
    const fn = create((draft: Todo) => {
      let x: string = draft.title;
    });

    fn({ title: 'test' });
    // @ts-expect-error
    fn([]);
  }
});

it('infers async curried', async () => {
  type Todo = { title: string };
  {
    const fn = create(async (draft: Todo) => {
      let x: string = draft.title;
    });

    const res = await fn({ title: 'test' });
    // @ts-expect-error
    fn([]);
    assert(res, _ as Todo);
  }
  {
    const fn = create(async (draft: Todo) => {
      let x: string = draft.title;
    });

    const res = await fn({ title: 'test' });
    // @ts-expect-error
    fn([]);
    assert(res, _ as Todo);
  }
});

{
  type State = { count: number };
  type ROState = Immutable<State>;
  const base: any = { count: 0 };
  {
    // basic
    const res = create(base as State, (draft) => {
      draft.count++;
    });
    assert(res, _ as State);
  }
  {
    // basic
    const res = create<State>(base, (draft) => {
      draft.count++;
    });
    assert(res, _ as State);
  }
  {
    // basic
    const res = create(base as ROState, (draft) => {
      draft.count++;
    });
    assert(res, _ as ROState);
  }
  {
    // curried
    const f = create((state: State) => {
      state.count++;
    });
    assert(f, _ as (state: State) => State);
  }
  {
    // curried
    const f = create((state: Draft<ROState>) => {
      state.count++;
    });
    assert(f, _ as (state: ROState) => ROState);
  }
  {
    // curried
    const f: (value: State) => State = create((state) => {
      state.count++;
    });
  }
  {
    // curried
    const f: (value: ROState) => ROState = create((state) => {
      state.count++;
    });
  }
  {
    // curried initial
    const f = create((state: Draft<State>) => {
      state.count++;
    });
    assert(f, _ as (state: State) => State);
  }
  {
    // curried initial
    const f = create((state: Draft<ROState>) => {
      state.count++;
    });
    assert(f, _ as (state: ROState) => ROState);
  }
  {
    // curried
    const f: (value: State) => State = create((state) => {
      state.count++;
    });
  }
  {
    // curried
    const f: (value: ROState) => ROState = create((state) => {
      state.count++;
    });
  }
  {
    // nothing allowed
    const res = create(base as State | undefined, (draft) => {
      return safeReturn(undefined);
    });
    assert(res, _ as State | undefined);
  }
  {
    // as any
    const res = create(base as State, (draft) => {
      return safeReturn(undefined);
    });
    assert(res, _ as State);
  }
  {
    // nothing not allowed
    create(base as State, (draft) => {
      return safeReturn(undefined);
    });
  }
  {
    const f = create((draft: State) => {});
    const n = f(base as State);
    assert(n, _ as State);
  }
  {
    const f = create((draft: Draft<ROState>) => {
      draft.count++;
    });
    const n = f(base as ROState);
    assert(n, _ as ROState);
  }
  {
    // explictly use generic
    const f = create<ROState>((draft) => {
      draft.count++;
    });
    const n = f(base as ROState);
    assert(n, _ as ROState); // yay!
  }
}
