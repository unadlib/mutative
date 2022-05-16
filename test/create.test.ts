import { create, isDraft } from '../src';

describe('base', () => {
  test('object', () => {
    const data = {
      foo: {
        bar: 'str',
      },
      foobar: {
        baz: 'str',
      },
    };

    const state = create(data, (draft) => {
      draft.foo.bar = 'new str';
    });
    expect(state).toEqual({
      foo: { bar: 'new str' },
      foobar: { baz: 'str' },
    });
    expect(state).not.toBe(data);
    expect(state.foo).not.toBe(data.foo);
    expect(state.foobar).toBe(data.foobar);
  });

  test('delete key in object', () => {
    const data = {
      foo: {
        bar: {
          b: 'str',
        },
      },
      foobar: {
        bar: 'str',
      },
    };

    const state = create(data, (draft) => {
      draft.foo.bar.b = 'new str';
      // @ts-ignore
      delete draft.foo.bar;
    });
    expect(state).toEqual({ foo: {}, foobar: { bar: 'str' } });
    expect(state).not.toBe(data);
    expect(state.foo).not.toBe(data.foo);
    expect(state.foobar).toBe(data.foobar);
  });

  test('object set a plain object', () => {
    const data = {
      foo: {
        bar: {
          baz: 'baz',
        },
      },
      foobar: {},
    };

    const state = create(data, (draft) => {
      draft.foo.bar = { baz: 'new baz' };
      expect(isDraft(draft.foo.bar)).toBeFalsy();
    });
    expect(state).toEqual({ foo: { bar: { baz: 'new baz' } }, foobar: {} });
  });

  test('map', () => {
    const data = {
      map: new Map(),
      foo: 'bar',
    };

    const state = create(data, (draft) => {
      draft.map.set(1, undefined);
    });
    expect(state).not.toBe(data);
  });

  test('set', () => {
    const data = {
      set: new Set<any>(),
      foo: 'bar',
    };

    const state = create(data, (draft) => {
      draft.set.add(undefined);
    });
    expect(state).not.toBe(data);
  });
});

