/* eslint-disable prefer-template */
/* eslint-disable no-unused-expressions */
/* eslint-disable arrow-body-style */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable no-param-reassign */
import { create, original, current, apply, isDraftable, isDraft } from '../src';
import { PROXY_DRAFT } from '../src/constant';

test('check object type', () => {
  const data = {};

  create(data, (draft) => {
    expect(typeof draft === 'object').toBeTruthy();
    expect(
      Object.prototype.toString.call(draft) === '[object Object]'
    ).toBeTruthy();
  });
});

test('check array type', () => {
  const data: any[] = [1];

  create(data, (draft) => {
    expect(Array.isArray(draft)).toBeTruthy();
    expect(
      Object.prototype.toString.call(draft) === '[object Array]'
    ).toBeTruthy();
    expect(draft.length).toBe(1);
  });
});

test('no update object with NaN', () => {
  const data: {
    n?: undefined;
  } = {};

  const state = create(data, (draft) => {
    draft.n = undefined;
  });
  expect(state).not.toBe(data);
});

test('no update object with NaN', () => {
  const data = { n: NaN };

  const state = create(data, (draft) => {
    draft.n = NaN;
  });
  expect(state).toBe(data);
});

test('check array options error', () => {
  const data = [1, 2, 3];
  expect(() => {
    create(data, (draft) => {
      // @ts-expect-error
      draft.foo = 'new str';
    });
  }).toThrowError(
    `Only supports setting array indices and the 'length' property.`
  );
});

test('object', () => {
  const data = {
    foo: {
      bar: 'str',
    },
    foobar: {},
  };

  const state = create(data, (draft) => {
    draft.foo.bar = 'new str';
  });
  expect(state).toEqual({ foo: { bar: 'new str' }, foobar: {} });
  expect(state).not.toBe(data);
  expect(state.foo).not.toBe(data.foo);
  expect(state.foobar).toBe(data.foobar);
});

test('object delete', () => {
  const data = {
    foobar: {
      foo: { bar: 'new str' },
    },
  } as any;

  const state = create(data, (draft) => {
    delete draft.foobar.foo;
  });
  expect(state).toEqual({
    foobar: {},
  });
  expect(state).not.toBe(data);
  expect(state.foo).toBe(data.foo);
});

test('nothing change object with ref', () => {
  const data: any = {
    foo: {
      bar: 'str',
    },
    foobar: {
      baz: 'str',
    },
  };

  const [state, patches, inversePatches] = create(
    data,
    (draft) => {
      draft.foo.bar1 = {};
      delete draft.foo.bar1;
    },
    {
      enablePatches: true,
    }
  );
  expect(state).toEqual({
    foo: {
      bar: 'str',
    },
    foobar: {
      baz: 'str',
    },
  });
  expect(state === data).toBe(false);
  expect(state.foo === data.foo).toBe(false);
  expect(state.foobar === data.foobar).toBe(true);
  expect(apply(data, patches)).toEqual(state);
  expect(apply(state, inversePatches)).toEqual(data);
});

test('enablePatches, no update', () => {
  const data = { a: { b: { c: 1 }, arr: [] } };
  const [state, patches, inversePatches] = create(
    data,
    (draft: any) => {
      draft.x = draft.a.b;
      delete draft.x;
    },
    {
      enablePatches: true,
    }
  );
  expect(state).toEqual(data);
  expect(patches).toEqual([]);
  expect(inversePatches).toEqual([]);
});

