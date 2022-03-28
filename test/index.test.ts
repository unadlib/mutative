import { create } from '../src';

describe('base', () => {
  test('object', () => {
    const data = {
      foo: {
        bar: 'str',
      },
      foobar: {},
    };

    const { state } = create(data, (draft) => {
      draft.foo.bar = 'new str';
    });
    expect(state).toEqual({ foo: { bar: 'new str' }, foobar: {} });
    expect(
      state !==
        {
          foo: {
            bar: 'str',
          },
          foobar: {},
        }
    ).toBeTruthy();
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

    const { state, inversePatches, patches } = create(
      data,
      (draft) => {
        draft.foo.bar.b = 'new str';
        // @ts-ignore
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

    const { state } = create(data, (draft) => {
      const foo = draft.foo;
      draft.foobar;
      foo.bar = { baz: 'new baz' };
    });
    expect(state).toEqual({ foo: { bar: { baz: 'new baz' } }, foobar: {} });
  });

  test('object case2', () => {
    const d = { e: 1 };
    const baseState = { a: { b: { c: { d } } }, f: { d } };
    const { state } = create(baseState, (draft) => {
      const a = draft.a.b;
      // @ts-ignore
      draft.x = a;
      a.c.d.e = 2;
    });
    // @ts-ignore
    expect(state.x === state.a.b).toBeTruthy();
  });

  test('object case3', () => {
    const d = { e: 1 };
    const baseState = { a: { c: { e: 2 }, b: { c: { d } } }, f: { d } };
    const { state } = create(baseState, (draft) => {
      const a = draft.a.c;
      // @ts-ignore
      draft.x = a;
      const c = draft.a.b;
      // @ts-ignore
      c.c.d.e = 2;
    });
    expect(state).toEqual({
      a: { c: { e: 2 }, b: { c: { d: { e: 2 } } } },
      f: { d: { e: 1 } },
      x: { e: 2 },
    });
    // @ts-ignore
    expect(state.x).toEqual(state.a.c);
    // @ts-ignore
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

    const { state, patches, inversePatches } = create(
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
    expect(
      state !==
        {
          list: ['foo', 'bar'],
          bar: {},
        }
    ).toBeTruthy();
    expect(state !== data).toBeTruthy();
    expect(state.list !== data.list).toBeTruthy();
    expect(state.bar === data.bar).toBeTruthy();
  });

  test('base array set', () => {
    const data = {
      list: ['foo'],
      bar: {},
    };

    const { state, patches, inversePatches } = create(
      data,
      (draft) => {
        draft.list[1] = 'bar';
      },
      {
        enablePatches: true,
      }
    );
    expect(state).toEqual({ list: ['foo', 'bar'], bar: {} });
    expect(
      state !==
        {
          list: ['foo', 'bar'],
          bar: {},
        }
    ).toBeTruthy();
    expect(state !== data).toBeTruthy();
    expect(state.list !== data.list).toBeTruthy();
    expect(state.bar === data.bar).toBeTruthy();
  });

  test('base array set with object', () => {
    const data = {
      list: [{ a: 1 }, { a: 2 }, { a: 3 }],
      bar: {},
    };

    const { state, patches, inversePatches } = create(
      data,
      (draft) => {
        draft.list[1].a = 4;
      },
      {
        enablePatches: false,
      }
    );
    expect(state).toEqual({ list: [{ a: 1 }, { a: 4 }, { a: 3 }], bar: {} });
    expect(
      state !==
        {
          list: [{ a: 1 }, { a: 4 }, { a: 3 }],
          bar: {},
        }
    ).toBeTruthy();
    expect(state !== data).toBeTruthy();
    expect(state.list !== data.list).toBeTruthy();
    expect(state.bar === data.bar).toBeTruthy();
    expect(state.list[0] === data.list[0]).toBeTruthy();
  });

  test('base object set ref object', () => {
    const data: any = {
      bar: { a: { c: 1 }, b: { x: 1 } },
    };

    const { state, patches, inversePatches } = create(
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

    const { state, patches, inversePatches } = create(
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

    const { state, patches, inversePatches } = create(
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

  test('base object set ref object1', () => {
    const data: any = {
      bar: { a: { c: 1 }, b: { x: 1 } },
    };

    const { state, patches, inversePatches } = create(
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

    const { state, patches, inversePatches } = create(
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

  test('base array push', () => {
    const data = {
      bar: {},
      list: [{ text: '' }],
    };

    const { state, patches, inversePatches } = create(data, (draft) => {
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

    const { state, patches, inversePatches } = create(data, (draft) => {
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

    const { state, patches, inversePatches } = create(data, (draft) => {
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

    const { state, patches, inversePatches } = create(data, (draft) => {
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

    const { state, patches, inversePatches } = create(data, (draft) => {
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

    const { state, patches, inversePatches } = create(data, (draft) => {
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

    const { state, patches, inversePatches } = create(data, (draft) => {
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

    const { state, patches, inversePatches } = create(data, (draft) => {
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

    const { state, patches, inversePatches } = create(data, (draft) => {
      // @ts-ignore
      draft.list.copyWithin(-2);
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

    const { state, patches, inversePatches } = create(data, (draft) => {
      // @ts-ignore
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

    const { state, patches, inversePatches } = create(data, (draft) => {
      // @ts-ignore
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

    const { state, patches, inversePatches } = create(data, (draft) => {
      // @ts-ignore
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

    const { state, patches, inversePatches } = create(data, (draft) => {
      // @ts-ignore
      draft.list.copyWithin(-3, -3);
    });
    expect(state).toEqual({ bar: {}, list: [1, 2, 3, 4, 5] });
    expect(state).not.toBe(data);
    expect(state.bar).toBe(data.bar);
    expect(state.list).not.toBe(data.list);
  });

  test('base set add', () => {
    const data = {
      bar: {},
      set: new Set([1, 2, 3]),
    };

    const { state, patches, inversePatches } = create(data, (draft) => {
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

    const { state, patches, inversePatches } = create(data, (draft) => {
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

    const { state, patches, inversePatches } = create(data, (draft) => {
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

    const { state, patches, inversePatches } = create(data, (draft) => {
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

    const { state, patches, inversePatches } = create(data, (draft) => {
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

    const { state, patches, inversePatches } = create(data, (draft) => {
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

    const { state, patches, inversePatches } = create(
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
      state.bar.a = 3;
    }).toThrowError();
    expect(() => {
      state.list.push({ id: 3 });
    }).toThrowError();
    expect(() => {
      state.list[0].id = 3;
    }).toThrowError();
    expect(() => {
      state.list[1].id = 3;
    }).toThrowError();

    const result = create(
      state,
      (draft) => {
        draft.list.push({ id: 2 });
        draft.bar.a = 2;
      },
      {
        enableAutoFreeze: false,
      }
    );
    expect(() => {
      result.state.list[0].id = 3;
    }).toThrowError();
    expect(() => {
      result.state.list[1].id = 3;
    }).toThrowError();
    result.state.list.push({ id: 4 });
    result.state.bar.a = 4;
  });
});
