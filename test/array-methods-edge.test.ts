/* eslint-disable @typescript-eslint/no-explicit-any */
import { apply, create, isDraft } from '../src';

describe('native array method boundaries', () => {
  describe.each(['indexOf', 'lastIndexOf', 'includes'] as const)(
    '%s with opaque search values',
    (method) => {
      test.each([false, true])(
        'does not inspect an external Proxy (validated=%s)',
        (validated) => {
          let reads = 0;
          const needle = new Proxy(
            {},
            {
              get() {
                reads += 1;
                throw new Error('search must not inspect its argument');
              },
            }
          );
          // The proxy path is the reference: an element of the base state is
          // drafted on read, so it is never found.
          const viaProxy = (base: any[], ...args: any[]) => {
            let result: unknown;
            create(base, (draft) => {
              if (validated) draft.reverse();
              result = (Array.prototype[method] as Function).apply(draft, args);
            });
            return result;
          };
          for (const base of [[], [1, 1], [needle, needle]] as any[][]) {
            const state = create(base, (draft) => {
              if (validated) draft.reverse();
              expect(draft[method](needle)).toBe(viaProxy(base, needle));
              expect(draft[method](needle, Infinity)).toBe(
                viaProxy(base, needle, Infinity)
              );
            });
            expect(state).toBe(base);
          }
          expect(reads).toBe(0);
        }
      );

      test('does not run search-value side effects', () => {
        const base = [1, 2];
        let reads = 0;
        const state = create(base, (draft) => {
          const needle = new Proxy(
            {},
            {
              get() {
                reads += 1;
                draft[0] = 99;
              },
            }
          );
          expect(draft[method](needle as any)).toBe(
            method === 'includes' ? false : -1
          );
        });
        expect(reads).toBe(0);
        expect(state).toBe(base);
      });

      test('compares revoked external and library proxies by identity', () => {
        const { proxy, revoke } = Proxy.revocable({}, {});
        revoke();
        const [draft, finish] = create({ id: 1 });
        finish();
        for (const needle of [proxy, draft]) {
          create([1, 2] as any[], (array) => {
            expect(array[method](needle)).toBe(
              method === 'includes' ? false : -1
            );
          });
          // Reading a revoked proxy stored in the base state throws through
          // the proxy, and the native search fails the same way.
          create([needle], (array) => {
            expect(() => array[method](needle)).toThrow(TypeError);
            expect(() =>
              (Array.prototype[method] as Function).call(array, needle)
            ).toThrow(TypeError);
          });
        }
      });

      test('compares a draft of the same object from another path by reference', () => {
        const shared = { id: 1 };
        create({ shared, list: [shared] }, (draft) => {
          // The list's own draft for the element differs from `draft.shared`,
          // as it does through the proxy.
          expect(draft.list[method](draft.shared)).toBe(
            method === 'includes' ? false : -1
          );
          // An element of the base state is drafted on read, so the base
          // object is not found before or after the element was read.
          expect(draft.list[method](shared)).toBe(
            method === 'includes' ? false : -1
          );
          expect(draft.list[method](draft.list[0])).toBe(
            method === 'includes' ? true : 0
          );
          expect(draft.list[method](shared)).toBe(
            method === 'includes' ? false : -1
          );
        });
      });

      test("compares another producer's draft by its reference", () => {
        const shared = { id: 1 };
        const [needle, finish] = create(shared);
        try {
          create([shared], (array) => {
            expect(array[method](needle)).toBe(
              method === 'includes' ? false : -1
            );
          });
          // Stored in the base state, the other draft is drafted on read too.
          create([needle], (array) => {
            expect(array[method](needle)).toBe(
              method === 'includes' ? false : -1
            );
            expect(
              (Array.prototype[method] as Function).call(array, needle)
            ).toBe(method === 'includes' ? false : -1);
          });
        } finally {
          finish();
        }
      });
    }
  );

  test.each([
    { method: 'shift', args: [] },
    { method: 'unshift', args: [0] },
    { method: 'splice', args: [0, 1] },
    { method: 'reverse', args: [] },
    { method: 'sort', args: [] },
    { method: 'join', args: ['-'] },
    { method: 'indexOf', args: [2] },
    { method: 'lastIndexOf', args: [2] },
    { method: 'includes', args: [2] },
  ])('borrowed $method has native receiver reads', ({ method, args }) => {
    const run = (native: boolean) => {
      const reads: PropertyKey[] = [];
      const base = [3, 2, 1];
      const receiver = new Proxy(base, {
        get(target, key, self) {
          reads.push(key);
          return Reflect.get(target, key, self);
        },
      });
      let result: any;
      create([], (draft: any) => {
        const fn = native ? (Array.prototype as any)[method] : draft[method];
        result = fn.apply(receiver, args);
        if (result === receiver) result = 'self';
      });
      return { result, base, reads };
    };
    expect(run(false)).toStrictEqual(run(true));
  });

  test('methods of several arrays interleave within one producer', () => {
    const base = {
      a: [{ id: 1 }, { id: 2 }],
      b: [{ id: 3 }, { id: 4 }],
    };
    const [state, patches, inverse] = create(
      base,
      (draft) => {
        draft.a.unshift(draft.b.shift()!);
        const shift = draft.a.shift;
        draft.b.reverse();
        expect(shift.call(draft.a)).toStrictEqual({ id: 3 });
        draft.b.splice(draft.a.indexOf(draft.a[1]), 0, { id: 5 });
      },
      { enablePatches: true }
    );
    expect(state).toStrictEqual({
      a: [{ id: 1 }, { id: 2 }],
      b: [{ id: 4 }, { id: 5 }],
    });
    expect(base.b).toStrictEqual([{ id: 3 }, { id: 4 }]);
    expect(apply(base, patches)).toStrictEqual(state);
    expect(apply(state, inverse)).toStrictEqual(base);
  });

  test('a method read in a finished producer works on later drafts', () => {
    let shift!: () => unknown;
    create({ list: [1, 2] }, (draft) => {
      shift = draft.list.shift;
    });
    const base = { list: [{ id: 1 }, { id: 2 }] };
    const [state, patches, inverse] = create(
      base,
      (draft) => {
        const removed = shift.call(draft.list) as { id: number };
        expect(isDraft(removed)).toBe(true);
        removed.id = 10;
      },
      { enablePatches: true }
    );
    expect(state.list).toStrictEqual([{ id: 2 }]);
    expect(base.list).toStrictEqual([{ id: 1 }, { id: 2 }]);
    expect(apply(base, patches)).toStrictEqual(state);
    expect(apply(state, inverse)).toStrictEqual(base);
  });

  test('a stored method throws on a finalized draft like the native method', () => {
    const [draft, finish] = create({ list: [1, 2] });
    const { list } = draft;
    const shift = list.shift;
    finish();
    expect(() => shift.call(list)).toThrow(TypeError);
    expect(() => Array.prototype.shift.call(list)).toThrow(TypeError);
  });

  test.each([false, true])(
    'moved shared objects generate patches only for their current path (freeze=%s)',
    (enableAutoFreeze) => {
      const shared = { value: 1 };
      const base = [shared, shared, { value: 2 }];
      const [state, patches, inverse] = create(
        base,
        (draft) => {
          draft.unshift({ value: 5 });
          draft.forEach((item) => item.value);
          draft[2].value = 30;
        },
        { enablePatches: true, enableAutoFreeze }
      );
      expect(state).toStrictEqual([
        { value: 5 },
        { value: 1 },
        { value: 30 },
        { value: 2 },
      ]);
      expect(base).toStrictEqual([{ value: 1 }, { value: 1 }, { value: 2 }]);
      expect(apply(base, patches)).toStrictEqual(state);
      expect(apply(state, inverse)).toStrictEqual(base);
    }
  );

  test('replacing an existing draft with its original is an unchanged splice', () => {
    const base = [{ id: 1 }, { id: 2 }];
    const state = create(base, (draft) => {
      const first = draft[0];
      expect(draft.splice(0, 1, base[0])[0]).toBe(first);
    });
    expect(state).toBe(base);
  });

  test('custom species keep the proxy splice behavior', () => {
    class Removed extends Array<number> {}
    const base = [1, 2];
    Object.defineProperty(base, 'constructor', {
      value: { [Symbol.species]: Removed },
    });
    expect(
      create(base, (draft) => {
        const removed = draft.splice(0, 1, 1);
        expect(removed).toBeInstanceOf(Removed);
        expect([...removed]).toStrictEqual([1]);
      })
    ).toBe(base);
  });

  // Index accessors are outside the fast-path contract: their values are read
  // as data, so a pure getter gives the native result while the number and
  // order of getter calls are not guaranteed to match the proxy path.
  test.each([
    { method: 'shift', args: [], result: 3, values: [2, 1] },
    { method: 'unshift', args: [0], result: 4, values: [0, 3, 2, 1] },
    { method: 'splice', args: [0, 1], result: [3], values: [2, 1] },
    { method: 'reverse', args: [], result: 'self', values: [1, 2, 3] },
    { method: 'sort', args: [], result: 'self', values: [1, 2, 3] },
    { method: 'join', args: ['-'], result: '3-2-1', values: 'base' },
  ] as const)(
    '$method reads index accessors as data values',
    ({ method, args, result, values }) => {
      const base = [0, 2, 1];
      Object.defineProperty(base, '0', {
        configurable: true,
        enumerable: true,
        get: () => 3,
      });
      let returned: any;
      const state = create(base, (draft) => {
        returned = (draft[method] as Function).apply(draft, args);
        if (returned === draft) returned = 'self';
      });
      expect(returned).toStrictEqual(result);
      expect(state === base ? 'base' : [...state]).toStrictEqual(values);
      expect(Object.getOwnPropertyDescriptor(base, '0')).toHaveProperty('get');
      expect([...base]).toStrictEqual([3, 2, 1]);
    }
  );

  test.each(['unshift', 'reverse', 'splice'] as const)(
    'unchanged %s does not read unrelated getters',
    (method) => {
      const base = method === 'reverse' ? [1] : [1, 2];
      Object.defineProperty(base, '0', {
        get() {
          throw new Error('unexpected element read');
        },
      });
      expect(
        create(base, (draft) => {
          if (method === 'splice') draft.splice(1, 1, 2);
          else draft[method]();
        })
      ).toBe(base);
    }
  );

  test('calls that cannot change a sparse array keep the base', () => {
    const sparse: (number | undefined)[] = new Array(3);
    sparse[1] = 1;
    const base = { sparse, one: new Array(1), empty: [] as number[] };
    const state = create(base, (draft) => {
      expect(draft.sparse.unshift()).toBe(3);
      expect(draft.sparse.splice(1, 0)).toStrictEqual([]);
      expect(draft.one.reverse()).toBe(draft.one);
      expect(draft.empty.shift()).toBeUndefined();
      expect(draft.sparse.indexOf(undefined)).toBe(-1);
      expect(draft.sparse.includes(undefined)).toBe(true);
    });
    expect(state).toBe(base);
  });

  test('an unchanged sort does not consult the array constructor', () => {
    const base = [1, 2];
    Object.defineProperty(base, 'constructor', {
      configurable: true,
      get() {
        throw new Error('sort must not read constructor');
      },
    });
    expect(
      create(base, (draft) => {
        draft.sort();
      })
    ).toBe(base);
  });

  test.each([{ args: [] }, { args: [0, 0] }, { args: [1, 0] }])(
    'an empty splice does not visit unrelated array elements: $args',
    ({ args }) => {
      const base = [1, 2];
      Object.defineProperty(base, '1', {
        configurable: true,
        enumerable: true,
        get() {
          throw new Error('splice must not visit this element');
        },
      });
      const state = create(base, (draft) => {
        expect((draft.splice as any)(...args)).toStrictEqual([]);
      });
      expect(state).toBe(base);
    }
  );

  test.each(['initial', 'assign', 'splice', 'unshift'] as const)(
    'join observes conversion hooks on function elements: %s',
    (mode) => {
      let active: any[];
      let result: string | undefined;
      const fn = () => {};
      fn.toString = () => {
        active[1] = 20;
        return 'f';
      };
      const base: any[] = mode === 'initial' ? [fn, 2] : [1, 2];
      const state = create(base, (draft) => {
        active = draft;
        if (mode !== 'initial') expect(draft.join()).toBe('1,2');
        if (mode === 'assign') draft[0] = fn;
        if (mode === 'splice') draft.splice(0, 1, fn);
        if (mode === 'unshift') draft.unshift(fn);
        result = draft.join(',');
      });
      expect(result).toBe(mode === 'unshift' ? 'f,20,2' : 'f,20');
      expect(state[1]).toBe(20);
      expect(base[1]).toBe(2);
    }
  );

  test.each(['includes', 'indexOf', 'lastIndexOf'] as const)(
    '%s skips fromIndex conversion on empty arrays',
    (method) => {
      for (const index of [BigInt(0), Symbol('index'), null]) {
        const base: number[] = [];
        let result: unknown;
        let calls = 0;
        const state = create(base, (draft) => {
          const from = index ?? {
            valueOf() {
              calls += 1;
              draft.push(1);
              return 0;
            },
          };
          result = draft[method](1, from as any);
        });
        expect(state).toBe(base);
        expect(calls).toBe(0);
        expect(result).toBe(method === 'includes' ? false : -1);
      }
    }
  );

  test.each(['includes', 'indexOf', 'lastIndexOf'] as const)(
    '%s retains native bounds across fromIndex conversion',
    (method) => {
      for (const length of [1, 4]) {
        const run = (useProxyMethod: boolean) => {
          let result: unknown;
          let calls = 0;
          const state = create([1, 2, 1], (draft) => {
            const from = {
              valueOf() {
                calls += 1;
                draft.length = length;
                return -1;
              },
            };
            const fn = useProxyMethod ? Array.prototype[method] : draft[method];
            result = (fn as Function).call(draft, 1, from);
          });
          return { state, result, calls };
        };
        expect(run(false)).toStrictEqual(run(true));
      }
    }
  );

  test.each(['push', 'pop', 'truncate', 'grow'] as const)(
    'splice preserves native argument-conversion effects: %s',
    (effect) => {
      const mutate = (draft: number[]) => {
        if (effect === 'push') draft.push(3);
        if (effect === 'pop') draft.pop();
        if (effect === 'truncate') draft.length = 1;
        if (effect === 'grow') draft.length = 5;
      };
      for (const deleteCount of [0, 1]) {
        for (const insert of [[], [1]]) {
          const run = (useProxyMethod: boolean) => {
            let calls = 0;
            let removed: any;
            const base = [0, 1, 2];
            const [state, patches, inverse] = create(
              base,
              (draft) => {
                const start = {
                  valueOf() {
                    calls += 1;
                    mutate(draft);
                    return 1;
                  },
                };
                const method = useProxyMethod
                  ? Array.prototype.splice
                  : draft.splice;
                removed = method.call(
                  draft,
                  start as any,
                  deleteCount,
                  ...insert
                );
              },
              { enablePatches: true }
            );
            return { base, state, patches, inverse, removed, calls };
          };
          expect(run(false)).toStrictEqual(run(true));
        }
      }
    }
  );

  test('splice preserves forward patches after conversion removes an element', () => {
    const base = [0, 1, 2];
    const [state, patches, inverse] = create(
      base,
      (draft) => {
        draft.splice(
          {
            valueOf() {
              draft.pop();
              return 0;
            },
          } as any,
          1
        );
      },
      { enablePatches: true }
    );
    expect(state).toStrictEqual([1, undefined]);
    expect(apply(base, patches)).toStrictEqual(state);
    expect(apply(state, inverse)).toStrictEqual(base);
  });

  test.each([false, true])(
    'object assignments invalidate density independently of element type (freeze=%s)',
    (enableAutoFreeze) => {
      const base = [{ id: 1 }, { id: 2 }];
      const [state, patches, inverse] = create(
        base,
        (draft) => {
          draft.reverse();
          draft[3] = { id: 3 };
          draft.reverse();
        },
        { enablePatches: true, enableAutoFreeze }
      );
      expect(state).toStrictEqual([{ id: 3 }, undefined, { id: 1 }, { id: 2 }]);
      expect(apply(base, patches)).toStrictEqual(state);
      expect(apply(state, inverse)).toStrictEqual(base);
      expect(base).toStrictEqual([{ id: 1 }, { id: 2 }]);
    }
  );
});