test('object with share ref', () => {
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

test('object with HOF', () => {
  const data = {
    foo: {
      bar: 'str',
    },
    foobar: {},
  };

  const update = (baseState: typeof data) => {
    return create(baseState, (draft) => {
      draft.foo.bar = 'new str';
    });
  };
  const state = update(data);
  expect(state).toEqual({ foo: { bar: 'new str' }, foobar: {} });
  expect(state).not.toBe(data);
  expect(state.foo).not.toBe(data.foo);
  expect(state.foobar).toBe(data.foobar);
});

test('object with original', () => {
  const data = {
    foo: {
      bar: 'str',
    },
    foobar: {},
  };

  const state = create(data, (draft) => {
    draft.foo.bar = 'new str';
    expect(draft.foo).not.toBe(original(draft.foo));
    expect(original(draft.foo)).toBe(data.foo);
  });
  expect(state).toEqual({ foo: { bar: 'new str' }, foobar: {} });
  expect(state).not.toBe(data);
  expect(state.foo).not.toBe(data.foo);
  expect(state.foobar).toBe(data.foobar);
});

test('object with async mutation', async () => {
  const data = {
    foo: {
      bar: 'str',
    },
    foobar: {},
  };

  const state = await create(data, async (draft) => {
    draft.foo.bar = 'new str';
  });
  expect(state).toEqual({ foo: { bar: 'new str' }, foobar: {} });
  expect(state).not.toBe(data);
  expect(state.foo).not.toBe(data.foo);
  expect(state.foobar).toBe(data.foobar);
});

test('create with object', () => {
  const data = {
    foo: {
      bar: 'str',
    },
    foobar: {},
  };

  const [draft, finalize] = create(data);
  draft.foo.bar = 'new str';
  const state = finalize();
  expect(state).toEqual({ foo: { bar: 'new str' }, foobar: {} });
  expect(state).not.toBe(data);
  expect(state.foo).not.toBe(data.foo);
  expect(state.foobar).toBe(data.foobar);
});

test('no updates for object', () => {
  const data = {
    foo: {
      bar: 'str',
    },
    foobar: {},
  };

  const state = create(data, (draft) => {
    draft.foo.bar = 'new str';
    draft.foo.bar = 'str';
  });
  expect(state).toEqual(data);
});

test('no update for array', () => {
  const data = {
    arr: ['str'] as any,
    foo: 'bar',
  };

  const state = create(data, (draft) => {
    draft.arr[0] = 'new str';
    draft.arr[0] = 'str';
  });
  expect(state).toEqual(data);
});

test('no update for array with push and pop', () => {
  const data = {
    arr: ['str'] as any,
    foo: 'bar',
  };

  const state = create(data, (draft) => {
    draft.arr.push('new str');
    draft.arr.pop();
  });
  expect(state).toEqual(data);
});

test('no update 2 items for array with push and pop', () => {
  const data = {
    arr: ['str'] as any,
    foo: 'bar',
  };

  const state = create(data, (draft) => {
    draft.arr.push('new str', 'new str1');
    draft.arr.pop();
    draft.arr.pop();
  });
  expect(state).toEqual(data);
});

test('no update for array with splice', () => {
  const data = {
    arr: ['a', 'b', 'c'] as any,
    foo: 'bar',
  };

  const state = create(data, (draft) => {
    const result = draft.arr.splice(1, 1, 'new str', 'new str1');
    draft.arr.splice(1, 2, ...result);
  });
  expect(state).toEqual(data);
});

test('no update for array with splice', () => {
  const data = {
    arr: ['a', 'b', 'c'] as any,
    foo: 'bar',
  };

  const state = create(data, (draft) => {
    const result = draft.arr.splice(1, 1);
    draft.arr.splice(1, 0, ...result);
  });
  expect(state).toEqual(data);
});

test('no update for array with reverse', () => {
  const data = {
    arr: ['1', '3', '2'] as any,
    foo: 'bar',
  };

  const state = create(data, (draft) => {
    draft.arr.reverse();
    draft.arr.reverse();
  });
  expect(state).toEqual(data);
});

test('no update for array with shift and unshift', () => {
  const data = {
    arr: ['1'] as any,
    foo: 'bar',
  };

  const state = create(data, (draft) => {
    draft.arr.unshift('new str');
    draft.arr.shift();
  });
  expect(state).toEqual(data);
});

test('no update 2 items for array with shift and unshift', () => {
  const data = {
    arr: ['1'] as any,
    foo: 'bar',
  };

  const state = create(data, (draft) => {
    draft.arr.unshift('new str', 'new str1');
    draft.arr.shift();
    draft.arr.shift();
  });
  expect(state).toEqual(data);
});

test('base root set', () => {
  const data = new Set([{ a: 1 }, { a: 2 }]);

  const state = create(data, (draft) => {
    draft.values().next().value.a = 3;
  });

  expect(state).not.toBe(data);
  expect(Array.from(state)[0]).not.toBe(Array.from(data)[0]);
  expect(Array.from(state)[1]).toBe(Array.from(data)[1]);
});

test('base set', () => {
  const data = {
    set: new Set([{ a: 1 }, { a: 2 }]),
    foo: 'bar',
  };

  const state = create(data, (draft) => {
    draft.set.values().next().value.a = 3;
  });

  expect(state).not.toBe(data);
  expect(state.foo).toBe(data.foo);
  expect(state.set).not.toBe(data.set);
  expect(Array.from(state.set)[0]).not.toBe(Array.from(data.set)[0]);
  expect(Array.from(state.set)[1]).toBe(Array.from(data.set)[1]);
});

test('update for set', () => {
  const data = {
    set: new Set([{}]),
    foo: 'bar',
  };

  const state = create(data, (draft) => {
    const a = {};
    draft.set.add(a);
    draft.set.delete(a);
  });
  expect(state).not.toBe(data);
  expect(state).toEqual(data);
});

test('delete for set', () => {
  const a = {};
  const data = {
    set: new Set([a]),
    foo: 'bar',
  };

  const state = create(data, (draft) => {
    draft.set.delete(a);
  });
  expect(state.set.size).toBe(0);
});

test('delete for set', () => {
  const a = {};
  const data = {
    set: new Set([a]),
    foo: 'bar',
  };

  const state = create(data, (draft) => {
    const draftA = draft.set.values().next().value;
    draft.set.delete(draftA);
  });
  expect(state.set.size).toBe(0);
});

test('update for map', () => {
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
  expect(state).not.toBe(data);
  expect(state).toEqual(data);
});

test('no update for map', () => {
  const data = {
    map: new Map([
      [1, { a: { b: 1 } }],
      [2, { a: { b: 2 } }],
      [3, { a: { b: 3 } }],
    ]),
    foo: 'bar',
  };

  const state = create(data, (draft) => {
    draft.map.get(1)!.a.b = 1;
    draft.map.get(2)!.a.b = 2;
    draft.map.set(3, draft.map.get(3)!);
  });
  expect(state).toBe(data);
});

test('update for map', () => {
  const data = {
    map: new Map(),
    foo: 'bar',
  };

  const state = create(data, (draft) => {
    draft.map.set(1, undefined);
  });
  expect(state).not.toBe(data);
});

test('update for set', () => {
  const data = {
    set: new Set<any>(),
    foo: 'bar',
  };

  const state = create(data, (draft) => {
    draft.set.add(undefined);
  });
  expect(state).not.toBe(data);
});

test('update for set', () => {
  const data = {
    set: new Set([{ b: 2 }]),
    a: {
      b: 1,
    },
  };

  const state = create(data, (draft) => {
    draft.set.add(draft.a);
    draft.set.delete(draft.a);
  });
  expect(state).not.toBe(data);
});

test('delete key in object', () => {
  const data: {
    foo: {
      bar?: {
        b: string;
      };
    };
    foobar: {
      bar: string;
    };
  } = {
    foo: {
      bar: {
        b: 'str',
      },
    },
    foobar: {
      bar: 'str',
    },
  };

  const [state, patches, inversePatches] = create(
    data,
    (draft) => {
      draft.foo.bar!.b = 'new str';
      delete draft.foo.bar;
    },
    {
      enablePatches: true,
    }
  );
  expect(state).toEqual({ foo: {}, foobar: { bar: 'str' } });
  expect(
    state !==
      ({
        foo: {},
        foobar: { bar: 'str' },
      } as any)
  ).toBeTruthy();
  expect(state !== data).toBeTruthy();
  expect(state.foo !== data.foo).toBeTruthy();
  expect(state.foobar === data.foobar).toBeTruthy();
});

test('object case1', () => {
  const data = {
    foo: {
      bar: {
        baz: 'baz',
      },
    },
    foobar: {},
  };

  const state = create(data, (draft) => {
    const foo = draft.foo;
    draft.foobar;
    foo.bar = { baz: 'new baz' };
  });
  expect(state).toEqual({ foo: { bar: { baz: 'new baz' } }, foobar: {} });
});

test('object case2', () => {
  const d = { e: 1 };
  type State = {
    a: {
      b: {
        c: {
          d: {
            e: number;
          };
        };
      };
    };
    f: {
      d: {
        e: number;
      };
    };
    x?: {
      c: {
        d: {
          e: number;
        };
      };
    };
  };
  const baseState: State = { a: { b: { c: { d } } }, f: { d } };
  const state = create(baseState, (draft) => {
    const a = draft.a.b;
    draft.x = a;
    a.c.d.e = 2;
  });
  expect(state.x === state.a.b).toBeTruthy();
});

test('object case3', () => {
  const d = { e: 1 };
  type State = {
    a: {
      c: {
        e: number;
      };
      b: {
        c: {
          d: {
            e: number;
          };
        };
      };
    };
    f: {
      d: {
        e: number;
      };
    };
    x?: {
      e: number;
    };
  };
  const baseState: State = { a: { c: { e: 2 }, b: { c: { d } } }, f: { d } };
  const state = create(baseState, (draft) => {
    const a = draft.a.c;
    draft.x = a;
    const c = draft.a.b;
    c.c.d.e = 2;
  });
  expect(state).toEqual({
    a: { c: { e: 2 }, b: { c: { d: { e: 2 } } } },
    f: { d: { e: 1 } },
    x: { e: 2 },
  });
  expect(state.x).toEqual(state.a.c);
  expect(state.x).toBe(state.a.c);
});

test('performance', () => {
  const baseState: any = {};
  Array(10 ** 5)
    .fill(1)
    .forEach((_, i) => {
      baseState[i] = { i };
    });
  console.time();
  create(baseState, (draft) => {
    draft[0].c = { i: 0 };
  });
  console.timeEnd();
});

test('performance 100k', () => {
  const a = Array(10 ** 5)
    .fill(1)
    .map((_, i) => ({ [i]: i }));
  console.time('performance 100k');
  create({ b: { c: 2 }, a }, (draft) => {
    draft.b.c = 3;
    draft.a.push({ '1': 1 });
  });
  console.timeEnd('performance 100k');
});

test('base array', () => {
  const data = {
    list: ['foo'],
    bar: {},
  };

  const state = create(
    data,
    (draft) => {
      draft.list.push('bar');
      // Array.prototype.push.call(draft.list, 'bar');
    },
    {
      enablePatches: false,
    }
  );
  expect(state).toEqual({ list: ['foo', 'bar'], bar: {} });
  expect(state !== data).toBeTruthy();
  expect(state.list !== data.list).toBeTruthy();
  expect(state.bar === data.bar).toBeTruthy();
});

test('base array set', () => {
  const data = {
    list: ['foo'],
    bar: {},
  };

  const [state, patches, inversePatches] = create(
    data,
    (draft) => {
      draft.list[1] = 'bar';
    },
    {
      enablePatches: true,
    }
  );
  expect(state).toEqual({ list: ['foo', 'bar'], bar: {} });
  expect(state !== data).toBeTruthy();
  expect(state.list !== data.list).toBeTruthy();
  expect(state.bar === data.bar).toBeTruthy();
});

test('base array set with object', () => {
  const data = {
    list: [{ a: 1 }, { a: 2 }, { a: 3 }],
    bar: {},
  };

  const state = create(
    data,
    (draft) => {
      draft.list[1].a = 4;
    },
    {
      enablePatches: false,
    }
  );
  expect(state).toEqual({ list: [{ a: 1 }, { a: 4 }, { a: 3 }], bar: {} });
  expect(state !== data).toBeTruthy();
  expect(state.list !== data.list).toBeTruthy();
  expect(state.bar === data.bar).toBeTruthy();
  expect(state.list[0] === data.list[0]).toBeTruthy();
});

test('base object set ref object', () => {
  const data: any = {
    bar: { a: { c: 1 }, b: { x: 1 } },
  };

  const state = create(
    data,
    (draft) => {
      draft.a = draft.bar;
      draft.bar.a.c = 2;
    },
    {
      enablePatches: false,
    }
  );
  expect(state).toEqual({
    bar: { a: { c: 2 }, b: { x: 1 } },
    a: { a: { c: 2 }, b: { x: 1 } },
  });
  expect(state.a).toBe(state.bar);
});

test('base object set ref object', () => {
  const data: any = {
    bar: { a: { c: 1 }, b: { x: 1 } },
  };

  const state = create(
    data,
    (draft) => {
      draft.bar.a.c = 2;
      draft.a = draft.bar;
    },
    {
      enablePatches: false,
    }
  );
  expect(state).toEqual({
    bar: { a: { c: 2 }, b: { x: 1 } },
    a: { a: { c: 2 }, b: { x: 1 } },
  });
  expect(state.a).toBe(state.bar);
});

test('base array set ref array', () => {
  const data: any = {
    bar: { a: [1, 2, 3], b: { x: 1 } },
  };

  const state = create(
    data,
    (draft) => {
      draft.bar.a.push(4);
      draft.a = draft.bar;
    },
    {
      enablePatches: false,
    }
  );
  expect(state).toEqual({
    bar: { a: [1, 2, 3, 4], b: { x: 1 } },
    a: { a: [1, 2, 3, 4], b: { x: 1 } },
  });
  expect(state.a).toBe(state.bar);
});

test('base array push ref', () => {
  const data: any = {
    bar: { a: [1, 2, 3] as any, b: { x: 1 } },
  };

  const state = create(
    data,
    (draft) => {
      draft.bar.a.push(draft.bar.b);
      draft.bar.b.x = 2;
    },
    {
      enablePatches: false,
    }
  );
  expect(state).toEqual({
    bar: { a: [1, 2, 3, { x: 2 }], b: { x: 2 } },
  });
  expect(state.bar.a.slice(-1)[0]).toBe(state.bar.b);
});

test('base array unshift ref', () => {
  const data: any = {
    bar: { a: [1, 2, 3] as any, b: { x: 1 } },
  };

  const state = create(
    data,
    (draft) => {
      draft.bar.a.unshift(draft.bar.b);
      draft.bar.b.x = 2;
    },
    {
      enablePatches: false,
    }
  );
  expect(state).toEqual({
    bar: { a: [{ x: 2 }, 1, 2, 3], b: { x: 2 } },
  });
  expect(state.bar.a[0]).toBe(state.bar.b);
});

test('base array splice ref', () => {
  const data: any = {
    bar: { a: [1, 2, 3] as any, b: { x: 1 } },
  };

  const state = create(
    data,
    (draft) => {
      draft.bar.a.splice(1, 1, draft.bar.b);
      draft.bar.b.x = 2;
    },
    {
      enablePatches: false,
    }
  );
  expect(state).toEqual({
    bar: { a: [1, { x: 2 }, 3], b: { x: 2 } },
  });
  expect(state.bar.a[1]).toBe(state.bar.b);
});

test('base array set ref and reverse', () => {
  const data: any = {
    bar: { a: [1, 2, 3] as any, b: { x: 1 } },
  };

  const state = create(
    data,
    (draft) => {
      draft.bar.a.push(draft.bar.b);
      draft.bar.b.x = 2;
      draft.bar.a.reverse();
    },
    {
      enablePatches: false,
    }
  );
  expect(state).toEqual({
    bar: { a: [{ x: 2 }, 3, 2, 1], b: { x: 2 } },
  });
  expect(state.bar.a[0]).toBe(state.bar.b);
});

test('base object set ref object1', () => {
  const data: any = {
    bar: { a: { c: 1 }, b: { x: 1 } },
  };

  const state = create(
    data,
    (draft) => {
      draft.bar.a.c = 2;
      draft.k = draft.bar;
      draft.k.a = 3;
    },
    {
      enablePatches: false,
    }
  );
  expect(state).toEqual({
    bar: { a: 3, b: { x: 1 } },
    k: { a: 3, b: { x: 1 } },
  });
});

test('base object set ref object2', () => {
  const a = { c: 1 };
  const data: any = {
    bar: { a, b: { a } },
  };

  const state = create(
    data,
    (draft) => {
      draft.bar.a.c = 2;
    },
    {
      enablePatches: false,
    }
  );
  expect(state).toEqual({ bar: { a: { c: 2 }, b: { a: { c: 1 } } } });
});

test('base set add ref', () => {
  const data = {
    set: new Set<any>(['a']),
    b: { x: 1 },
  };

  const state = create(
    data,
    (draft) => {
      draft.set.add(draft.b);
      draft.b.x = 2;
    },
    {
      enablePatches: false,
    }
  );
  expect(state).toEqual({
    set: new Set<any>(['a', { x: 2 }]),
    b: { x: 2 },
  });
  expect(Array.from(state.set).slice(-1)[0]).toBe(state.b);
});

test('base map set ref', () => {
  const data = {
    map: new Map<any, any>([['a', 1]]),
    b: { x: 1 },
  };

  const state = create(
    data,
    (draft) => {
      draft.map.set('b', draft.b);
      draft.b.x = 2;
    },
    {
      enablePatches: false,
    }
  );
  expect(state).toEqual({
    map: new Map<any, any>([
      ['a', 1],
      ['b', { x: 2 }],
    ]),
    b: { x: 2 },
  });
  expect(state.map.get('b')).toBe(state.b);
});

test('base array push', () => {
  const data = {
    bar: {},
    list: [{ text: '' }],
  };

  const state = create(data, (draft) => {
    draft.list.push({ text: 'foo' });
  });
  expect(state).toEqual({ bar: {}, list: [{ text: '' }, { text: 'foo' }] });
  expect(state).not.toBe(data);
  expect(state.bar).toBe(data.bar);
  expect(state.list).not.toBe(data.list);
  expect(state.list[0]).toBe(data.list[0]);
  expect(state.list[1]).not.toBe(data.list[1]);
});

test('base array pop', () => {
  const data = {
    bar: {},
    list: [{ text: '' }],
  };

  const state = create(data, (draft) => {
    draft.list.pop();
  });
  expect(state).toEqual({ bar: {}, list: [] });
  expect(state).not.toBe(data);
  expect(state.bar).toBe(data.bar);
  expect(state.list).not.toBe(data.list);
});

test('base array reverse', () => {
  const data = {
    bar: {},
    list: [{ text: 'foobar' }, { text: 'foo' }],
  };

  const state = create(data, (draft) => {
    draft.list.reverse();
  });
  expect(state).toEqual({
    bar: {},
    list: [{ text: 'foo' }, { text: 'foobar' }],
  });
  expect(state).not.toBe(data);
  expect(state.bar).toBe(data.bar);
  expect(state.list).not.toBe(data.list);
  expect(state.list[0]).toBe(data.list[1]);
  expect(state.list[1]).toBe(data.list[0]);
});

test('base array shift', () => {
  const data = {
    bar: {},
    list: [{ text: 'foobar' }, { text: 'foo' }],
  };

  const state = create(data, (draft) => {
    draft.list.shift();
  });
  expect(state).toEqual({ bar: {}, list: [{ text: 'foo' }] });
  expect(state).not.toBe(data);
  expect(state.bar).toBe(data.bar);
  expect(state.list).not.toBe(data.list);
});

test('base array shift', () => {
  const data = {
    bar: {},
    list: [{ text: 'foobar' }],
  };

  const state = create(data, (draft) => {
    draft.list.unshift({ text: 'foo' });
  });
  expect(state).toEqual({
    bar: {},
    list: [{ text: 'foo' }, { text: 'foobar' }],
  });
  expect(state).not.toBe(data);
  expect(state.bar).toBe(data.bar);
  expect(state.list).not.toBe(data.list);
});

test('base array splice', () => {
  const data = {
    bar: {},
    list: [{ text: 'foobar' }, { text: 'bar' }, { text: 'bar1' }],
  };

  const state = create(data, (draft) => {
    draft.list.splice(1, 2, { text: 'foo' });
  });
  expect(state).toEqual({
    bar: {},
    list: [{ text: 'foobar' }, { text: 'foo' }],
  });
  expect(state).not.toBe(data);
  expect(state.bar).toBe(data.bar);
  expect(state.list).not.toBe(data.list);
});

test('base array sort', () => {
  const data = {
    bar: {},
    list: [3, 1, 2, 4],
  };

  const state = create(data, (draft) => {
    draft.list.sort();
  });
  expect(state).toEqual({ bar: {}, list: [1, 2, 3, 4] });
  expect(state).not.toBe(data);
  expect(state.bar).toBe(data.bar);
  expect(state.list).not.toBe(data.list);
});

test('base array fill', () => {
  const data = {
    bar: {},
    list: new Array(3),
  };

  const state = create(data, (draft) => {
    draft.list.fill(1);
  });
  expect(state).toEqual({ bar: {}, list: [1, 1, 1] });
  expect(state).not.toBe(data);
  expect(state.bar).toBe(data.bar);
  expect(state.list).not.toBe(data.list);
});

test('base array copyWithin 0', () => {
  const data = {
    bar: {},
    list: [1, 2, 3, 4, 5],
  };

  const state = create(data, (draft) => {
    draft.list.copyWithin(-2, 0);
  });
  expect(state).toEqual({ bar: {}, list: [1, 2, 3, 1, 2] });
  expect(state).not.toBe(data);
  expect(state.bar).toBe(data.bar);
  expect(state.list).not.toBe(data.list);
});

test('base array copyWithin 1', () => {
  const data = {
    bar: {},
    list: [1, 2, 3, 4, 5],
  };

  const state = create(data, (draft) => {
    draft.list.copyWithin(0, 3);
  });
  expect(state).toEqual({ bar: {}, list: [4, 5, 3, 4, 5] });
  expect(state).not.toBe(data);
  expect(state.bar).toBe(data.bar);
  expect(state.list).not.toBe(data.list);
});

test('base array copyWithin 2', () => {
  const data = {
    bar: {},
    list: [1, 2, 3, 4, 5],
  };

  const state = create(data, (draft) => {
    draft.list.copyWithin(0, 3, 4);
  });
  expect(state).toEqual({ bar: {}, list: [4, 2, 3, 4, 5] });
  expect(state).not.toBe(data);
  expect(state.bar).toBe(data.bar);
  expect(state.list).not.toBe(data.list);
});

test('base array copyWithin 3', () => {
  const data = {
    bar: {},
    list: [1, 2, 3, 4, 5],
  };

  const state = create(data, (draft) => {
    draft.list.copyWithin(-2, -3, -1);
  });
  expect(state).toEqual({ bar: {}, list: [1, 2, 3, 3, 4] });
  expect(state).not.toBe(data);
  expect(state.bar).toBe(data.bar);
  expect(state.list).not.toBe(data.list);
});

test('base array copyWithin 4', () => {
  const data = {
    bar: {},
    list: [1, 2, 3, 4, 5],
  };

  const state = create(data, (draft) => {
    draft.list.copyWithin(-3, -3);
  });
  expect(state).toEqual({ bar: {}, list: [1, 2, 3, 4, 5] });
  // no updates
  expect(state).toBe(data);
});

test('base set add', () => {
  const data = {
    bar: {},
    set: new Set([1, 2, 3]),
  };

  const state = create(data, (draft) => {
    draft.set.add(4);
  });
  expect(state).toEqual({
    bar: {},
    set: new Set([1, 2, 3, 4]),
  });
  expect(state).not.toBe(data);
  expect(state.bar).toBe(data.bar);
  expect(state.set).not.toBe(data.set);
});

test('base set clear', () => {
  const data = {
    bar: {},
    set: new Set([1, 2, 3]),
  };

  const state = create(data, (draft) => {
    draft.set.clear();
  });
  expect(state).toEqual({
    bar: {},
    set: new Set(),
  });
  expect(state).not.toBe(data);
  expect(state.bar).toBe(data.bar);
  expect(state.set).not.toBe(data.set);
});

test('base set delete', () => {
  const data = {
    bar: { a: 1 },
    set: new Set([1, 2, 3]),
  };

  const state = create(data, (draft) => {
    draft.bar.a;
    draft.set.delete(2);
  });
  expect(state).toEqual({
    bar: { a: 1 },
    set: new Set([1, 3]),
  });
  expect(state).not.toBe(data);
  expect(state.bar).toBe(data.bar);
  expect(state.set).not.toBe(data.set);
});

test('base map set', () => {
  const data = {
    bar: {},
    map: new Map([
      [1, 1],
      [2, 2],
      [3, 3],
    ]),
  };

  const state = create(data, (draft) => {
    draft.map.set(4, 4);
  });
  expect(state).toEqual({
    bar: {},
    map: new Map([
      [1, 1],
      [2, 2],
      [3, 3],
      [4, 4],
    ]),
  });
  expect(state).not.toBe(data);
  expect(state.bar).toBe(data.bar);
  expect(state.map).not.toBe(data.map);
});

test('base map clear', () => {
  const data = {
    bar: {},
    map: new Map([
      [1, 1],
      [2, 2],
      [3, 3],
    ]),
  };

  const state = create(data, (draft) => {
    draft.map.clear();
  });
  expect(state).toEqual({
    bar: {},
    map: new Map(),
  });
  expect(state).not.toBe(data);
  expect(state.bar).toBe(data.bar);
  expect(state.map).not.toBe(data.map);
});

test('base map delete', () => {
  const data = {
    bar: { a: 1 },
    map: new Map([
      [1, 1],
      [2, 2],
      [3, 3],
    ]),
  };

  const state = create(data, (draft) => {
    draft.bar.a;
    draft.map.delete(2);
  });
  expect(state).toEqual({
    bar: { a: 1 },
    map: new Map([
      [1, 1],
      [3, 3],
    ]),
  });
  expect(state).not.toBe(data);
  expect(state.bar).toBe(data.bar);
  expect(state.map).not.toBe(data.map);
});

test('base freeze', () => {
  const data = {
    bar: { a: 1 },
    list: [{ id: 1 }],
  };

  const state = create(
    data,
    (draft) => {
      draft.list.push({ id: 2 });
      draft.bar.a = 2;
    },
    {
      enableAutoFreeze: true,
    }
  );
  expect(state).toEqual({ bar: { a: 2 }, list: [{ id: 1 }, { id: 2 }] });
  expect(state).not.toBe(data);
  expect(state.bar).not.toBe(data.bar);
  expect(state.list).not.toBe(data.list);
  expect(() => {
    // @ts-expect-error
    state.bar.a = 3;
  }).toThrowError();
  expect(() => {
    // @ts-expect-error
    state.list.push({ id: 3 });
  }).toThrowError();
  expect(() => {
    // @ts-expect-error
    state.list[0].id = 3;
  }).toThrowError();
  expect(() => {
    // @ts-expect-error
    state.list[1].id = 3;
  }).toThrowError();

  const state1 = create(
    state,
    (draft) => {
      draft.list.push({ id: 2 });
      // nothing changes and It should remain frozen as it was before
      draft.bar.a = 2;
    },
    {
      enableAutoFreeze: false,
    }
  );
  expect(() => {
    // @ts-expect-error
    state1.list[0].id = 3;
  }).toThrowError();
  expect(() => {
    // @ts-expect-error
    state1.list[1].id = 3;
  }).toThrowError();
  expect(() => {
    // @ts-expect-error
    state1.bar.a = 4;
  }).toThrowError();
  expect(() => {
    // `state1.list` is not frozen, because `state1` has been changed in the previous step
    // just check runtime mutable
    // @ts-ignore
    state1.list.push({ id: 4 });
  }).not.toThrow();
});

test('base set freeze', () => {
  const data = {
    set: new Set([1, 2, 3]),
  };

  const state = create(
    data,
    (draft) => {
      draft.set.delete(2);
    },
    {
      enableAutoFreeze: true,
    }
  );
  expect(state).toEqual({
    set: new Set([1, 3]),
  });
  expect(state).not.toBe(data);
  expect(() => {
    // @ts-expect-error
    state.set.add(4);
  }).toThrowError();
  expect(() => {
    // @ts-expect-error
    state.set.delete(1);
  }).toThrowError();
  expect(() => {
    // @ts-expect-error
    state.set.clear();
  }).toThrowError();
});

test('base map freeze', () => {
  const data = {
    map: new Map([
      [1, 1],
      [2, 2],
      [3, 3],
    ]),
  };

  const state = create(
    data,
    (draft) => {
      draft.map.delete(2);
    },
    {
      enableAutoFreeze: true,
    }
  );
  expect(state).toEqual({
    map: new Map([
      [1, 1],
      [3, 3],
    ]),
  });

  expect(() => {
    // @ts-expect-error
    state.map.set(4, 4);
  }).toThrowError();
  expect(() => {
    // @ts-expect-error
    state.map.delete(1);
  }).toThrowError();
  expect(() => {
    // @ts-expect-error
    state.map.clear();
  }).toThrowError();
});

test('base map with deep object', () => {
  const a = { a: 1 };
  const b = {};
  const data = {
    bar: {},
    map: new Map<Record<string, any>, Record<string, any>>([
      [a, {}],
      [b, {}],
      [{}, {}],
    ]),
  };

  const state = create(data, (draft) => {
    draft.map.values().next().value.x = 1;
    for (const [key, item] of draft.map) {
      if (item.x === 1) {
        item.c = 2;
      }
    }
  });
  expect(state).toEqual({
    bar: {},
    map: new Map([
      [a, { x: 1, c: 2 }],
      [b, {}],
      [{}, {}],
    ]),
  });
  expect(state).not.toBe(data);
  expect([...state.map.values()][0]).not.toBe([...data.map.values()][0]);
  expect([...state.map.values()][1]).toBe([...data.map.values()][1]);
});

test('base set deep object', () => {
  const a = { a: 1 };
  const b = {};
  const data = {
    bar: {},
    set: new Set<Record<string, any>>([a, b]),
  };

  const state = create(
    data,
    (draft) => {
      draft.set.values().next().value.x = 1;
      const [first] = draft.set.values();
      expect(draft.set.has(first)).toBeTruthy();
      for (const item of draft.set) {
        if (item.x === 1) {
          item.c = 2;
        }
      }
    },
    {
      enablePatches: false,
    }
  );
  expect(state).toEqual({
    bar: {},
    set: new Set([{ a: 1, x: 1, c: 2 }, {}]),
  });
  expect(state).not.toBe(data);
  expect([...state.set.values()][0]).not.toBe([...data.set.values()][0]);
  expect([...state.set.values()][1]).toBe([...data.set.values()][1]);
});

test('only mutable object', () => {
  const data = {
    foo: {
      bar: 'str',
    },
    foobar: {} as any,
  };

  const state = create(
    data,
    (draft) => {
      draft.foobar.text = 'new text';
    },
    {
      mark: (target) => {
        if (target === data.foobar) return 'mutable';
      },
    }
  );
  expect(state).toEqual({
    foo: { bar: 'str' },
    foobar: { text: 'new text' },
  });
  expect(state).toBe(data);
});

test('object with mutable', () => {
  const data = {
    foo: {
      bar: 'str',
    },
    foobar: {} as any,
  };

  const state = create(
    data,
    (draft) => {
      draft.foo.bar = 'new str';
      draft.foobar.text = 'new text';
    },
    {
      mark: (target) => {
        if (target === data.foobar) return 'mutable';
      },
    }
  );
  expect(state).toEqual({
    foo: { bar: 'new str' },
    foobar: { text: 'new text' },
  });
  expect(state).not.toBe(data);
  expect(state.foo).not.toBe(data.foo);
  expect(state.foobar).toBe(data.foobar);
});

test('object with root value mutable', () => {
  const data = {
    foo: {
      bar: 'str',
    },
    foobar: {} as any,
  };

  const state = create(
    data,
    (draft) => {
      draft.foo.bar = 'new str';
      draft.foobar.text = 'new text';
    },
    {
      mark: (target) => {
        if (target === data) return 'mutable';
      },
    }
  );
  expect(state).toEqual({
    foo: { bar: 'new str' },
    foobar: { text: 'new text' },
  });
  expect(state).toBe(data);
  expect(state.foo).toBe(data.foo);
  expect(state.foobar).toBe(data.foobar);
});

test('object with deep value mutable', () => {
  const foo = {
    bar: {
      c: 'str',
    },
  };
  const data = {
    foo,
    foobar: {} as any,
  };

  const state = create(
    data,
    (draft) => {
      draft.foo.bar.c = 'new str';
      draft.foobar.text = 'new text';
    },
    {
      mark: (target) => {
        if (target === foo) return 'mutable';
      },
    }
  );
  expect(state).toEqual({
    foo: { bar: { c: 'new str' } },
    foobar: { text: 'new text' },
  });
  expect(state).not.toBe(data);
  expect(state.foo).toBe(data.foo);
  expect(state.foobar).not.toBe(data.foobar);
});

test('array with mutable', () => {
  const data = {
    foo: {
      bar: 'str',
    },
    arr: [] as any,
  };

  const state = create(
    data,
    (draft) => {
      draft.foo.bar = 'new str';
      draft.arr[0] = 'new text';
    },
    {
      mark: (target) => {
        if (target === data.arr) return 'mutable';
      },
    }
  );
  expect(state).toEqual({
    foo: { bar: 'new str' },
    arr: ['new text'],
  });
  expect(state).not.toBe(data);
  expect(state.foo).not.toBe(data.foo);
  expect(state.arr).toBe(data.arr);
});

test('map with mutable', () => {
  const foobar = {} as any;
  const data = {
    foo: {
      bar: 'str',
    },
    map: new Map([[1, foobar]]),
  };

  const state = create(
    data,
    (draft) => {
      draft.foo.bar = 'new str';
      draft.map.get(1)!.text = 'new text';
    },
    {
      mark: (target) => {
        if (target === foobar) return 'mutable';
      },
    }
  );
  expect(state).toEqual({
    foo: {
      bar: 'new str',
    },
    map: new Map([[1, { text: 'new text' }]]),
  });
  expect(state).not.toBe(data);
  expect(state.foo).not.toBe(data.foo);
  expect(state.map.get(1)).toBe(foobar);
});

test('set with mutable', () => {
  const foobar = {} as any;
  const data = {
    foo: {
      bar: 'str',
    },
    set: new Set([foobar]),
  };

  const state = create(
    data,
    (draft) => {
      draft.foo.bar = 'new str';
      draft.set.values().next().value.text = 'new text';
    },
    {
      mark: (target) => {
        if (target === foobar) return 'mutable';
      },
    }
  );
  expect(state).toEqual({
    foo: {
      bar: 'new str',
    },
    set: new Set([{ text: 'new text' }]),
  });
  expect(state).not.toBe(data);
  expect(state.foo).not.toBe(data.foo);
  expect([...state.set.values()][0]).toBe(foobar);
});

test('object changes with mutable data', () => {
  const foobar = {};
  const data = {
    foo: {
      bar: 'str',
    },
    foobar: {} as any,
  };

  const state = create(data, (draft) => {
    draft.foobar = foobar;
    draft.foobar.text = 'new text0';
    (foobar as any).text = 'new text1';
  });
  expect(state).toEqual({
    foo: { bar: 'str' },
    foobar: { text: 'new text1' },
  });
  expect(state).not.toBe(data);
  expect(state.foo).toBe(data.foo);
  expect(state.foobar).not.toBe(data.foobar);
  expect(state.foobar).toBe(foobar);
});

test('object changes with mutable data', () => {
  const foobar = {};
  const data = {
    foo: {
      bar: 'str',
    },
    foobar: {} as any,
  };

  const state = create(data, (draft) => {
    draft.foobar = foobar;
    draft.foobar.text = 'new text';
  });
  expect(state).toEqual({
    foo: { bar: 'str' },
    foobar: { text: 'new text' },
  });
  expect(state).not.toBe(data);
  expect(state.foo).toBe(data.foo);
  expect(state.foobar).not.toBe(data.foobar);
  expect(state.foobar).toBe(foobar);
});

test('array changes with mutable data', () => {
  const foobar = {};
  const data = {
    foo: {
      bar: 'str',
    },
    arr: [{} as any],
  };

  const state = create(data, (draft) => {
    draft.arr.pop();
    draft.arr.push(foobar);
    draft.arr[0].text = 'new text';
  });
  expect(state).toEqual({
    foo: { bar: 'str' },
    arr: [{ text: 'new text' }],
  });
  expect(state).not.toBe(data);
  expect(state.foo).toBe(data.foo);
  expect(state.arr[0]).not.toBe(data.arr[0]);
  expect(state.arr[0]).toBe(foobar);
});

test('set changes with mutable data', () => {
  const foobar = {};
  const data = {
    foo: {
      bar: 'str',
    },
    set: new Set([{} as any]),
  };

  const state = create(data, (draft) => {
    draft.set.clear();
    draft.set.add(foobar);
    [...draft.set.values()][0].text = 'new text';
  });
  expect(state).toEqual({
    foo: { bar: 'str' },
    set: new Set([{ text: 'new text' }]),
  });
  expect(state).not.toBe(data);
  expect(state.foo).toBe(data.foo);
  expect([...state.set.values()][0]).not.toBe([...data.set.values()][0]);
  expect([...state.set.values()][0]).toBe(foobar);
});

test('map changes with mutable data', () => {
  const foobar = {};
  const data = {
    foo: {
      bar: 'str',
    },
    map: new Map([[1, {} as any]]),
  };

  const state = create(data, (draft) => {
    draft.map.delete(1);
    draft.map.set(1, foobar);
    draft.map.get(1).text = 'new text';
  });
  expect(state).toEqual({
    foo: { bar: 'str' },
    map: new Map([[1, { text: 'new text' }]]),
  });
  expect(state).not.toBe(data);
  expect(state.foo).toBe(data.foo);
  expect(state.map.get(1)).not.toBe(data.map.get(1));
  expect(state.map.get(1)).toBe(foobar);
});

test('object changes with class instance', () => {
  class Foobar {
    bar = 1;
  }

  const foobar = new Foobar();
  const data = {
    foo: {
      bar: 'str',
    },
    foobar,
  };

  const state = create(data, (draft) => {
    draft.foobar.bar = 2;
    draft.foo.bar = 'new str';
  });
  expect(state).toEqual({
    foo: {
      bar: 'new str',
    },
    foobar,
  });
  expect(state).not.toBe(data);
  expect(state.foo).not.toBe(data.foo);
  expect(state.foobar).toBe(foobar);
});

test('current', () => {
  const data = {
    foo: {
      bar: 'str',
    },
    foobar: {
      set: new Set<any>([{}]),
      map: new Map<any, any>([['a', {}]]),
    },
  };
  let currentValue: any;
  const state = create(data, (draft) => {
    draft.foo.bar = 'new str';
    draft.foobar.map.set('b', { x: 1 });
    draft.foobar.set.values().next().value.x = 2;
    currentValue = current(draft);
  });
  expect(currentValue).toEqual({
    foo: {
      bar: 'new str',
    },
    foobar: {
      set: new Set<any>([{ x: 2 }]),
      map: new Map<any, any>([
        ['a', {}],
        ['b', { x: 1 }],
      ]),
    },
  });
  expect(state).toEqual({
    foo: {
      bar: 'new str',
    },
    foobar: {
      set: new Set<any>([{ x: 2 }]),
      map: new Map<any, any>([
        ['a', {}],
        ['b', { x: 1 }],
      ]),
    },
  });
  expect(state).not.toBe(data);
  expect(currentValue).not.toBe(data);
  expect(state).not.toBe(currentValue);
  expect(state.foo).not.toBe(data.foo);
  expect(state.foobar).not.toBe(data.foobar);
});

test('multiple drafts with create', () => {
  const data = {
    foo: {
      bar: 'str',
    } as any,
    foobar: {},
  };
  const data1 = {
    foo1: {
      bar1: 'str1',
    },
    foobar1: {},
  };

  const [draft, finalize] = create(data);
  const [draft1, finalize1] = create(data1);
  draft.foo.bar = 'new str';
  draft1.foo1.bar1 = 'new str1';
  draft.foo.b = current(draft1.foo1);
  const state = finalize();
  draft1.foo1.bar1 = 'new str2';
  const state1 = finalize1();
  expect(state).toEqual({
    foo: { bar: 'new str', b: { bar1: 'new str1' } },
    foobar: {},
  });
  expect(state.foo.b).not.toBe(state1.foo1);
  expect(state1).toEqual({
    foo1: {
      bar1: 'new str2',
    },
    foobar1: {},
  });
  expect(state).not.toBe(data);
  expect(state.foo).not.toBe(data.foo);
  expect(state.foobar).toBe(data.foobar);

  expect(state1).not.toBe(data1);
  expect(state1.foo1).not.toBe(data1.foo1);
  expect(state1.foobar1).toBe(data1.foobar1);
});

test('class instance', () => {
  class Foobar {
    foo = 'str';
  }

  const data = {
    foo: {
      bar: 'str',
    },
    foobar: new Foobar(),
  };

  const state = create(data, (draft) => {
    draft.foo.bar = 'new str';
    draft.foobar.foo = 'new str';
  });
  const foobar = new Foobar();
  foobar.foo = 'new str';
  expect(state).toEqual({ foo: { bar: 'new str' }, foobar });
  expect(state).not.toBe(data);
  expect(state.foo).not.toBe(data.foo);
  expect(state.foobar).toBe(data.foobar);
});

test('class instance with mark', () => {
  class Foobar {
    foo = {
      bar: 'str',
    };

    change() {
      this.foo.bar = 'new str';
    }
  }

  const data = {
    foo: {
      bar: 'str',
    },
    foobar: new Foobar(),
  };

  const state = create(
    data,
    (draft) => {
      draft.foo.bar = 'new str';
      draft.foobar.change();
    },
    {
      mark: (target, { immutable }) => {
        if (target instanceof Foobar) return immutable;
      },
    }
  );
  const foobar = new Foobar();
  foobar.foo.bar = 'new str';
  expect(state).toEqual({ foo: { bar: 'new str' }, foobar });
  expect(state).not.toBe(data);
  expect(state.foo).not.toBe(data.foo);
  expect(state.foobar).not.toBe(data.foobar);
  expect(state.foobar.foo).not.toBe(data.foobar.foo);
});

test('should handle equality correctly about NaN', () => {
  const baseState = {
    x: 's1',
    y: 1,
    z: NaN,
  };
  const nextState = create(baseState, (draft: any) => {
    draft.x = 's2';
    draft.y = 1;
    draft.z = NaN;
    expect(draft[PROXY_DRAFT].assignedMap.get('x')).toBe(true);
    expect(draft[PROXY_DRAFT].assignedMap.get('y')).toBe(undefined);
    expect(draft[PROXY_DRAFT].assignedMap.get('z')).toBe(undefined);
  });
  expect(nextState.x).toBe('s2');
});

test('check Primitive type with returning', () => {
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
      create(value, (draft) => {
        return '';
      })
    ).toBe('');
  });
});

