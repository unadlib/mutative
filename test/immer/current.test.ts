import { current, isDraft, create, original } from '../../src';

runTests('proxy', true);
// runTests("es5", false)

const isProd = process.env.NODE_ENV === 'production';

function runTests(name: any, useProxies: any) {
  describe('current - ' + name, () => {
    // beforeAll(() => {
    // 	setAutoFreeze(true)
    // 	setUseProxies(useProxies)
    // })

    it('must be called on draft', () => {
      expect(() => {
        current({});
      }).toThrowError(
        `current() is only used for Draft, parameter: [object Object]`
      );
    });

    it('can handle simple arrays', () => {
      const base = [{ x: 1 }];
      let c;
      const next = create(base, (draft) => {
        expect(current(draft)).toEqual(base);
        draft[0].x++;
        c = current(draft);
        expect(c).toEqual([{ x: 2 }]);
        expect(Array.isArray(c));
        draft[0].x++;
      });
      expect(next).toEqual([{ x: 3 }]);
      expect(c).toEqual([{ x: 2 }]);
      expect(isDraft(c)).toBe(false);
    });

    it("won't freeze", () => {
      const base = { x: 1 };
      const next = create(base, (draft) => {
        draft.x++;
        expect(Object.isFrozen(current(draft))).toBe(false);
      });
    });

    it('returns original without changes', () => {
      const base = {};
      create(base, (draft) => {
        expect(original(draft)).toBe(base);
        expect(current(draft)).toBe(base);
      });
    });

    it('can handle property additions', () => {
      const base = {};
      create(base, (draft) => {
        // @ts-ignore
        draft.x = true;
        const c = current(draft);
        expect(c).not.toBe(base);
        expect(c).not.toBe(draft);
        expect(c).toEqual({
          x: true,
        });
      });
    });

    it('can handle property deletions', () => {
      const base = {
        x: 1,
      };
      create(base, (draft) => {
        // @ts-ignore
        delete draft.x;
        const c = current(draft);
        expect(c).not.toBe(base);
        expect(c).not.toBe(draft);
        expect(c).toEqual({});
      });
    });

    it("won't reflect changes over time", () => {
      const base = {
        x: 1,
      };
      create(base, (draft) => {
        draft.x++;
        const c = current(draft);
        expect(c).toEqual({
          x: 2,
        });
        draft.x++;
        expect(c).toEqual({
          x: 2,
        });
      });
    });

    it('will find drafts inside objects', () => {
      const base = {
        x: 1,
        y: {
          z: 2,
        },
        z: {},
      };
      create(base, (draft) => {
        draft.y.z++;
        draft.y = {
          // @ts-ignore
          nested: draft.y,
        };
        const c = current(draft);
        expect(c).toEqual({
          x: 1,
          y: {
            nested: {
              z: 3,
            },
          },
          z: {},
        });
        expect(isDraft(c.y.nested)).toBe(false);
        // @ts-ignore
        expect(isDraft(draft.y.nested)).toBe(true);
        expect(c.z).toBe(base.z);
        // @ts-ignore
        expect(c.y.nested).not.toBe(draft.y.nested);
      });
    });

    it('handles map - 1', () => {
      const base = new Map([['a', { x: 1 }]]);
      create(base, (draft) => {
        expect(current(draft)).toBe(base);
        draft.delete('a');
        let c = current(draft);
        expect(current(draft)).not.toBe(base);
        expect(current(draft)).not.toBe(draft);
        expect(c).toEqual(new Map());
        const obj = {};
        // @ts-ignore
        draft.set('b', obj);
        expect(c).toEqual(new Map());
        expect(current(draft)).toEqual(new Map([['b', obj]]));
        expect(c).toBeInstanceOf(Map);
      });
    });

    it('handles map - 2', () => {
      const base = new Map([['a', { x: 1 }]]);
      create(base, (draft) => {
        // @ts-ignore
        draft.get('a').x++;
        const c = current(draft);
        expect(c).not.toBe(base);
        expect(c).toEqual(new Map([['a', { x: 2 }]]));
        // @ts-ignore
        draft.get('a').x++;
        expect(c).toEqual(new Map([['a', { x: 2 }]]));
      });
    });

    it('handles set', () => {
      const base = new Set([1]);
      create(base, (draft) => {
        expect(current(draft)).toBe(base);
        draft.add(2);
        const c = current(draft);
        expect(c).toEqual(new Set([1, 2]));
        expect(c).not.toBe(draft);
        expect(c).not.toBe(base);
        draft.add(3);
        expect(c).toEqual(new Set([1, 2]));
        expect(c).toBeInstanceOf(Set);
      });
    });

    it('handles simple class', () => {
      class Counter {
        current = 0;

        inc() {
          this.current++;
        }
      }

      const counter1 = new Counter();
      create(
        counter1,
        (draft) => {
          expect(current(draft)).toBe(counter1);
          draft.inc();
          const c = current(draft);
          expect(c).not.toBe(draft);
          expect(c.current).toBe(1);
          c.inc();
          expect(c.current).toBe(2);
          expect(draft.current).toBe(1);
          draft.inc();
          draft.inc();
          expect(c.current).toBe(2);
          expect(draft.current).toBe(3);
          expect(c).toBeInstanceOf(Counter);
        },
        {
          mark: (target, { immutable }) => {
            if (target instanceof Counter) {
              return immutable;
            }
          },
        }
      );
    });
  });
}
