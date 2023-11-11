'use strict';
import { create } from '../../src';

const isProd = process.env.NODE_ENV === 'production';

runTests('proxy', true);
// runTests('es5', false);

function runTests(name: any, useProxies: any) {
  describe('manual - ' + name, () => {
    // beforeAll(() => {
    //   setUseProxies(useProxies);
    // });

    it('should check arguments', () => {
      // @ts-ignore
      expect(() => create(3)).toThrowErrorMatchingSnapshot();
      const buf = Buffer.from([]);
      expect(() => create(buf)).toThrowErrorMatchingSnapshot();
    });

    it('should support manual drafts', () => {
      const state = [{}, {}, {}];

      const [draft, finalize] = create(state);
      draft.forEach((item, index) => {
        // @ts-ignore
        item.index = index;
      });

      const result = finalize();

      expect(result).not.toBe(state);
      expect(result).toEqual([{ index: 0 }, { index: 1 }, { index: 2 }]);
      expect(state).toEqual([{}, {}, {}]);
    });

    if (!isProd)
      it('cannot modify after finish', () => {
        const state = { a: 1 };

        const [draft, finalize] = create(state);
        draft.a = 2;
        expect(finalize()).toEqual({ a: 2 });
        expect(() => {
          draft.a = 3;
        }).toThrowErrorMatchingSnapshot();
      });

    it('should support patches drafts', () => {
      const state = { a: 1 };

      const [draft, finalize] = create(state);
      draft.a = 2;
      // @ts-ignore
      draft.b = 3;

      // const listener = jest.fn();
      const result = finalize();

      expect(result).not.toBe(state);
      expect(result).toEqual({ a: 2, b: 3 });
      // expect(listener.mock.calls).toMatchSnapshot();
    });

    it('should handle multiple create draft calls', () => {
      const state = { a: 1 };

      const [draft, finalize] = create(state);
      draft.a = 2;

      const [draft2, finalize2] = create(state);
      // @ts-ignore
      draft2.b = 3;

      const result = finalize();

      expect(result).not.toBe(state);
      expect(result).toEqual({ a: 2 });

      draft2.a = 4;
      const result2 = finalize2();
      expect(result2).not.toBe(result);
      expect(result2).toEqual({ a: 4, b: 3 });
    });

    it('combines with produce - 1', () => {
      const state = { a: 1 };

      const [draft, finalize] = create(state);
      draft.a = 2;
      const res1 = create(draft, (d) => {
        // @ts-ignore
        d.b = 3;
      });
      // @ts-ignore
      draft.b = 4;
      const res2 = finalize();
      expect(res1).toEqual({ a: 2, b: 3 });
      expect(res2).toEqual({ a: 2, b: 4 });
    });

    it('combines with produce - 2', () => {
      const state = { a: 1 } as any;

      const res1 = create(state, (draft) => {
        draft.b = 3;
        const [draft2, finalize] = create(draft);
        draft.c = 4;
        draft2.d = 5;
        const res2 = finalize();
        expect(res2).toEqual({
          a: 1,
          b: 3,
          d: 5,
        });
        draft.d = 2;
      });
      expect(res1).toEqual({
        a: 1,
        b: 3,
        c: 4,
        d: 2,
      });
    });

    it('should not finish drafts from produce', () => {
      create({ x: 1 }, (draft) => {
        expect(() => {
          const [_, finalize] = create(draft);
          finalize();
          // ! it's different from mutative
        }).not.toThrowError();
      });
    });

    it('should not finish twice', () => {
      const [draft, finalize] = create({ a: 1 });
      draft.a++;
      finalize();
      expect(() => finalize()).toThrowErrorMatchingSnapshot();
    });
  });
}
