/* eslint-disable symbol-description */
/* eslint-disable object-shorthand */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable no-unused-expressions */
/* eslint-disable arrow-body-style */
/* eslint-disable no-self-assign */
/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { create, isDraft, rawReturn } from '../src';

afterEach(() => {
  jest.clearAllMocks();
});

test('base', () => {
  const base = 3;
  expect(create(base, () => 4)).toBe(4);
  // @ts-expect-error
  expect(create(base, () => null)).toBe(null);
  expect(create(base, () => undefined)).toBe(3);
  expect(create(base, () => {})).toBe(3);
  expect(create(base, () => rawReturn(undefined))).toBe(undefined);

  expect(create({}, () => undefined)).toEqual({});
  expect(create({}, () => rawReturn(undefined))).toBe(undefined);
  expect(create(3, () => rawReturn(undefined))).toBe(undefined);

  expect(create(() => undefined)({})).toEqual({});
  expect(create(() => rawReturn(undefined))({})).toBe(undefined);
  expect(create(() => rawReturn(undefined))(3)).toBe(undefined);
});

test('base enableAutoFreeze: true', () => {
  create(
    { a: { b: 1 } },
    (draft) => {
      return {
        a: draft.a,
      };
    },
    { enableAutoFreeze: true }
  );
});

test('base enableAutoFreeze: true - with rawReturn()', () => {
  expect(() => {
    create(
      { a: { b: 1 } },
      (draft) => {
        return rawReturn({
          a: draft.a,
        });
      },
      { enableAutoFreeze: true }
    );
  }).toThrowError();
});

describe.each([{ useRawReturn: true }, { useRawReturn: false }])(
  'check Primitive type $useRawReturn',
  ({ useRawReturn }) => {
    test(`useRawReturn ${useRawReturn}: check Primitive type with returning`, () => {
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
            return useRawReturn ? rawReturn(undefined) : '';
          })
        ).toBe(useRawReturn ? undefined : '');
      });
    });

    test(`useRawReturn ${useRawReturn}: check Primitive type with returning and patches`, () => {
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
              return useRawReturn ? rawReturn(undefined) : '';
            },
            {
              enablePatches: true,
            }
          )
        ).toEqual([
          useRawReturn ? undefined : '',
          [{ op: 'replace', path: [], value: useRawReturn ? undefined : '' }],
          [{ op: 'replace', path: [], value: value }],
        ]);
      });
    });

    test(`useRawReturn ${useRawReturn}: check Primitive type with returning, patches and freeze`, () => {
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
              return useRawReturn ? rawReturn(undefined) : '';
            },
            {
              enableAutoFreeze: true,
              enablePatches: true,
            }
          )
        ).toEqual([
          useRawReturn ? undefined : '',
          [{ op: 'replace', path: [], value: useRawReturn ? undefined : '' }],
          [{ op: 'replace', path: [], value: value }],
        ]);
      });
    });

    test(`useRawReturn ${useRawReturn}: check Primitive type with returning, patches, freeze and async`, async () => {
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
              return useRawReturn ? rawReturn(undefined) : '';
            },
            {
              enableAutoFreeze: true,
              enablePatches: true,
            }
          )
        ).toEqual([
          useRawReturn ? undefined : '',
          [{ op: 'replace', path: [], value: useRawReturn ? undefined : '' }],
          [{ op: 'replace', path: [], value: value }],
        ]);
      }
    });
  }
);

test('error args', () => {
  expect(() =>
    // @ts-expect-error
    create(3, () => rawReturn(undefined, undefined))
  ).toThrowErrorMatchingInlineSnapshot(
    `"rawReturn() must be called with one argument."`
  );

  expect(() =>
    // @ts-expect-error
    create({}, () => rawReturn())
  ).toThrowErrorMatchingInlineSnapshot(
    `"rawReturn() must be called with a value."`
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
    create({}, () => rawReturn(value));
    expect(logSpy).toHaveBeenCalledWith(
      'rawReturn() must be called with an object or `undefined`, other types do not need to be returned via rawReturn().'
    );
    logSpy.mockClear();
  });

  logSpy.mockReset();
});

