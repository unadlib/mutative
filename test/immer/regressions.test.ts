'use strict';
import { apply, create } from '../../src';

// enableAllPlugins()

runBaseTest('proxy (no freeze)', true, false);
runBaseTest('proxy (autofreeze)', true, true);
// runBaseTest("es5 (no freeze)", false, false)
// runBaseTest("es5 (autofreeze)", false, true)

function runBaseTest(
  name: any,
  useProxies: any,
  enableAutoFreeze?: any,
  useListener?: any
) {
  describe(`regressions ${name}`, () => {
    test('#604 freeze inside class', () => {
      class Thing {
        _data: any;
        constructor({ x }: any) {
          this._data = { x };
        }

        get x() {
          return this._data.x;
        }

        set x(x: any) {
          this._data.x = x;
        }
      }

      let i = 1;
      let item = new Thing({ x: i });
      let item0 = item;

      const bump = () => {
        item = create(
          item,
          (draft) => {
            // uncomment this to make things work
            //draft._data
            draft.x = ++i;
          },
          {
            enableAutoFreeze,
            mark: (target, { immutable }) => {
              if (target instanceof Thing) {
                return immutable;
              }
            },
          }
        );
      };

      bump();
      bump();

      expect(i).toBe(3);
      expect(item._data).toEqual({
        x: 3,
      });
      expect(item0._data).toEqual({
        x: 1,
      });
    });

    test('#646 setting undefined field to undefined should not create new result', () => {
      const foo = {
        bar: undefined,
      };
      const foo2 = create(
        foo,
        (draft) => {
          draft.bar = undefined;
        },
        {
          enableAutoFreeze,
        }
      );
      expect(foo2).toBe(foo);
    });

    test('#646 - 2 setting undefined field to undefined should not create new result', () => {
      const foo = {};
      const foo2 = create(
        foo,
        (draft) => {
          // @ts-ignore
          draft.bar = undefined;
        },
        {
          enableAutoFreeze,
        }
      );
      expect(foo2).not.toBe(foo);
      expect(foo).toEqual({});
      expect(foo2).toEqual({ bar: undefined });
    });

    test('#638 - out of range assignments', () => {
      const state: any[] = [];

      const state1 = create(
        state,
        (draft) => {
          // @ts-ignore
          draft[2] = 'v2';
        },
        {
          enableAutoFreeze,
        }
      );

      expect(state1.length).toBe(3);
      expect(state1).toEqual([undefined, undefined, 'v2']);

      const state2 = create(
        state1,
        (draft) => {
          // @ts-ignore
          draft[1] = 'v1';
        },
        {
          enableAutoFreeze,
        }
      );

      expect(state2.length).toBe(3);
      expect(state2).toEqual([undefined, 'v1', 'v2']);
    });

    test('#628 set removal hangs', () => {
      let arr: any[] = [];
      let set = new Set<any>([arr]);

      let result = create(
        set,
        (draft1) => {
          create(
            draft1,
            (draft2) => {
              draft2.delete(arr);
            },
            {
              enableAutoFreeze,
            }
          );
        },
        {
          enableAutoFreeze,
        }
      );
      expect(result).toEqual(new Set([[]])); // N.B. this outcome doesn't seem not correct, but then again,
      // double produce without return looks iffy as well, so not sure what the expected outcome in the
      // original report was
    });

    test('#628 - 2 set removal hangs', () => {
      let arr: any[] = [];
      let set = new Set([arr]);

      let result = create(
        set,
        (draft2) => {
          draft2.delete(arr);
        },
        {
          enableAutoFreeze,
        }
      );
      expect(result).toEqual(new Set());
    });

    test('#650 - changes with overridden arr.slice() fail', () => {
      const data = {
        foo: [
          {
            isActive: false,
          },
        ],
      };
      // That's roughly what seamless-immutable does
      data.foo.slice = (...args) =>
        // @ts-ignore
        Object.freeze(Array.prototype.slice.call(data.foo, ...args));

      const newData = create(
        data,
        (draft) => {
          draft.foo[0].isActive = true;
        },
        {
          enableAutoFreeze,
        }
      );
      expect(newData.foo[0].isActive).toBe(true);
    });

    test('#659 no reconciliation after read', () => {
      const bar = {};
      const foo = { bar };

      const next = create(
        foo,
        (draft) => {
          draft.bar;
          draft.bar = bar;
        },
        {
          enableAutoFreeze,
        }
      );
      expect(next).toBe(foo);
    });

    test('#659 no reconciliation after read - 2', () => {
      const bar = {};
      const foo = { bar };

      const next = create(
        foo,
        (draft) => {
          const subDraft = draft.bar;
          draft.bar = bar;
          // @ts-ignore
          subDraft.x = 3; // this subDraft is not part of the end result, so ignore
        },
        {
          enableAutoFreeze,
        }
      );

      expect(next).toEqual(foo);
    });

    test('#659 no reconciliation after read - 3', () => {
      const bar = {};
      const foo = { bar };

      const next = create(
        foo,
        (draft) => {
          const subDraft = draft.bar;
          // @ts-ignore
          subDraft.x = 3; // this subDraft is not part of the end result, so ignore
          draft.bar = bar;
        },
        {
          enableAutoFreeze,
        }
      );
      expect(next).toEqual(foo);
    });

    // Disabled: these are optimizations that would be nice if they
    // could be detected, but don't change the correctness of the result
    test('#659 no reconciliation after read - 4', () => {
      const bar = {};
      const foo = { bar };

      const next = create(
        foo,
        (draft) => {
          const subDraft = draft.bar;
          draft.bar = bar;
          // @ts-ignore
          subDraft.x = 3; // this subDraft is not part of the end result, so ignore
        },
        {
          enableAutoFreeze,
        }
      );
      // ! it's different from mutative
      expect(next).toEqual(foo);
    });

    // Disabled: these are optimizations that would be nice if they
    // could be detected, but don't change the correctness of the result
    test('#659 no reconciliation after read - 5', () => {
      const bar = {};
      const foo = { bar };

      const next = create(
        foo,
        (draft) => {
          const subDraft = draft.bar;
          // @ts-ignore
          subDraft.x = 3; // this subDraft is not part of the end result, so ignore
          draft.bar = bar;
        },
        {
          enableAutoFreeze,
        }
      );
      // ! it's different from mutative
      expect(next).toEqual(foo);
    });

    test('#659 no reconciliation after read - 6', () => {
      const bar = {};
      const foo = { bar };

      const next = create(
        foo,
        (draft) => {
          const subDraft = draft.bar;
          // @ts-ignore
          subDraft.x = 3; // this subDraft is not part of the end result, so ignore
          draft.bar = bar;
          draft.bar = subDraft;
        },
        {
          enableAutoFreeze,
        }
      );
      expect(next).not.toBe(foo);
      expect(next).toEqual({
        bar: { x: 3 },
      });
    });

    test('#807 new undefined member not stored', () => {
      const state = {};
      const newState = create(
        state,
        (draft) => {
          // @ts-ignore
          draft.baz = undefined;
        },
        {
          enableAutoFreeze,
        }
      );
      expect(state).not.toBe(newState);
      expect(Object.hasOwnProperty.call(newState, 'baz')).toBe(true);
      expect(newState).toEqual({
        baz: undefined,
      });
    });
  });
}