describe('no updates', () => {
  test('object', () => {
    const data = {
      foo: {
        bar: 'str',
      },
      foobar: {
        baz: 'str',
      },
    };

    const state = create(data, (draft) => {
      draft.foo.bar = 'new str';
      // @ts-ignore
      delete draft.foobar.baz;
      draft.foo.bar = 'str';
      draft.foobar.baz = 'str';
    });
    expect(state).toBe(data);
  });

  test('array with setter', () => {
    const data = {
      arr: ['str'] as any,
      foo: 'bar',
    };

    const state = create(data, (draft) => {
      draft.arr[0] = 'new str';
      draft.arr[0] = 'str';
    });
    expect(state).toBe(data);
  });

  test('array with push and pop', () => {
    const data = {
      arr: ['str'] as any,
      foo: 'bar',
    };

    const state = create(data, (draft) => {
      draft.arr.push('new str');
      draft.arr.pop();
    });
    expect(state).toBe(data);
  });

  test('array with push and pop', () => {
    const data = {
      arr: ['str'] as any,
      foo: 'bar',
    };

    const state = create(data, (draft) => {
      draft.arr.push('new str', 'new str1');
      draft.arr.pop();
      draft.arr.pop();
    });
    expect(state).toBe(data);
  });

  test('case1 for array with splice', () => {
    const data = {
      arr: ['a', 'b', 'c'] as any,
      foo: 'bar',
    };

    const state = create(data, (draft) => {
      const result = draft.arr.splice(1, 1, 'new str', 'new str1');
      draft.arr.splice(1, 2, ...result);
    });
    expect(state).toBe(data);
  });

  test('case2 for array with splice', () => {
    const data = {
      arr: ['a', 'b', 'c'] as any,
      foo: 'bar',
    };

    const state = create(data, (draft) => {
      const result = draft.arr.splice(1, 1);
      draft.arr.splice(1, 0, ...result);
    });
    expect(state).toBe(data);
  });

  test('array with reverse', () => {
    const data = {
      arr: ['1', '3', '2'] as any,
      foo: 'bar',
    };

    const state = create(data, (draft) => {
      draft.arr.reverse();
      draft.arr.reverse();
    });
    expect(state).toBe(data);
  });

  test('array with shift and unshift', () => {
    const data = {
      arr: ['1'] as any,
      foo: 'bar',
    };

    const state = create(data, (draft) => {
      draft.arr.unshift('new str');
      draft.arr.shift();
    });
    expect(state).toBe(data);
  });

  test('2 items array with shift and unshift', () => {
    const data = {
      arr: ['1'] as any,
      foo: 'bar',
    };

    const state = create(data, (draft) => {
      draft.arr.unshift('new str', 'new str1');
      draft.arr.shift();
      draft.arr.shift();
    });
    expect(state).toBe(data);
  });

  test('set about new value operations', () => {
    const data = {
      set: new Set([{}]),
      foo: 'bar',
    };

    const state = create(data, (draft) => {
      const a = {};
      draft.set.add(a);
      draft.set.delete(a);
    });
    expect(state).toBe(data);
  });

  test('set with old value operations', () => {
    const a = {};
    const data = {
      set: new Set([a]),
      foo: 'bar',
    };

    const state = create(data, (draft) => {
      draft.set.delete(a);
      draft.set.add(a);
    });
    expect(state).toBe(data);
  });

  test('map with new value operations', () => {
    const data = {
      map: new Map([
        [1, { a: { b: 1 } }],
        [2, { a: { b: 2 } }],
        [3, { a: { b: 3 } }],
      ]),
      foo: 'bar',
    };

    const state = create(data, (draft) => {
      draft.map.set(4, {} as any);
      draft.map.delete(4);
    });
    expect(state).toBe(data);
  });

  test('map with old value operations', () => {
    const data = {
      map: new Map([
        [1, { a: { b: 1 } }],
        [2, { a: { b: 2 } }],
        [3, { a: { b: 3 } }],
      ]),
      foo: 'bar',
    };

    const state = create(data, (draft) => {
      draft.map.get(1)!.a.b = 2;
      draft.map.get(1)!.a.b = 1;
    });
    expect(state).toBe(data);
  });
});

describe('shared ref', () => {
  test('object', () => {
    const foobar = {
      foo: 'foo',
    };
    const data = {
      foo: {
        bar: 'str',
        foobar,
      },
      foobar,
    };

    const state = create(data, (draft) => {
      draft.foobar.foo = 'new str';
    });
    expect(state).toEqual({
      foo: { bar: 'str', foobar: { foo: 'foo' } },
      foobar: { foo: 'new str' },
    });
    expect(state).not.toBe(data);
    expect(state.foo).toBe(data.foo);
    expect(state.foobar).not.toBe(data.foobar);
  });
});

describe('async mutation', () => {
  test('object', async () => {
    const data = {
      foo: {
        bar: 'str',
      },
      foobar: {},
    };

    const state = await create(data, async (draft) => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      draft.foo.bar = 'new str';
    });
    expect(state).toEqual({ foo: { bar: 'new str' }, foobar: {} });
    expect(state).not.toBe(data);
    expect(state.foo).not.toBe(data.foo);
    expect(state.foobar).toBe(data.foobar);
  });
});

// test('nothing change object with ref', () => {
//   const data = {
//     foo: {
//       bar: 'str',
//     },
//     foobar: {
//       baz: 'str',
//     },
//   };

//   const state = create(data, (draft: any) => {
//     draft.foobar.foo = draft.foo;
//     draft.foo.bar = 'new str';
//     delete draft.foobar.foo;
//   });
//   expect(state).toEqual({
//     foo: { bar: 'new str' },
//     foobar: {
//       baz: 'str',
//     },
//   });
//   expect(state).not.toBe(data);
//   expect(state.foo).not.toBe(data.foo);
//   expect(state.foobar).toBe(data.foobar);
// });
