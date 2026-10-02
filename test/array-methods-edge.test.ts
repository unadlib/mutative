/* eslint-disable @typescript-eslint/no-explicit-any */
import { apply, create } from '../src';

describe('native array method boundaries', () => {
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
      expect(state).toStrictEqual([
        { id: 3 },
        undefined,
        { id: 1 },
        { id: 2 },
      ]);
      expect(apply(base, patches)).toStrictEqual(state);
      expect(apply(state, inverse)).toStrictEqual(base);
      expect(base).toStrictEqual([{ id: 1 }, { id: 2 }]);
    }
  );
});
