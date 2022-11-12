'use strict';
import { create } from '../../src';
import { deepFreeze } from '../../src/utils';

const { isFrozen } = Object;

runTests('proxy', true);
// runTests('es5', false);

function runTests(name: any, useProxies: any) {
  describe('auto freeze - ' + name, () => {
    // beforeAll(() => {
    //   setUseProxies(useProxies);
    //   setAutoFreeze(true);
    // });

    it('never freezes the base state', () => {
      const base = { arr: [1], obj: { a: 1 } };
      const next = create(
        base,
        (draft) => {
          draft.arr.push(1);
        },
        {
          enableAutoFreeze: true,
        }
      );
      expect(isFrozen(base)).toBeFalsy();
      expect(isFrozen(base.arr)).toBeFalsy();
      expect(isFrozen(next)).toBeTruthy();
      expect(isFrozen(next.arr)).toBeTruthy();
    });

    it('freezes reused base state', () => {
      const base = { arr: [1], obj: { a: 1 } };
      const next = create(
        base,
        (draft) => {
          draft.arr.push(1);
        },
        {
          enableAutoFreeze: true,
        }
      );
      expect(next.obj).toBe(base.obj);
      expect(isFrozen(next.obj)).toBeTruthy();
    });

    describe('the result is always auto-frozen when', () => {
      it('the root draft is mutated (and no error is thrown)', () => {
        const base = {};
        const next = create(
          base,
          (draft) => {
            // @ts-ignore
            draft.a = 1;
          },
          {
            enableAutoFreeze: true,
          }
        );
        expect(next).not.toBe(base);
        expect(isFrozen(next)).toBeTruthy();
      });

      it('a nested draft is mutated (and no error is thrown)', () => {
        const base = { a: {} };
        const next = create(
          base,
          (draft) => {
            // @ts-ignore
            draft.a.b = 1;
          },
          {
            enableAutoFreeze: true,
          }
        );
        expect(next).not.toBe(base);
        expect(isFrozen(next)).toBeTruthy();
        expect(isFrozen(next.a)).toBeTruthy();
      });

      // it('a new object replaces the entire draft', () => {
      //   const obj = { a: { b: {} } };
      //   const next = create({}, () => {}, , {
      //     enableAutoFreeze: true
      //   });
      //   expect(next).toBe(obj);
      //   expect(isFrozen(next)).toBeTruthy();
      //   expect(isFrozen(next.a)).toBeTruthy();
      //   expect(isFrozen(next.a.b)).toBeTruthy();
      // });

      it('a new object is added to the root draft', () => {
        const base = {};
        const next = create(
          base,
          (draft) => {
            // @ts-ignore
            draft.a = { b: [] };
          },
          {
            enableAutoFreeze: true,
          }
        );
        expect(next).not.toBe(base);
        expect(isFrozen(next)).toBeTruthy();
        // @ts-ignore
        expect(isFrozen(next.a)).toBeTruthy();
        // @ts-ignore
        expect(isFrozen(next.b)).toBeTruthy();
      });

      it('a new object is added to a nested draft', () => {
        const base = { a: {} };
        const next = create(
          base,
          (draft) => {
            // @ts-ignore
            draft.a.b = { c: {} };
          },
          {
            enableAutoFreeze: true,
          }
        );
        expect(next).not.toBe(base);
        expect(isFrozen(next)).toBeTruthy();
        expect(isFrozen(next.a)).toBeTruthy();
        // @ts-ignore
        expect(isFrozen(next.a.b)).toBeTruthy();
        // @ts-ignore
        expect(isFrozen(next.a.b.c)).toBeTruthy();
      });

      // it('a nested draft is returned', () => {
      //   const base = { a: {} };
      //   // @ts-ignore
      //   const next = create(base, (draft) => draft, {
      //     enableAutoFreeze: true,
      //   });
      //   expect(next.a).toBe(base.a);
      //   expect(isFrozen(next.a)).toBeTruthy();
      // });

      // it('the base state is returned', () => {
      //   const base = {};
      //   // @ts-ignore
      //   const next = create(base, () => base, {
      //     enableAutoFreeze: true,
      //   });
      //   expect(next).toBe(base);
      //   expect(isFrozen(next)).toBeTruthy();
      // });

      it('the producer is a no-op', () => {
        const base = { a: {} };
        const next = create(base, () => {}, {
          enableAutoFreeze: true,
        });
        expect(next).toBe(base);
        expect(isFrozen(next)).toBeTruthy();
        expect(isFrozen(next.a)).toBeTruthy();
      });

      // it('the root draft is returned', () => {
      //   const base = { a: {} };
      //   // @ts-ignore
      //   const next = create(base, (draft) => draft, {
      //     enableAutoFreeze: true,
      //   });
      //   expect(next).toBe(base);
      //   expect(isFrozen(next)).toBeTruthy();
      //   expect(isFrozen(next.a)).toBeTruthy();
      // });

      // it('a new object replaces a primitive base', () => {
      //   const obj = { a: {} };
      //   const next = create(null, () => obj);
      //   expect(next).toBe(obj);
      //   expect(isFrozen(next)).toBeTruthy();
      //   expect(isFrozen(next.a)).toBeTruthy();
      // });
    });

    it('can handle already frozen trees', () => {
      const a: any[] = [];
      const b = { a };
      Object.freeze(a);
      Object.freeze(b);
      const n = create(
        b,
        (draft) => {
          // @ts-ignore
          draft.c = true;
          // @ts-ignore
          draft.a.push(3);
        },
        {
          enableAutoFreeze: true,
        }
      );
      expect(n).toEqual({ c: true, a: [3] });
    });

    it('will freeze maps', () => {
      const base = new Map();

      const res = create(
        base,
        (draft) => {
          draft.set('a', 1);
        },
        {
          enableAutoFreeze: true,
        }
      );
      // @ts-ignore
      expect(() => res.set('b', 2)).toThrowErrorMatchingSnapshot();
      // @ts-ignore
      expect(() => res.clear()).toThrowErrorMatchingSnapshot();
      // @ts-ignore
      expect(() => res.delete('b')).toThrowErrorMatchingSnapshot();

      // In draft, still editable
      expect(
        create(res, (d) => void d.set('a', 2), {
          enableAutoFreeze: true,
        })
      ).not.toBe(res);
    });

    it('will freeze sets', () => {
      const base = new Set();
      const res = create(
        base,
        (draft) => {
          base.add(1);
        },
        {
          enableAutoFreeze: true,
        }
      );
      expect(() => base.add(2)).toThrowErrorMatchingSnapshot();
      expect(() => base.delete(1)).toThrowErrorMatchingSnapshot();
      expect(() => base.clear()).toThrowErrorMatchingSnapshot();

      // In draft, still editable
      expect(create(res, (d) => void d.add(2))).not.toBe(res);
    });

    it('Map#get() of frozen object will became draftable', () => {
      const base = {
        map: new Map([
          [
            'a',
            new Map([
              ['a', true],
              ['b', true],
              ['c', true],
            ]),
          ],
          ['b', new Map([['a', true]])],
          ['c', new Map([['a', true]])],
        ]),
      };

      // This will freeze maps
      const frozen = create(base, (draft) => {});

      // https://github.com/immerjs/immer/issues/472
      create(
        frozen,
        (draft) => {
          ['b', 'c'].forEach((other) => {
            const m = draft.map.get(other);
            // @ts-ignore
            m.delete('a');
          });
        },
        {
          enableAutoFreeze: true,
        }
      );
    });

    it('never freezes non-enumerable fields #590', () => {
      const component = {};
      Object.defineProperty(component, 'state', {
        value: { x: 1 },
        enumerable: false,
        writable: true,
        configurable: true,
      });

      const state = {
        x: 1,
      };

      const state2 = create(
        state,
        (draft) => {
          // @ts-ignore
          draft.ref = component;
        },
        {
          enableAutoFreeze: true,
        }
      );

      expect(() => {
        // @ts-ignore
        state2.ref.state.x++;
      }).not.toThrow();
      // @ts-ignore
      expect(state2.ref.state.x).toBe(2);
    });

    it('never freezes symbolic fields #590', () => {
      const component = {};
      const symbol = Symbol('test');
      Object.defineProperty(component, symbol, {
        value: { x: 1 },
        enumerable: true,
        writable: true,
        configurable: true,
      });

      const state = {
        x: 1,
      };

      const state2 = create(
        state,
        (draft) => {
          // @ts-ignore
          draft.ref = component;
        },
        {
          enableAutoFreeze: true,
        }
      );

      expect(() => {
        // @ts-ignore
        state2.ref[symbol].x++;
      }).not.toThrow();
      // @ts-ignore
      expect(state2.ref[symbol].x).toBe(2);
    });
  });
}

test('freeze - shallow', () => {
  const obj1 = { hello: { world: true } };
  const res = Object.freeze(obj1);

  expect(res).toBe(obj1);
  expect(Object.isFrozen(res)).toBe(true);
  expect(Object.isFrozen(res.hello)).toBe(false);
});

test('freeze - deep', () => {
  const obj1 = { hello: { world: true } };
  deepFreeze(obj1);

  // expect(res).toBe(obj1);
  expect(Object.isFrozen(obj1)).toBe(true);
  // @ts-ignore
  expect(Object.isFrozen(obj1.hello)).toBe(true);
});