test('check Primitive type with returning and patches', () => {
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
          return '';
        },
        {
          enablePatches: true,
        }
      )
    ).toEqual([
      '',
      [{ op: 'replace', path: [], value: '' }],
      [{ op: 'replace', path: [], value }],
    ]);
  });
});

test('check Primitive type with returning, patches and freeze', () => {
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
          return '';
        },
        {
          enableAutoFreeze: true,
          enablePatches: true,
        }
      )
    ).toEqual([
      '',
      [{ op: 'replace', path: [], value: '' }],
      [{ op: 'replace', path: [], value }],
    ]);
  });
});

test('check Primitive type with returning, patches, freeze and async', async () => {
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
          return '';
        },
        {
          enableAutoFreeze: true,
          enablePatches: true,
        }
      )
    ).toEqual([
      '',
      [{ op: 'replace', path: [], value: '' }],
      [{ op: 'replace', path: [], value }],
    ]);
  }
});

test('base isDraft()', () => {
  const baseState = {
    date: new Date(),
    list: [{ text: 'todo' }],
  };

  const state = create(baseState, (draft) => {
    expect(isDraft(draft.date)).toBeFalsy();
    expect(isDraft(draft.list)).toBeTruthy();
  });
});

test('base isDraftable()', () => {
  const baseState = {
    date: new Date(),
    list: [{ text: 'todo' }],
  };

  expect(isDraftable(baseState.date)).toBeFalsy();
  expect(isDraftable(baseState.list)).toBeTruthy();
});

