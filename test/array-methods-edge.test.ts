/* eslint-disable @typescript-eslint/no-explicit-any */
import { apply, create } from '../src';

describe('native array method boundaries', () => {
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
      for (const index of [BigInt(0), Symbol(), null]) {
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
            result = fn.call(draft, 1, from as any);
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
