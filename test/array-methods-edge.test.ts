/* eslint-disable @typescript-eslint/no-explicit-any */
import { apply, create } from '../src';

describe('native array method boundaries', () => {
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

  test.each(['shift', 'unshift', 'splice', 'reverse', 'sort', 'join'] as const)(
    '%s preserves accessor read order',
    (method) => {
      const run = (throughProxy: boolean) => {
        let calls = 0;
        let result: any;
        const base = [3, 2, 1];
        Object.defineProperty(base, '0', {
          configurable: true,
          enumerable: true,
          get: () => ++calls,
        });
        const state = create(base, (draft) => {
          const fn = throughProxy ? Array.prototype[method] : draft[method];
          result = (fn as Function).apply(
            draft,
            method === 'splice' ? [1, 1] : method === 'unshift' ? [0] : []
          );
          if (result === draft) result = 'self';
        });
        return { calls, result, values: state === base ? 'base' : [...state] };
      };
      expect(run(false)).toStrictEqual(run(true));
    }
  );

  test.each(['indexOf', 'includes', 'lastIndexOf'] as const)(
    '%s sees writes made by element getters',
    (method) => {
      let active: number[];
      let reading = false;
      const base = [1, 2, 3];
      Object.defineProperty(base, method === 'lastIndexOf' ? '2' : '0', {
        configurable: true,
        enumerable: true,
        get() {
          if (!reading) {
            reading = true;
            active[1] = 20;
            reading = false;
          }
          return 1;
        },
      });
      const state = create(base, (draft) => {
        active = draft;
        expect(draft[method](20)).toBe(method === 'includes' ? true : 1);
      });
      expect(state[1]).toBe(20);
      expect(base[1]).toBe(2);
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