test('base isDraftable() with option', () => {
  const baseState = {
    date: new Date(),
    list: [{ text: 'todo' }],
  };

  expect(
    isDraftable(baseState.date, {
      mark: (target, { immutable }) => {
        if (target instanceof Date) return immutable;
      },
    })
  ).toBeTruthy();
  expect(isDraftable(baseState.list)).toBeTruthy();
});

test("Nested and chained produce usage results in error: Cannot perform 'get' on a proxy that has been revoked", () => {
  const state: {
    foo: {
      bar: {
        baz: number;
      };
      baz?: number;
    };
  } = {
    foo: {
      bar: {
        baz: 1,
      },
    },
  };
  const newState = create(
    state,
    (draft) => {
      draft.foo = create(
        draft.foo,
        (fooDraft) => {
          fooDraft.baz = fooDraft.bar.baz;
        },
        {
          enableAutoFreeze: true,
        }
      );
      // draft.foo = create(draft.foo, fooDraft => {
      //   /* another produce call makes this fail */
      //   /* no actual mutation necessary to make this happen */
      // })
    },
    {
      enableAutoFreeze: true,
    }
  );

  expect(() => {
    JSON.stringify(newState);
  }).not.toThrowError();
});

test('when nesting patches and changing the level of tree structure data', () => {
  const state = {
    id: 0,
    type: 'root',
    children: [{ id: 2, type: 'node', value: 'A' }],
  };
  const createGroup = (children: any) => {
    return { id: 3, children, groupName: '' };
  };

  const [_nextState, _patches, _inversePatches] = create(
    state,
    (_state) => {
      const node = _state.children[0];
      _state.children.splice(0, 1);
      const group = createGroup([node]);
      // @ts-expect-error
      _state.children.splice(0, 0, group);

      const [__nextState, __patches, __inversePatches] = create(
        _state,
        (__state) => {
          // @ts-expect-error
          const value = __state.children[0].children[0].value;
          // @ts-expect-error
          __state.children[0].groupName = value + ' Group';
        },
        {
          enablePatches: true,
        }
      );
      apply(_state, __patches);
    },
    {
      enablePatches: true,
    }
  );

  expect(() => JSON.stringify(_nextState)).not.toThrowError();
});

