/* eslint-disable no-self-assign */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable no-param-reassign */
import { create } from '../src';

test('works with interweaved Immer instances with strict mode and disable Freeze', () => {
  const base = {};
  const result = create(
    base,
    (s1) => {
      const f = create(
        { s1 },
        (s2) => {
          s2.s1 = s2.s1;
        },
        {
          enableAutoFreeze: false,
        }
      );
      return f;
    },
    {
      enableAutoFreeze: false,
      strict: true,
    }
  );
  // @ts-expect-error
  expect(result.s1).toBe(base);
});
