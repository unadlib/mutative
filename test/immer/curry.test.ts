'use strict';
import { create } from '../../src';

runTests('proxy', true);
// runTests("es5", false)

function runTests(name: any, useProxies: any) {
  describe('curry - ' + name, () => {
    // beforeAll(() => {
    // 	setUseProxies(useProxies)
    // })

    it('should check arguments', () => {
      // @ts-ignore
      expect(() => create()).toThrowErrorMatchingSnapshot();
      // ! different from immer
      expect(() => create({})).not.toThrowError();
      // ! different from immer
      expect(() => create({}, {})).not.toThrowError();
      // @ts-ignore
      expect(() => create({}, () => {}, [])).toThrowErrorMatchingSnapshot();
    });

    it('should support currying', () => {
      const state: { index?: number }[] = [{}, {}, {}];
      const mapper = create((item: { index?: number }, index: number) => {
        item.index = index;
      });

      expect(state.map(mapper)).not.toBe(state);
      expect(state.map(mapper)).toEqual([
        { index: 0 },
        { index: 1 },
        { index: 2 },
      ]);
      expect(state).toEqual([{}, {}, {}]);
    });

    it('should support returning new states from curring', () => {
      const reducer = create((item: { index?: number }, index: number) => {
        if (!item) {
          // @ts-ignore
          item.hello = 'world';
          return;
        }
        item.index = index;
      });

      // ! different from mutative
      // @ts-ignore
      expect(() => reducer(undefined, 3)).toThrowError();
      expect(reducer({}, 3)).toEqual({ index: 3 });
    });

    it('should support passing an initial state as second argument', () => {
      const reducer = create(
        (item: { index?: number }, index: number) => {
          item.index = index;
        }
        // { hello: 'world' }
      );
      // ! different from immer
      // @ts-ignore
      expect(reducer({ hello: 'world' }, 3)).toEqual({ hello: 'world', index: 3 });
      expect(reducer({}, 3)).toEqual({ index: 3 });
      // ! different from immer
      // @ts-ignore
      expect(reducer({ hello: 'world' })).toEqual({ hello: 'world', index: undefined });
    });

    it('can has fun with change detection', () => {
      const spread = create((target: any, source: any) => {
        Object.assign(target, source);
      });

      const base = {
        x: 1,
        y: 1,
      };

      expect({ ...base }).not.toBe(base);
      expect(spread(base, {})).toBe(base);
      expect(spread(base, { y: 1 })).toBe(base);
      expect(spread(base, { ...base })).toBe(base);
      expect(spread(base, { ...base, y: 2 })).not.toBe(base);
      expect(spread(base, { ...base, y: 2 })).toEqual({ x: 1, y: 2 });
      expect(spread(base, { z: 3 })).toEqual({ x: 1, y: 1, z: 3 });
      expect(spread(base, { y: 1 })).toBe(base);
    });
  });

  it('support currying for Patches', () => {
    const increment = create(
      (draft: { x: number }, delta: number) => {
        draft.x += delta;
      },
      {
        enablePatches: true,
      }
    );

    expect(increment({ x: 5 }, 2)).toEqual([
      { x: 7 },
      [
        {
          op: 'replace',
          path: ['x'],
          value: 7,
        },
      ],
      [
        {
          op: 'replace',
          path: ['x'],
          value: 5,
        },
      ],
    ]);
  });
}