test('Set assignment should not have an additional key', () => {
  const data = { x: new Set([{ a: 1 }]) } as any;
  const state = create(data, (draft) => {
    const array = Array.from(draft.x) as any;
    array[0].a = 2;
  });
  expect(Object.keys(state.x).length).toBe(0);
  expect(data).not.toBe(state);
  expect(data.x).not.toBe(state.x);
  expect(Array.from(data.x)[0]).not.toBe(Array.from(state.x)[0]);
  // @ts-expect-error
  expect(Array.from(data.x)[0].a).toBe(1);
  // @ts-expect-error
  expect(Array.from(state.x)[0].a).toBe(2);
});

test('circular reference - object - 1', () => {
  const data = { a: { b: { c: 1 } } };
  // @ts-expect-error
  data.a.b.c1 = data.a.b;
  expect(() => {
    create(
      data,
      (draft) => {
        draft.a.b.c = 2;
      },
      {
        enableAutoFreeze: true,
      }
    );
  }).toThrowErrorMatchingInlineSnapshot(`"Forbids circular reference: ~/a/b"`);
});

test('circular reference - object - 1 - 1', () => {
  const data = { a: { b: { c: 1 } } };
  // @ts-expect-error
  data.a.b.c1 = data.a.b;
  expect(() => {
    create(
      data,
      (draft) => {
        //
      },
      {
        enableAutoFreeze: true,
      }
    );
  }).toThrowErrorMatchingInlineSnapshot(`"Forbids circular reference: ~/a/b"`);
});

