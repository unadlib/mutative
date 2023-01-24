import { create, safeReturn } from '../src';

test('base', () => {
  const base = 3;
  expect(create(base, () => 4)).toBe(4);
  // @ts-expect-error
  expect(create(base, () => null)).toBe(null);
  expect(create(base, () => undefined)).toBe(3);
  expect(create(base, () => {})).toBe(3);
  expect(create(base, () => safeReturn(undefined))).toBe(undefined);

  expect(create({}, () => undefined)).toEqual({});
  expect(create({}, () => safeReturn(undefined))).toBe(undefined);
  expect(create(3, () => safeReturn(undefined))).toBe(undefined);

  expect(create(() => undefined)({})).toEqual({});
  expect(create(() => safeReturn(undefined))({})).toBe(undefined);
  expect(create(() => safeReturn(undefined))(3)).toBe(undefined);
});

describe.each([{ useSafeReturn: true }, { useSafeReturn: false }])(
  'check Primitive type $useSafeReturn',
  ({ useSafeReturn }) => {
    test(`useSafeReturn ${useSafeReturn}: check Primitive type with returning`, () => {
      [
        -1,
        1,
        0,
        NaN,
        BigInt(1),
        Infinity,
        '',
        'test',
        null,
        false,
        Symbol('foo'),
      ].forEach((value: any) => {
        expect(
          create(value, (draft) => {
            return useSafeReturn ? safeReturn(undefined) : '';
          })
        ).toBe(useSafeReturn ? undefined : '');
      });
    });

    test(`useSafeReturn ${useSafeReturn}: check Primitive type with returning and patches`, () => {
      [
        -1,
        1,
        0,
        NaN,
        BigInt(1),
        Infinity,
        '',
        'test',
        null,
        false,
        undefined,
        Symbol('foo'),
      ].forEach((value: any) => {
        expect(
          create(
            value,
            (draft) => {
              return useSafeReturn ? safeReturn(undefined) : '';
            },
            {
              enablePatches: true,
            }
          )
        ).toEqual([
          useSafeReturn ? undefined : '',
          [{ op: 'replace', path: [], value: useSafeReturn ? undefined : '' }],
          [{ op: 'replace', path: [], value: value }],
        ]);
      });
    });

    test(`useSafeReturn ${useSafeReturn}: check Primitive type with returning, patches and freeze`, () => {
      [
        -1,
        1,
        0,
        NaN,
        BigInt(1),
        Infinity,
        '',
        'test',
        null,
        false,
        undefined,
        Symbol('foo'),
      ].forEach((value: any) => {
        expect(
          create(
            value,
            (draft) => {
              return useSafeReturn ? safeReturn(undefined) : '';
            },
            {
              enableAutoFreeze: true,
              enablePatches: true,
            }
          )
        ).toEqual([
          useSafeReturn ? undefined : '',
          [{ op: 'replace', path: [], value: useSafeReturn ? undefined : '' }],
          [{ op: 'replace', path: [], value: value }],
        ]);
      });
    });

    test(`useSafeReturn ${useSafeReturn}: check Primitive type with returning, patches, freeze and async`, async () => {
      for (const value of [
        -1,
        1,
        0,
        NaN,
        BigInt(1),
        Infinity,
        '',
        'test',
        null,
        false,
        undefined,
        Symbol('foo'),
      ]) {
        await expect(
          await create(
            value,
            async (draft) => {
              return useSafeReturn ? safeReturn(undefined) : '';
            },
            {
              enableAutoFreeze: true,
              enablePatches: true,
            }
          )
        ).toEqual([
          useSafeReturn ? undefined : '',
          [{ op: 'replace', path: [], value: useSafeReturn ? undefined : '' }],
          [{ op: 'replace', path: [], value: value }],
        ]);
      }
    });
  }
);
