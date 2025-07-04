// @ts-nocheck
import {
  produce,
  produceWithPatches,
  enablePatches,
} from '../src/immer';

enablePatches();

runTests('proxy', true);

function runTests(name) {
  describe('curry - ' + name, () => {
    it('should check arguments', () => {
      expect(() => produce()).toThrowErrorMatchingSnapshot();
      // !!! This is different from immer
      expect(() => produce({})).not.toThrow();
      // !!! This is different from immer
      expect(() => produce({}, {})).not.toThrow();
      expect(() => produce({}, () => {}, [])).toThrowErrorMatchingSnapshot();
    });

    it('should support currying', () => {
      const state = [{}, {}, {}];
      const mapper = produce((item, index) => {
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
      const reducer = produce((item, index) => {
        if (!item) {
          return { hello: 'world' };
        }
        item.index = index;
      });

      expect(reducer(undefined, 3)).toEqual({ hello: 'world' });
      expect(reducer({}, 3)).toEqual({ index: 3 });
    });

    it('should support passing an initial state as second argument', () => {
      // !!! This is different from immer
      const reducer = (state = { hello: 'world' }, index) =>
        produce(state, (item) => {
          item.index = index;
        });

      expect(reducer(undefined, 3)).toEqual({ hello: 'world', index: 3 });
      expect(reducer({}, 3)).toEqual({ index: 3 });
      expect(reducer()).toEqual({ hello: 'world', index: undefined });
    });

    it('can has fun with change detection', () => {
      const spread = produce(Object.assign);

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

  it('support currying for produceWithPatches', () => {
    const increment = produceWithPatches((draft, delta) => {
      draft.x += delta;
    });

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