test('circular reference - object - 2', () => {
  const data = { a: { b: { c: 1 } } };
  // @ts-expect-error
  data.a.b.c1 = data.a.b;
  expect(() => {
    create(
      data,
      (draft) => {
        draft.a.b.c = 2;
        // @ts-expect-error
        draft.a.a2 = 1;
      },
      {
        enableAutoFreeze: true,
      }
    );
  }).toThrowErrorMatchingInlineSnapshot(`"Forbids circular reference: ~/a/b"`);
});

test('circular reference - object - 2 - 1', () => {
  const data = { a: { b: { c: 1 } } };
  // @ts-expect-error
  data.a.b.c1 = data.a.b;
  expect(() => {
    create(
      data,
      (draft) => {
        //
      },
      {
        enableAutoFreeze: true,
      }
    );
  }).toThrowErrorMatchingInlineSnapshot(`"Forbids circular reference: ~/a/b"`);
});

test('circular reference - object - 3', () => {
  const data = { a: { b: { c: 1 } } };
  // @ts-expect-error
  data.a.b.c1 = data.a.b;
  expect(() => {
    create(
      data,
      (draft) => {
        // @ts-expect-error
        draft.a.a2 = 1;
        draft.a.b.c = 2;
      },
      {
        enableAutoFreeze: true,
      }
    );
  }).toThrowErrorMatchingInlineSnapshot(`"Forbids circular reference: ~/a/b"`);
});

test('circular reference - object - 3 - 1', () => {
  const data = { a: { b: { c: 1 } } };
  // @ts-expect-error
  data.a.b.c1 = data.a.b;
  expect(() => {
    create(
      data,
      (draft) => {
        //
      },
      {
        enableAutoFreeze: true,
      }
    );
  }).toThrowErrorMatchingInlineSnapshot(`"Forbids circular reference: ~/a/b"`);
});

test('circular reference - object - 4', () => {
  const data = { a: { b: { c: 1 } } };
  // @ts-expect-error
  data.c1 = data;
  expect(() => {
    create(
      data,
      (draft) => {
        draft.a.b.c = 2;
      },
      {
        enableAutoFreeze: true,
      }
    );
  }).toThrowErrorMatchingInlineSnapshot(`"Forbids circular reference: ~/c1"`);
});

test('circular reference - object - 4 - 1', () => {
  const data = { a: { b: { c: 1 } } };
  // @ts-expect-error
  data.c1 = data;
  expect(() => {
    create(
      data,
      (draft) => {
        //
      },
      {
        enableAutoFreeze: true,
      }
    );
  }).toThrowErrorMatchingInlineSnapshot(`"Forbids circular reference"`);
});

test('circular reference - array - 1', () => {
  const data = [null, { a: { b: { c: 1 } } }];
  // @ts-expect-error
  data[1].a.b = data[1].a;
  expect(() => {
    create(
      data,
      (draft) => {
        // @ts-expect-error
        draft[1].a.b.c = 2;
      },
      {
        enableAutoFreeze: true,
      }
    );
  }).toThrowErrorMatchingInlineSnapshot(`"Forbids circular reference: ~/1/a"`);
});

test('circular reference - array - 1 - 1', () => {
  const data = [null, { a: { b: { c: 1 } } }];
  // @ts-expect-error
  data[1].a.b = data[1].a;
  expect(() => {
    create(
      data,
      (draft) => {
        //
      },
      {
        enableAutoFreeze: true,
      }
    );
  }).toThrowErrorMatchingInlineSnapshot(`"Forbids circular reference: ~/1/a"`);
});

test('circular reference - array - 2', () => {
  const data = [null, { a: { b: { c: 1 } } }];
  // @ts-expect-error
  data.push(data);
  expect(() => {
    create(
      data,
      (draft) => {
        // @ts-expect-error
        draft[1].a.b.c = 2;
      },
      {
        enableAutoFreeze: true,
      }
    );
  }).toThrowErrorMatchingInlineSnapshot(`"Forbids circular reference: ~/2"`);
});

test('circular reference - array - 2 - 1', () => {
  const data = [null, { a: { b: { c: 1 } } }];
  // @ts-expect-error
  data.push(data);
  expect(() => {
    create(
      data,
      (draft) => {
        //
      },
      {
        enableAutoFreeze: true,
      }
    );
  }).toThrowErrorMatchingInlineSnapshot(`"Forbids circular reference"`);
});

test('circular reference - set - 1', () => {
  const base = { a: { b: { c: 1 } } };
  const data = new Set([null, base]);
  // @ts-expect-error
  base.a.b.c1 = base.a.b;
  expect(() => {
    create(
      data,
      (draft) => {
        const arr = Array.from(draft);
        // @ts-expect-error
        arr[1].a.b.c = 2;
      },
      {
        enableAutoFreeze: true,
      }
    );
  }).toThrowErrorMatchingInlineSnapshot(
    `"Forbids circular reference: ~/1/a/b"`
  );
});

test('circular reference - set - 1 - 1', () => {
  const base = { a: { b: { c: 1 } } };
  const data = new Set([null, base]);
  // @ts-expect-error
  base.a.b.c1 = base.a.b;
  expect(() => {
    create(
      data,
      (draft) => {
        //
      },
      {
        enableAutoFreeze: true,
      }
    );
  }).toThrowErrorMatchingInlineSnapshot(
    `"Forbids circular reference: ~/1/a/b"`
  );
});