describe('native array method contract', () => {
  // Native JS on a plain copy is the reference: values and own-property
  // presence must agree at every index, and patches must replay both ways.
  const shape = (array: any[]) => ({
    length: array.length,
    values: Array.from(array, (value) => value),
    own: Array.from(array, (_value, index) => index in array),
  });
  const run = (base: any[], recipe: (array: any[]) => unknown) => {
    const expected = Array.prototype.concat.call(base) as any[];
    const expectedResult = recipe(expected);
    let result: unknown;
    const [state, patches, inverse] = create(
      base,
      (draft) => {
        result = recipe(draft);
      },
      { enablePatches: true }
    );
    expect(shape(state)).toStrictEqual(shape(expected));
    expect(result === undefined ? result : JSON.stringify(result)).toBe(
      expectedResult === undefined
        ? expectedResult
        : JSON.stringify(expectedResult)
    );
    expect(shape(apply(base, patches))).toStrictEqual(shape(state));
    expect(shape(apply(state, inverse))).toStrictEqual(shape(base));
    return state;
  };

  test.each([
    { name: 'shift', recipe: (array: any[]) => array.shift() },
    {
      name: 'unshift(undefined)',
      recipe: (array: any[]) => array.unshift(undefined),
    },
    {
      name: 'unshift(9, undefined)',
      recipe: (array: any[]) => array.unshift(9, undefined),
    },
    { name: 'splice(1, 1)', recipe: (array: any[]) => array.splice(1, 1) },
    {
      name: 'splice(1, 1, undefined)',
      recipe: (array: any[]) => array.splice(1, 1, undefined),
    },
    {
      name: 'splice(0, 2, undefined, 7, 8)',
      recipe: (array: any[]) => array.splice(0, 2, undefined, 7, 8),
    },
    { name: 'splice(-1)', recipe: (array: any[]) => array.splice(-1) },
    { name: 'reverse', recipe: (array: any[]) => array.reverse() && 'self' },
    { name: 'sort', recipe: (array: any[]) => array.sort() && 'self' },
    {
      name: 'sort((a, b) => b - a)',
      recipe: (array: any[]) => array.sort((a, b) => b - a) && 'self',
    },
    {
      name: 'shift then unshift(2)',
      recipe: (array: any[]) => {
        array.shift();
        return array.unshift(2);
      },
    },
  ])(
    '$name keeps undefined elements as own properties like native JS',
    ({ recipe }) => {
      run([0, undefined, 2, undefined], recipe);
      run([undefined, 3, 1], recipe);
      run([undefined], recipe);
    }
  );

  test('moved undefined elements keep the drafts around them', () => {
    const base = [{ id: 1 }, undefined, { id: 2 }, undefined] as any[];
    let first: any;
    const state = run(base, (array) => {
      if (isDraft(array)) first = array[0];
      array.reverse();
      if (isDraft(array)) expect(array[3]).toBe(first);
      array.splice(1, 1);
      if (isDraft(array)) expect(array[2]).toBe(first);
      return array.length;
    });
    expect(state).toStrictEqual([undefined, undefined, { id: 1 }]);
    expect(state[2]).toBe(base[0]);
  });

  test.each(['indexOf', 'lastIndexOf', 'includes'] as const)(
    '%s finds undefined elements like native JS',
    (method) => {
      const base = [undefined, 1, undefined, NaN];
      create(base, (draft) => {
        for (const args of [
          [undefined],
          [undefined, 1],
          [undefined, -1],
          [NaN],
          [1, -2],
        ]) {
          expect((draft[method] as Function)(...args)).toBe(
            (Array.prototype[method] as Function).call(base, ...args)
          );
        }
      });
    }
  );

  test('holes still take the proxy path and stay holes in the result and its replay', () => {
    const base: any[] = [0, 1, 2];
    const [state, patches] = create(
      base,
      (draft) => {
        draft[4] = 4;
        draft.reverse();
        draft.shift();
      },
      { enablePatches: true }
    );
    const replay = apply(base, patches);
    expect(shape(replay).values).toStrictEqual(shape(state).values);
    expect(shape(replay).own).toStrictEqual(shape(state).own);
  });
  test.each([
    { method: 'unshift', args: [9] },
    { method: 'splice', args: [0, 1, 7, 8] },
  ] as const)(
    '$method on an array with holes takes the proxy path',
    ({ method, args }) => {
      const base: any[] = [0, 1];
      base[3] = 3;
      const produce = (call: (draft: any[]) => unknown) => {
        let result: unknown;
        const [state, patches] = create(
          base,
          (draft) => {
            result = call(draft);
          },
          { enablePatches: true }
        );
        return { result, state, patches };
      };
      const viaMethod = produce((draft) => (draft as any)[method](...args));
      const viaBuiltin = produce((draft) =>
        (Array.prototype[method] as Function).apply(draft, args)
      );
      expect(viaMethod.result).toStrictEqual(viaBuiltin.result);
      expect(shape(viaMethod.state)).toStrictEqual(shape(viaBuiltin.state));
      expect(viaMethod.patches).toStrictEqual(viaBuiltin.patches);
      expect(shape(apply(base, viaMethod.patches))).toStrictEqual(
        shape(viaMethod.state)
      );
    }
  );

  test.each(['indexOf', 'lastIndexOf', 'includes'] as const)(
    '%s that meets a base element of an array with holes takes the proxy path',
    (method) => {
      const element = { value: 1 };
      const base: any[] = [element];
      base[2] = 2;
      let viaMethod: unknown;
      let viaBuiltin: unknown;
      create(base, (draft) => {
        viaMethod = (draft as any)[method](element);
      });
      create(base, (draft) => {
        viaBuiltin = (Array.prototype[method] as Function).call(draft, element);
      });
      expect(viaMethod).toBe(viaBuiltin);
      expect(viaMethod).toBe(method === 'includes' ? false : -1);
    }
  );

  test.each(['indexOf', 'lastIndexOf', 'includes'] as const)(
    '%s finds a base element that a read hands out without drafting',
    (method) => {
      const date = new Date(0);
      const base: any[] = [{ value: 1 }, date, 2];
      let viaMethod: unknown;
      let viaBuiltin: unknown;
      create(base, (draft) => {
        viaMethod = (draft as any)[method](date);
      });
      create(base, (draft) => {
        viaBuiltin = (Array.prototype[method] as Function).call(draft, date);
      });
      expect(viaMethod).toBe(viaBuiltin);
      expect(viaMethod).toBe(method === 'includes' ? true : 1);
    }
  );

  test('patches include assignments below the range a native method changed', () => {
    run([0, 1, 2, 3, 4, 5], (array) => {
      array[0] = 9;
      return array.splice(4, 1);
    });
    run([0, 1, 2, 3, 4, 5], (array) => {
      array.splice(4, 1);
      array[1] = 8;
    });
  });
});