test('check warning rawReturn() in strict mode', () => {
  class Foo {
    a?: any;
  }
  const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  [
    (draft: any) => {
      return rawReturn({
        a: draft.a,
      });
    },
    (draft: any) => {
      return rawReturn([draft.a]);
    },
    (draft: any) => {
      return rawReturn(
        new Map([
          [
            1,
            {
              a: draft.a,
            },
          ],
        ])
      );
    },
    (draft: any) => {
      return rawReturn(
        new Set([
          1,
          {
            a: draft.a,
          },
        ])
      );
    },
    (draft: any) => {
      const foo = new Foo();
      foo.a = draft.a;
      return rawReturn(foo);
    },
  ].forEach((callback: any) => {
    create({ a: { b: 1 } }, callback, {
      strict: true,
    });
    expect(warnSpy).toHaveBeenCalledWith(
      `The return value contains drafts, please don't use 'rawReturn()' to wrap the return value.`
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
test('mix more type draft without rawReturn()', () => {
  [
    (draft: any) => ({
      a: {
        b: draft.a,
      },
    }),
    (draft: any) => [{ c: draft.a }],
    (draft: any) => new Map([[1, draft.a]]),
    (draft: any) => new Set([1, draft.a]),
  ].forEach((callback: any) => {
    expect(() => create({ a: { b: 1 } }, callback)).not.toThrowError();
  });
});

test('mix more type draft with rawReturn()', () => {
  [
    (draft: any) =>
      rawReturn({
        a: {
          b: draft.a,
        },
      }),
    (draft: any) => rawReturn([{ c: draft.a }]),
    (draft: any) => rawReturn(new Map([[1, draft.a]])),
    (draft: any) => rawReturn(new Set([1, draft.a])),
  ].forEach((callback: any) => {
    expect(() =>
      expect(create({ a: { b: 1 } }, callback)).toEqual({})
    ).toThrowError();
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
      return Object.assign(component, {
        [key]: draft,
      }) as any;
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
    return f;
  });
  // @ts-expect-error
  expect(result.s1).toBe(base);
});

test('deep draft', () => {
  const state = create({ a: { b: { c: 1 } } }, (draft) => {
    draft.a.b.c;
    return {
      a: draft.a,
    };
  });
  expect(state).toEqual({ a: { b: { c: 1 } } });
});

test('case', () => {
  const baseState = { foo: 'bar' };
  const state = create(baseState as { foo: string } | undefined, (draft) => {
    return rawReturn(undefined);
  });
  expect(state).toBe(undefined);
});

test('does not finalize upvalue drafts', () => {
  create({ a: {}, b: {} }, (parent) => {
    expect(create({}, () => parent)).toBe(parent);
    // @ts-ignore
    parent.x; // Ensure proxy not revoked.

    // @ts-ignore
    expect(create({}, () => [parent])[0]).toBe(parent);
    // @ts-ignore
    parent.x; // Ensure proxy not revoked.

    expect(create({}, () => parent.a)).toBe(parent.a);
    // @ts-ignore

    parent.a.x; // Ensure proxy not revoked.
    // @ts-ignore
    // Modified parent test
    parent.c = 1;
    // @ts-ignore
    expect(create({}, () => [parent.b])[0]).toBe(parent.b);
    // @ts-ignore
    parent.b.x; // Ensure proxy not revoked.
  });
});

test('mixed draft', () => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  const baseState = { a: 1, b: { c: 1 } };
  const state = create(baseState, (draft) => {
    if (draft.b.c === 1) {
      return {
        ...draft,
        a: 2,
      };
    }
  });
  expect(state).toEqual({ a: 2, b: { c: 1 } });
  expect(isDraft(state.b)).toBeFalsy();
  expect(console.warn).toBeCalledTimes(0);
});

test('mixed draft with rawReturn()', () => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  const baseState = { a: 1, b: { c: 1 } };
  const state = create(baseState, (draft) => {
    if (draft.b.c === 1) {
      return rawReturn({
        ...draft,
        a: 2,
      });
    }
  });
  expect(() => {
    JSON.stringify(state);
  }).toThrowError();
  expect(() => {
    isDraft(state.b);
  }).toThrowError();
  expect(console.warn).toBeCalledTimes(0);
});

test('mixed draft with rawReturn() and strict mode', () => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  const baseState = { a: 1, b: { c: 1 } };
  const state = create(
    baseState,
    (draft) => {
      if (draft.b.c === 1) {
        return rawReturn({
          ...draft,
          a: 2,
        });
      }
    },
    {
      strict: true,
    }
  );
  expect(state).toEqual({ a: 2, b: { c: 1 } });
  expect(isDraft(state.b)).toBeFalsy();
  expect(console.warn).toBeCalledTimes(1);
  expect(console.warn).toBeCalledWith(
    `The return value contains drafts, please don't use 'rawReturn()' to wrap the return value.`
  );
});

test('no mixed draft with strict mode', () => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  const baseState = { a: 1, b: { c: 1 } };
  const state = create(
    baseState,
    (draft) => {
      if (draft.b.c === 1) {
        return {
          ...baseState,
          a: 2,
        };
      }
    },
    {
      strict: true,
    }
  );
  expect(state).toEqual({ a: 2, b: { c: 1 } });
  expect(isDraft(state.b)).toBeFalsy();
  expect(console.warn).toBeCalledTimes(1);
  expect(console.warn).toBeCalledWith(
    `The return value does not contain any draft, please use 'rawReturn()' to wrap the return value to improve performance.`
  );
});
