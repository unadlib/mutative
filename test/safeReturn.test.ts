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

test('base enableAutoFreeze: true', () => {
  create(
    { a: { b: 1 } },
    (draft) => {
      return safeReturn({
        a: draft.a,
      });
    },
    { enableAutoFreeze: true }
  );
});

test('base enableAutoFreeze: true - without safeReturn()', () => {
  expect(() => {
    create(
      { a: { b: 1 } },
      (draft) => {
        return {
          a: draft.a,
        };
      },
      { enableAutoFreeze: true }
    );
  }).toThrowError();
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
        true,
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
        true,
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
        true,
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
        true,
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

test('error args', () => {
  expect(() =>
    // @ts-expect-error
    create(3, () => safeReturn(undefined, undefined))
  ).toThrowErrorMatchingInlineSnapshot(
    `"safeReturn() must be called with one argument."`
  );

  expect(() =>
    // @ts-expect-error
    create({}, () => safeReturn())
  ).toThrowErrorMatchingInlineSnapshot(
    `"safeReturn() must be called with a value."`
  );

  const logSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

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
    true,
    Symbol('foo'),
  ].forEach((value: any) => {
    create({}, () => safeReturn(value));
    expect(logSpy).toHaveBeenCalledWith(
      'safeReturn() must be called with an object or undefined, other types do not need to be returned via safeReturn().'
    );
    logSpy.mockClear();
  });

  logSpy.mockReset();
});

test('check warning in strict mode', () => {
  class Foo {
    a?: any;
  }
  const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  [
    (draft: any) => {
      return {
        a: draft.a,
      };
    },
    (draft: any) => {
      return [draft.a];
    },
    (draft: any) => {
      return new Map([
        [
          1,
          {
            a: draft.a,
          },
        ],
      ]);
    },
    (draft: any) => {
      return new Set([
        1,
        {
          a: draft.a,
        },
      ]);
    },
    (draft: any) => {
      const foo = new Foo();
      foo.a = draft.a;
      return foo;
    },
  ].forEach((callback: any) => {
    create({ a: { b: 1 } }, callback, {
      strict: true,
    });
    expect(warnSpy).toHaveBeenCalledWith(
      `The return value contains drafts, please use safeReturn() to wrap the return value.`
    );
    warnSpy.mockClear();
  });
  warnSpy.mockReset();
});

test('return parent draft', () => {
  expect(
    create({ a: 1 }, (draft) => {
      const _draft = create({}, () => draft) as any;
      _draft.a = 2;
      return _draft;
    })
  ).toEqual({ a: 2 });
});

test('mix more type draft', () => {
  [
    (draft: any) =>
      safeReturn({
        a: {
          b: draft.a,
        },
      }),
    (draft: any) => safeReturn([{ c: draft.a }]),
    (draft: any) => safeReturn(new Map([[1, draft.a]])),
    (draft: any) => safeReturn(new Set([1, draft.a])),
  ].forEach((callback: any) => {
    expect(() => create({ a: { b: 1 } }, callback)).not.toThrowError();
  });
});

test(`safe returning with non-enumerable or symbolic properties`, () => {
  const component = {};
  Object.defineProperty(component, 'state', {
    value: { x: 1 },
    enumerable: false,
    writable: true,
    configurable: true,
  });

  const state = {
    x: 2,
  };

  const key = Symbol();
  const state2: any = create(
    state,
    (draft) => {
      return safeReturn(
        Object.assign(component, {
          [key]: draft,
        })
      ) as any;
    },
    {
      enableAutoFreeze: true,
    }
  );

  expect(Object.isFrozen(state2)).toBeTruthy();
  // Do not auto freeze non-enumerable or symbolic properties
  expect(Object.isFrozen(state2.state)).toBeFalsy();
  expect(Object.isFrozen(state2[key])).toBeFalsy();

  // @ts-expect-error
  expect(state2.state).toBe(component.state);
  expect(state2[key]).toBe(state);
});

test('works with interweaved Immer instances with disable Freeze', () => {
  const base = {};
  const result = create(base, (s1) => {
    const f = create(
      { s1 },
      (s2) => {
        s2.s1 = s2.s1;
      },
      {
        enableAutoFreeze: false,
      }
    );
    return safeReturn(f);
  });
  // @ts-expect-error
  expect(result.s1).toBe(base);
});

test('deep draft', () => {
  const state = create({ a: { b: { c: 1 } } }, (draft) => {
    draft.a.b.c;
    return safeReturn({
      a: draft.a,
    });
  });
  expect(state).toEqual({ a: { b: { c: 1 } } });
});
