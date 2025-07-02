// @ts-nocheck
import {
  setAutoFreeze,
  current,
  immerable,
  isDraft,
  produce,
  original,
  freeze,
  enableMapSet,
} from '../src/immer';

enableMapSet();

runTests('proxy', true);

const isProd = process.env.NODE_ENV === 'production';

function runTests(name) {
  describe('current - ' + name, () => {
    beforeAll(() => {
      setAutoFreeze(true);
    });

    it('must be called on draft', () => {
      expect(() => {
        current({});
      }).toThrow(
        isProd
          ? '[Immer] minified error nr: 10. Full error at: https://bit.ly/3cXEKWf'
          : 'current() is only used for Draft, parameter: [object Object]'
      );
    });

    it('can handle simple arrays', () => {
      const base = [{ x: 1 }];
      let c;
      const next = produce(base, (draft) => {
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
      const next = produce(base, (draft) => {
        draft.x++;
        expect(Object.isFrozen(current(draft))).toBe(false);
      });
    });

    it('returns original without changes', () => {
      const base = {};
      produce(base, (draft) => {
        expect(original(draft)).toBe(base);
        expect(current(draft)).toBe(base);
      });
    });

    it('can handle property additions', () => {
      const base = {};
      produce(base, (draft) => {
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
      produce(base, (draft) => {
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
      produce(base, (draft) => {
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
        w: {},
        ww: freeze({}),
        a: {
          b: 2,
        },
      };
      produce(base, (draft) => {
        draft.y.z++;
        draft.z = {
          nested: {
            z: 3,
          },
        };
        draft.a.b = 3;
        draft.a.b = 2;
        const c = current(draft);
        expect(c).toEqual({
          x: 1,
          y: {
            z: 3,
          },
          z: { nested: { z: 3 } },
          w: {},
          ww: {},
          a: {
            b: 2,
          },
        });
        expect(isDraft(c)).toBe(false);
        expect(isDraft(c.y)).toBe(false);
        expect(isDraft(c.z)).toBe(false);
        expect(isDraft(c.z.nested)).toBe(false);
        expect(isDraft(c.z.nested.z)).toBe(false);
        // this works only with frozen objects, otherwise no way to tell if this was
        // a new object that was added during the recipe, that might contain drafts.
        // the recipe or not
        // !!! This is different from immer
        expect(c.w).toBe(base.w);
        expect(c.a).not.toBe(base.a);
        // was frozen, so recyclable
        expect(c.ww).toBe(base.ww);
      });
    });

    it('will find drafts inside objects - 2', () => {
      const base = {
        ar: [
          {
            x: 1,
          },
          { x: 2 },
        ],
      };
      produce(base, (draft) => {
        draft.ar[1].x++;
        draft.ar = [draft.ar[1], draft.ar[0]]; // swap
        const c = current(draft);
        expect(c).toEqual({
          ar: [{ x: 3 }, { x: 1 }],
        });
        expect(isDraft(c)).toBe(false);
        expect(isDraft(c.ar)).toBe(false);
        expect(isDraft(c.ar[0])).toBe(false);
        expect(isDraft(c.ar[1])).toBe(false);
        expect(c.ar[1]).toBe(base.ar[0]);
      });
    });

    it('handles map - 1', () => {
      const base = new Map([['a', { x: 1 }]]);
      produce(base, (draft) => {
        expect(current(draft)).toBe(base);
        draft.delete('a');
        let c = current(draft);
        expect(current(draft)).not.toBe(base);
        expect(current(draft)).not.toBe(draft);
        expect(c).toEqual(new Map());
        const obj = {};
        draft.set('b', obj);
        expect(c).toEqual(new Map());
        expect(current(draft)).toEqual(new Map([['b', obj]]));
        expect(c).toBeInstanceOf(Map);
      });
    });

    it('handles map - 2', () => {
      const base = new Map([['a', { x: 1 }]]);
      produce(base, (draft) => {
        draft.get('a').x++;
        const c = current(draft);
        expect(c).not.toBe(base);
        expect(c).toEqual(new Map([['a', { x: 2 }]]));
        draft.get('a').x++;
        expect(c).toEqual(new Map([['a', { x: 2 }]]));
      });
    });

    it('handles set', () => {
      const base = new Set([1]);
      produce(base, (draft) => {
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
        [immerable] = true;
        current = 0;

        inc() {
          this.current++;
        }
      }

      const counter1 = new Counter();
      produce(counter1, (draft) => {
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
      });
    });

    it("won't deep copy unchanged values unnecessarily", () => {
      const obj = { k: 42 };
      const base = { x: { y: { z: obj } } };
      produce(base, (draft) => {
        draft.x = { y: { z: obj } };
        const c = current(draft);
        expect(c.x.y.z).toBe(obj);
      });
    });
  });
}