test('circular reference - set - 2', () => {
  const base = { a: { b: { c: 1 } } };
  const data = new Set<any>([null, base]);
  data.add(data);
  expect(() => {
    create(
      data,
      (draft) => {
        const arr = Array.from(draft);
        arr[1].a.b.c = 2;
      },
      {
        enableAutoFreeze: true,
      }
    );
  }).toThrowErrorMatchingInlineSnapshot(`"Forbids circular reference: ~/2"`);
});

test('circular reference - set - 2 - 1', () => {
  const base = { a: { b: { c: 1 } } };
  const data = new Set<any>([null, base]);
  data.add(data);
  expect(() => {
    create(
      data,
      (draft) => {
        //
      },
      {
        enableAutoFreeze: true,
      }
    );
  }).toThrowErrorMatchingInlineSnapshot(`"Forbids circular reference"`);
});

test('circular reference - map - 1', () => {
  const base: {
    a: {
      b: {
        c: number;
        c1?: {
          c: number;
        };
      };
    };
  } = { a: { b: { c: 1 } } };
  const key = Symbol(1);
  const data = new Map([
    [null, null],
    [key, base],
  ]);
  base.a.b.c1 = base.a.b;
  expect(() => {
    create(
      data,
      (draft) => {
        draft.get(key)!.a.b.c = 2;
      },
      {
        enableAutoFreeze: true,
      }
    );
  }).toThrowErrorMatchingInlineSnapshot(
    `"Forbids circular reference: ~/[Symbol(1)]/a/b"`
  );
});

test('circular reference - map - 1 - 1', () => {
  const base: {
    a: {
      b: {
        c: number;
        c1?: {
          c: number;
        };
      };
    };
  } = { a: { b: { c: 1 } } };
  const data = new Map([
    [null, null],
    [1, base],
  ]);
  base.a.b.c1 = base.a.b;
  expect(() => {
    create(
      data,
      (draft) => {
        //
      },
      {
        enableAutoFreeze: true,
      }
    );
  }).toThrowErrorMatchingInlineSnapshot(
    `"Forbids circular reference: ~/1/a/b"`
  );
});

test('circular reference - map - 2', () => {
  const base = { a: { b: { c: 1 } } };
  const data = new Map<any, any>([
    [null, null],
    [1, base],
  ]);
  data.set(data, data);
  expect(() => {
    create(
      data,
      (draft) => {
        draft.get(1).a.b.c = 2;
      },
      {
        enableAutoFreeze: true,
      }
    );
  }).toThrowErrorMatchingInlineSnapshot(`"Forbids circular reference: ~/2"`);
});

test('circular reference - map - 2 - 1', () => {
  const base = { a: { b: { c: 1 } } };
  const data = new Map<any, any>([
    [null, null],
    [1, base],
  ]);
  data.set(data, data);
  expect(() => {
    create(
      data,
      (draft) => {
        //
      },
      {
        enableAutoFreeze: true,
      }
    );
  }).toThrowErrorMatchingInlineSnapshot(`"Forbids circular reference"`);
});

test('circular reference - map - 3', () => {
  const base = { a: { b: { c: 1 } } };
  const data = new Map<any, any>([
    [null, null],
    [1, base],
  ]);
  data.set(data, {});
  expect(() => {
    create(
      data,
      (draft) => {
        draft.get(1).a.b.c = 2;
      },
      {
        enableAutoFreeze: true,
      }
    );
  }).toThrowErrorMatchingInlineSnapshot(`"Forbids circular reference: ~/2"`);
});

test('circular reference - map - 3 - 1', () => {
  const base = { a: { b: { c: 1 } } };
  const data = new Map<any, any>([
    [null, null],
    [1, base],
  ]);
  data.set(data, {});
  expect(() => {
    create(
      data,
      (draft) => {
        //
      },
      {
        enableAutoFreeze: true,
      }
    );
  }).toThrowErrorMatchingInlineSnapshot(`"Forbids circular reference"`);
});

test('can return an object that references itself', () => {
  const res = {};
  // @ts-expect-error
  res.self = res;
  expect(() => {
    // @ts-expect-error
    create(res, (draft) => res.self, { enableAutoFreeze: true });
  }).toThrowErrorMatchingInlineSnapshot(`"Maximum call stack size exceeded"`);
});

test('#18 - array: assigning a non-draft with the same key', () => {
  const baseState = {
    array: [
      {
        one: {
          two: 3,
        },
      },
    ],
  };

  const created = create(baseState, (draft) => {
    draft.array[0].one.two = 2;

    draft.array = [draft.array[0]];
  });

  expect(created.array[0].one.two).toBe(2);
});

test('#18 - object: assigning a non-draft with the same key', () => {
  const baseState = {
    object: {
      zero: {
        one: {
          two: 3,
        },
      },
    },
  };

  const created = create(baseState, (draft) => {
    draft.object.zero.one.two = 2;

    draft.object = { zero: draft.object.zero };
  });

  expect(created.object.zero.one.two).toBe(2);
});

test('#18 - array: assigning a non-draft with the same key - deep1', () => {
  const baseState = {
    array: [
      {
        one: {
          two: {
            three: 3,
          },
        },
      },
    ],
  };

  const created = create(baseState, (draft) => {
    draft.array[0].one.two.three = 2;
    draft.array = [{ one: draft.array[0].one }];
  });

  expect(created.array[0].one.two.three).toBe(2);
});

test('#18 - array: assigning a non-draft with the same key - deep2', () => {
  const baseState = {
    array: [
      {
        one: {
          two: {
            three: 3,
          },
        },
      },
    ],
  };

  const created = create(baseState, (draft) => {
    draft.array[0].one.two.three = 2;
    draft.array = [{ one: { two: draft.array[0].one.two } }];
  });

  expect(created.array[0].one.two.three).toBe(2);
});

test('#18 - array: assigning a non-draft with the same key - deep3', () => {
  const baseState = {
    array: [
      {
        one: {
          two: {
            three: 3,
          },
        },
      },
    ],
  };

  const created = create(baseState, (draft) => {
    draft.array[0].one.two.three = 2;
    const tow = draft.array[0].one.two;
    // @ts-ignore
    draft.array = [{ one: {} }];
    draft.array[0].one.two = tow;
    expect(draft.array[0].one.two.three).toBe(2);
  });

  expect(created.array[0].one.two.three).toBe(2);
});

test('#18 - array: assigning a non-draft with the same key - deep5', () => {
  const baseState = {
    array: [
      {
        one: {
          two: {
            three: 3,
          },
        },
      },
    ],
  };

  const created = create(
    baseState,
    (draft) => {
      draft.array[0].one.two.three = 2;
      const two = draft.array[0].one.two;
      // @ts-ignore
      const one = [];
      // @ts-ignore
      draft.array1 = [{ one }];
      // @ts-ignore
      one.push(two);
    },
    {
      enablePatches: true,
    }
  );

  // @ts-ignore
  expect(Array.from(created[0].array1[0].one)[0].three).toBe(2);

  //  @ts-ignore
  expect(apply(baseState, created[1])).toEqual(created[0]);
  // @ts-ignore
  expect(apply(created[0], created[2])).toEqual(baseState);
});

test('#18 - object: assigning a non-draft with the same key - deep5', () => {
  const baseState = {
    array: [
      {
        one: {
          two: {
            three: 3,
          },
        },
      },
    ],
  };

  const created = create(
    baseState,
    (draft) => {
      draft.array[0].one.two.three = 2;
      const two = draft.array[0].one.two;
      // @ts-ignore
      const one = {};
      // @ts-ignore
      draft.array1 = [{ one }];
      // @ts-ignore
      one.x = two;
    },
    {
      enablePatches: true,
    }
  );

  // @ts-ignore
  expect(created[0].array1[0].one.x.three).toBe(2);

  //  @ts-ignore
  expect(apply(baseState, created[1])).toEqual(created[0]);
  // @ts-ignore
  expect(apply(created[0], created[2])).toEqual(baseState);
});

test('#18 - set: assigning a non-draft with the same key - deep5', () => {
  const baseState = {
    array: [
      {
        one: {
          two: {
            three: 3,
          },
        },
      },
    ],
  };

  const created = create(
    baseState,
    (draft) => {
      draft.array[0].one.two.three = 2;
      const two = draft.array[0].one.two;
      // @ts-ignore
      const one = new Set();
      // @ts-ignore
      draft.array1 = [{ one }];
      // @ts-ignore
      one.add(two);
    },
    {
      enablePatches: true,
    }
  );

  // @ts-ignore
  expect(Array.from(created[0].array1[0].one)[0].three).toBe(2);

  //  @ts-ignore
  expect(apply(baseState, created[1])).toEqual(created[0]);
  // @ts-ignore
  expect(apply(created[0], created[2])).toEqual(baseState);
});

test('#18 - map: assigning a non-draft with the same key - deep5', () => {
  const baseState = {
    array: [
      {
        one: {
          two: {
            three: 3,
          },
        },
      },
    ],
  };

  const created = create(
    baseState,
    (draft) => {
      draft.array[0].one.two.three = 2;
      const two = draft.array[0].one.two;
      // @ts-ignore
      const one = new Map();
      // @ts-ignore
      draft.array1 = [{ one }];
      // @ts-ignore
      one.set(0, two);
    },
    {
      enablePatches: true,
    }
  );

  // @ts-ignore
  expect(Array.from(created[0].array1[0].one.values())[0].three).toBe(2);

  //  @ts-ignore
  expect(apply(baseState, created[1])).toEqual(created[0]);
  // @ts-ignore
  expect(apply(created[0], created[2])).toEqual(baseState);
});

