/* eslint-disable @typescript-eslint/no-explicit-any */
import { apply, create } from '../src';

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
          for (const base of [[], [1, 1], [needle, needle]] as any[][]) {
            const state = create(base, (draft) => {
              if (validated) draft.reverse();
              const expected = (Array.prototype[method] as Function).call(
                base,
                needle
              );
              expect(draft[method](needle)).toBe(expected);
              expect(draft[method](needle, Infinity)).toBe(
                (Array.prototype[method] as Function).call(
                  base,
                  needle,
                  Infinity
                )
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
          create([needle], (array) => {
            expect(array[method](needle)).toBe(
              method === 'includes' ? true : 0
            );
          });
        }
      });

      test('matches the original of a draft owned by this producer', () => {
        const shared = { id: 1 };
        create({ shared, list: [shared] }, (draft) => {
          expect(draft.list[method](draft.shared)).toBe(
            method === 'includes' ? true : 0
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
          create([needle], (array) => {
            expect(array[method](needle)).toBe(
              method === 'includes' ? true : 0
            );
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