test('#18 - set: assigning a non-draft with the same key - deep6', () => {
  const baseState = {
    array: [
      {
        one: {
          two: {
            three: 3,
          },
        },
      },
    ],
  };

  const created = create(
    baseState,
    (draft) => {
      draft.array[0].one.two.three = 2;
      const two = draft.array[0].one.two;
      const one = new Set();
      // @ts-ignore
      draft.array = [{ one }];
      // @ts-ignore
      one.add(two);
      // @ts-ignore
      expect(Array.from(draft.array[0].one.values())[0].three).toBe(2);
    },
    {
      enablePatches: true,
    }
  );

  // @ts-ignore
  expect(Array.from(created[0].array[0].one.values())[0].three).toBe(2);

  //  @ts-ignore
  expect(apply(baseState, created[1])).toEqual(created[0]);
  // @ts-ignore
  // expect(apply(created[0], created[2])).toEqual(baseState);
});

test('#18 - set: assigning a non-draft with the same key - deep3', () => {
  const baseState = {
    array: [
      {
        one: {
          two: {
            three: 3,
          },
        },
      },
    ],
  };

  const created = create(baseState, (draft) => {
    draft.array[0].one.two.three = 2;
    const two = draft.array[0].one.two;
    const one = new Set();
    // @ts-ignore
    draft.array = [{ one }];
    // @ts-ignore
    one.add(two);
    // @ts-ignore
    expect(Array.from(draft.array[0].one)[0].three).toBe(2);
  });

  // @ts-ignore
  expect(Array.from(created.array[0].one)[0].three).toBe(2);
});

test('#18 - set: assigning a non-draft with the same key - deep7', () => {
  const baseState = {
    array: [
      {
        one: {
          two: {
            three: 3,
          },
        },
      },
    ],
  };

  const created = create(baseState, (draft) => {
    draft.array[0].one.two.three = 2;
    const two = draft.array[0].one.two;
    const one = new Set();
    // @ts-ignore
    draft.array = [0, { one }];
    // @ts-ignore
    one.add(two);
    // @ts-ignore
    expect(Array.from(draft.array[1].one)[0].three).toBe(2);
  });

  // @ts-ignore
  expect(Array.from(created.array[1].one)[0].three).toBe(2);
});

test('#18 - array: assigning a non-draft with the same key - deep4', () => {
  const baseState = {
    array: [
      {
        one: {
          two: {
            three: {
              four: 3,
            },
          },
        },
      },
    ],
  };

  const created = create(baseState, (draft) => {
    draft.array[0].one.two.three.four = 2;
    draft.array = [{ one: { two: { three: draft.array[0].one.two.three } } }];
  });

  expect(created.array[0].one.two.three.four).toBe(2);
});

test('#18 - map: assigning a non-draft with the same key', () => {
  const baseState: any = {
    map: new Map([
      [
        0,
        {
          one: {
            two: 3,
          },
        },
      ],
    ]),
  };

  const created = create(baseState, (draft) => {
    draft.map.get(0).one.two = 2;
    draft.map = new Map([[0, draft.map.get(0)]]);
  });
  expect(created.map.get(0).one.two).toBe(2);
});

test('#18 - map: assigning a non-draft with the same key - enablePatches', () => {
  const baseState: any = {
    map: new Map([
      [
        0,
        {
          one: {
            two: 3,
          },
        },
      ],
    ]),
  };

  const created = create(
    baseState,
    (draft) => {
      draft.map.get(0).one.two = 2;
      draft.map = new Map([[0, draft.map.get(0)]]);
    },
    {
      enablePatches: true,
    }
  );
  expect(created[0].map.get(0).one.two).toBe(2);

  expect(apply(baseState, created[1])).toEqual(created[0]);
  expect(apply(created[0], created[2])).toEqual(baseState);
});

test('#18 - set: assigning a non-draft with the same key', () => {
  const baseState: any = {
    set: new Set([
      {
        one: {
          two: 3,
        },
      },
    ]),
  };

  const created = create(baseState, (draft) => {
    draft.set.values().next().value.one.two = 2;
    draft.set = new Set([Array.from(draft.set)[0]]);
  });
  expect(created.set.values().next().value.one.two).toBe(2);
});

test('#18 - set: assigning a non-draft with the same key - enablePatches', () => {
  const baseState: any = {
    set: new Set([
      {
        one: {
          two: 3,
        },
      },
    ]),
  };

  const created = create(
    baseState,
    (draft) => {
      draft.set.values().next().value.one.two = 2;
      draft.set = new Set([Array.from(draft.set)[0]]);
    },
    {
      enablePatches: true,
    }
  );
  expect(created[0].set.values().next().value.one.two).toBe(2);

  expect(apply(baseState, created[1])).toEqual(created[0]);
  expect(apply(created[0], created[2])).toEqual(baseState);
});

test('#18 - array: assigning a non-draft with the same key - enablePatches', () => {
  const baseState = {
    array: [
      {
        one: {
          two: 3,
        },
      },
    ],
  };

  const created = create(
    baseState,
    (draft) => {
      draft.array[0].one.two = 2;

      draft.array = [draft.array[0]];
    },
    {
      enablePatches: true,
    }
  );
  expect(created[0].array[0].one.two).toBe(2);

  expect(apply(baseState, created[1])).toEqual(created[0]);
  expect(apply(created[0], created[2])).toEqual(baseState);
});

test('#18: assigning a non-draft with the different key - enablePatches', () => {
  const baseState = {
    array: [
      {
        one: {
          two: 3,
        },
      },
    ],
  };

  const created = create(
    baseState,
    (draft) => {
      draft.array[0].one.two = 2;
      // @ts-ignore
      draft.array1 = [0, { c: draft.array[0] }];
      // @ts-ignore
      draft.map = [0, new Map([[0, draft.array[0]]])];
      // @ts-ignore
      draft.set = [0, new Set([draft.array[0]])];
    },
    {
      enablePatches: true,
    }
  );
  // @ts-ignore
  expect(created[0].array[0].one.two).toBe(2);
  // @ts-ignore
  expect(created[0].array1[1].c.one.two).toBe(2);
  // @ts-ignore
  expect(created[0].map[1].get(0).one.two).toBe(2);
  // @ts-ignore
  expect(Array.from(created[0].set[1])[0].one.two).toBe(2);

  expect(apply(baseState, created[1])).toEqual(created[0]);
  expect(apply(created[0], created[2])).toEqual(baseState);
});

test('array: assigning a non-draft array', () => {
  const baseState = {
    data: [{ a: true }],
  };

  const state = create(baseState, (draft) => {
    const a = draft.data.filter((item) => item.a);
    // @ts-ignore
    draft.data = [];
  });

  expect(state.data.length).toBe(0);
});

test('object: assigning a non-draft array', () => {
  const baseState = {
    data: { a: { b: true } },
  };

  const state = create(baseState, (draft) => {
    Object.values(draft.data).forEach((item) => {
      item.b = false;
    });
    // @ts-ignore
    draft.data = {};
  });

  expect(Object.values(state.data).length).toBe(0);
});

test('set: assigning a non-draft array', () => {
  const baseState = {
    data: new Set([{ b: true }]),
  };

  const state = create(baseState, (draft) => {
    draft.data.forEach((item) => {
      //
    });
    // @ts-ignore
    draft.data = new Set();
  });

  expect(state.data.size).toBe(0);
});

test('map: assigning a non-draft array', () => {
  const baseState = {
    data: new Map([[0, { b: true }]]),
  };

  const state = create(baseState, (draft) => {
    draft.data.forEach((item) => {
      //
    });
    // @ts-ignore
    draft.data = new Map();
  });

  expect(state.data.size).toBe(0);
});

test('#20 - Filter does not work correctly when array contains objects', () => {
  const baseState = {
    array: [{ x: 1 }],
  };

  const state = create(baseState, (draft) => {
    draft.array = draft.array.filter((o) => o.x !== 1);
  });

  expect(state.array).toEqual([]);
});

test('base - map', () => {
  const baseState = new Map<any, any>();
  const state = create(
    baseState,
    (draft) => {
      draft.clear();
    },
    {
      mark: (target) => 'immutable',
    }
  );
  expect(state).toBe(baseState);
});

test('base - set', () => {
  const baseState = new Set<any>();
  const state = create(
    baseState,
    (draft) => {
      draft.clear();
    },
    {
      mark: (target) => 'immutable',
    }
  );
  expect(state).toBe(baseState);
});

test('base - array', () => {
  const baseState = <any>[];
  const state = create(
    baseState,
    (draft) => {
      draft.length = 0;
    },
    {
      mark: (target) => 'immutable',
    }
  );
  expect(state).toBe(baseState);
});

test('base - object', () => {
  const baseState = {};
  const state = create(
    baseState,
    (draft) => {
      // @ts-ignore
      delete draft.a;
    },
    {
      mark: (target) => 'immutable',
    }
  );
  expect(state).toBe(baseState);
});

test('base - class', () => {
  class Base {
    a = 1;
  }

  const baseState = new Base();

  const state = create(
    baseState,
    (draft) => {
      draft.a = 2;
    },
    {
      mark: (target) => 'immutable',
    }
  );

  expect(state).not.toBe(baseState);
});

test('works with interweaved Immer instances', () => {
  const enableAutoFreeze = false;
  const base: any = {};
  const result = create(
    base,
    (s1: any) =>
      create(
        { s1 },
        (s2: any) => {
          expect(original(s2.s1)).toBe(s1);
          s2.n = 1;
          s2.s1 = create(
            { s2 },
            (s3) => {
              expect(original(s3.s2)).toBe(s2);
              expect(original(s3.s2.s1)).toBe(s2.s1);
              return s3.s2.s1;
            },
            {
              enableAutoFreeze,
            }
          );
        },
        {
          enableAutoFreeze,
        }
      ),
    {
      enableAutoFreeze,
    }
  );
  expect(result.n).toBe(1);
  expect(result.s1).toBe(base);
});
