import { produce } from 'immer';
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

  test('array with push', () => {
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

  test('array with setter', () => {
    const data = {
      list: ['foo'],
      bar: {},
    };

    const state = create(data, (draft) => {
      draft.list[1] = 'bar';
    });
    expect(state).toEqual({ list: ['foo', 'bar'], bar: {} });
    expect(state).not.toBe(data);
    expect(state.list).not.toBe(data.list);
    expect(state.bar).toBe(data.bar);
  });

  test('base array set with object', () => {
    const data = {
      list: [{ a: 1 }, { a: 2 }, { a: 3 }],
      bar: {},
    };

    const state = create(data, (draft) => {
      draft.list[1].a = 4;
    });
    expect(state).toEqual({ list: [{ a: 1 }, { a: 4 }, { a: 3 }], bar: {} });
    expect(state).not.toBe(data);
    expect(state.list).not.toBe(data.list);
    expect(state.bar).toBe(data.bar);
    expect(state.list[0]).toBe(data.list[0]);
  });

  test('array with pop', () => {
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

  test('array with reverse', () => {
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

  test('array with shift', () => {
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

  test('array with unshift', () => {
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

  test('array with splice', () => {
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

  test('array with sort', () => {
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

  test('array with fill', () => {
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

  test('case1 for array with copyWithin', () => {
    const data = {
      bar: {},
      list: [1, 2, 3, 4, 5],
    };

    const state = create(data, (draft) => {
      // @ts-ignore
      draft.list.copyWithin(-2);
    });
    expect(state).toEqual({ bar: {}, list: [1, 2, 3, 1, 2] });
    expect(state).not.toBe(data);
    expect(state.bar).toBe(data.bar);
    expect(state.list).not.toBe(data.list);
  });

  test('case2 for array with copyWithin', () => {
    const data = {
      bar: {},
      list: [1, 2, 3, 4, 5],
    };

    const state = create(data, (draft) => {
      // @ts-ignore
      draft.list.copyWithin(0, 3);
    });
    expect(state).toEqual({ bar: {}, list: [4, 5, 3, 4, 5] });
    expect(state).not.toBe(data);
    expect(state.bar).toBe(data.bar);
    expect(state.list).not.toBe(data.list);
  });

  test('case3 for array with copyWithin', () => {
    const data = {
      bar: {},
      list: [1, 2, 3, 4, 5],
    };

    const state = create(data, (draft) => {
      // @ts-ignore
      draft.list.copyWithin(0, 3, 4);
    });
    expect(state).toEqual({ bar: {}, list: [4, 2, 3, 4, 5] });
    expect(state).not.toBe(data);
    expect(state.bar).toBe(data.bar);
    expect(state.list).not.toBe(data.list);
  });

  test('case4 for array with copyWithin', () => {
    const data = {
      bar: {},
      list: [1, 2, 3, 4, 5],
    };

    const state = create(data, (draft) => {
      // @ts-ignore
      draft.list.copyWithin(-2, -3, -1);
    });
    expect(state).toEqual({ bar: {}, list: [1, 2, 3, 3, 4] });
    expect(state).not.toBe(data);
    expect(state.bar).toBe(data.bar);
    expect(state.list).not.toBe(data.list);
  });

  test('case5 for array with copyWithin', () => {
    const data = {
      bar: {},
      list: [1, 2, 3, 4, 5],
    };

    const state = create(data, (draft) => {
      // @ts-ignore
      draft.list.copyWithin(-3, -3);
    });
    expect(state).toEqual({ bar: {}, list: [1, 2, 3, 4, 5] });
    // no updates
    expect(state).toBe(data);
  });

  test('set with add operation', () => {
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

  test('set clear', () => {
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

  test('set with add undefined', () => {
    const data = {
      set: new Set<any>(),
      foo: 'bar',
    };

    const state = create(data, (draft) => {
      draft.set.add(undefined);
    });
    expect(state).not.toBe(data);
  });

  test('map with set operation', () => {
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

  test('map clear', () => {
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

  test('map delete', () => {
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

  test('map with set undefined', () => {
    const data = {
      map: new Map(),
      foo: 'bar',
    };

    const state = create(data, (draft) => {
      draft.map.set(1, undefined);
    });
    expect(state).not.toBe(data);
  });

  test('map with deep object', () => {
    const a = { a: 1 };
    const b = {};
    const data = {
      bar: {},
      map: new Map([
        [a, {}],
        [b, {}],
        [{}, {}],
      ]),
    };

    const state = create(data, (draft) => {
      // @ts-ignore
      draft.map.values().next().value.x = 1;
      for (const [key, item] of draft.map) {
        // @ts-ignore
        if (item.x === 1) {
          // @ts-ignore
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

  test('set with deep object', () => {
    const a = { a: 1 };
    const b = {};
    const data = {
      bar: {},
      set: new Set([a, b]),
    };

    const state = create(data, (draft) => {
      draft.set.values().next().value.x = 1;
      const [first] = draft.set.values();
      expect(draft.set.has(first)).toBeTruthy();
      for (const item of draft.set) {
        // @ts-ignore
        if (item.x === 1) {
          // @ts-ignore
          item.c = 2;
        }
      }
    });
    expect(state).toEqual({
      bar: {},
      set: new Set([{ a: 1, x: 1, c: 2 }, {}]),
    });
    expect(state).not.toBe(data);
    expect([...state.set.values()][0]).not.toBe([...data.set.values()][0]);
    expect([...state.set.values()][1]).toBe([...data.set.values()][1]);
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

  test('base object set ref object', () => {
    const data: any = {
      bar: { a: { c: 1 }, b: { x: 1 } },
    };

    const state = create(data, (draft) => {
      draft.a = draft.bar;
      draft.bar.a.c = 2;
    });
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

    const state = create(data, (draft) => {
      draft.bar.a.c = 2;
      draft.a = draft.bar;
    });
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

    const state = create(data, (draft) => {
      draft.bar.a.push(4);
      draft.a = draft.bar;
    });
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

    const state = create(data, (draft) => {
      draft.bar.a.push(draft.bar.b);
      draft.bar.b.x = 2;
    });
    expect(state).toEqual({
      bar: { a: [1, 2, 3, { x: 2 }], b: { x: 2 } },
    });
    expect(state.bar.a.slice(-1)[0]).toBe(state.bar.b);
  });

  test('base array unshift ref', () => {
    const data: any = {
      bar: { a: [1, 2, 3] as any, b: { x: 1 } },
    };

    const state = create(data, (draft) => {
      draft.bar.a.unshift(draft.bar.b);
      draft.bar.b.x = 2;
    });
    expect(state).toEqual({
      bar: { a: [{ x: 2 }, 1, 2, 3], b: { x: 2 } },
    });
    expect(state.bar.a[0]).toBe(state.bar.b);
  });

  test('base array splice ref', () => {
    const data: any = {
      bar: { a: [1, 2, 3] as any, b: { x: 1 } },
    };

    const state = create(data, (draft) => {
      draft.bar.a.splice(1, 1, draft.bar.b);
      draft.bar.b.x = 2;
    });
    expect(state).toEqual({
      bar: { a: [1, { x: 2 }, 3], b: { x: 2 } },
    });
    expect(state.bar.a[1]).toBe(state.bar.b);
  });

  test('base array set ref and reverse', () => {
    const data: any = {
      bar: { a: [1, 2, 3] as any, b: { x: 1 } },
    };

    const state = create(data, (draft) => {
      draft.bar.a.push(draft.bar.b);
      draft.bar.b.x = 2;
      draft.bar.a.reverse();
    });
    expect(state).toEqual({
      bar: { a: [{ x: 2 }, 3, 2, 1], b: { x: 2 } },
    });
    expect(state.bar.a[0]).toBe(state.bar.b);
  });

  test('base object set ref object1', () => {
    const data: any = {
      bar: { a: { c: 1 }, b: { x: 1 } },
    };

    const state = create(data, (draft) => {
      draft.bar.a.c = 2;
      draft.k = draft.bar;
      draft.k.a = 3;
    });
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

    const state = create(data, (draft) => {
      draft.bar.a.c = 2;
    });
    expect(state).toEqual({ bar: { a: { c: 2 }, b: { a: { c: 1 } } } });
  });

  test('set', () => {
    const data = {
      set: new Set<any>(['a']),
      b: { x: 1 },
    };

    const state = create(data, (draft) => {
      draft.set.add(draft.b);
      draft.b.x = 2;
    });
    expect(state).toEqual({
      set: new Set<any>(['a', { x: 2 }]),
      b: { x: 2 },
    });
    expect(Array.from(state.set).slice(-1)[0]).toBe(state.b);
  });

  test('map', () => {
    const data = {
      map: new Map<any, any>([['a', 1]]),
      b: { x: 1 },
    };

    const state = create(data, (draft) => {
      draft.map.set('b', draft.b);
      draft.b.x = 2;
    });
    expect(state).toEqual({
      map: new Map<any, any>([
        ['a', 1],
        ['b', { x: 2 }],
      ]),
      b: { x: 2 },
    });
    expect(state.map.get('b')).toBe(state.b);
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

describe('freeze', () => {
  test('object and array', () => {
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
      //@ts-expect-error
      state.bar.a = 3;
    }).toThrowError();
    expect(() => {
      //@ts-expect-error
      state.list.push({ id: 3 });
    }).toThrowError();
    expect(() => {
      //@ts-expect-error
      state.list[0].id = 3;
    }).toThrowError();
    expect(() => {
      //@ts-expect-error
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
      //@ts-expect-error
      state1.list[0].id = 3;
    }).toThrowError();
    expect(() => {
      //@ts-expect-error
      state1.list[1].id = 3;
    }).toThrowError();
    expect(() => {
      //@ts-expect-error
      state1.bar.a = 4;
    }).toThrowError();
    expect(() => {
      // just check runtime mutable
      // @ts-ignore
      state1.list.push({ id: 4 });
    }).not.toThrow();
  });

  test('set', () => {
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
      //@ts-expect-error
      state.set.add(4);
    }).toThrowError();
    expect(() => {
      //@ts-expect-error
      state.set.delete(1);
    }).toThrowError();
    expect(() => {
      //@ts-expect-error
      state.set.clear();
    }).toThrowError();
  });

  test('map', () => {
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
});

describe('hook in options', () => {
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
        hook: (target) => {
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
        hook: (target) => {
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
        hook: (target) => {
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
        hook: (target) => {
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
        hook: (target) => {
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
      map: new Map([[1, { foobar }]]),
    };

    const state = create(
      data,
      (draft) => {
        draft.foo.bar = 'new str';
        draft.map.get(1)!.foobar.text = 'new text';
      },
      {
        hook: (target) => {
          if (target === foobar) return 'mutable';
        },
      }
    );
    expect(state).toEqual({
      foo: {
        bar: 'new str',
      },
      map: new Map([[1, { foobar: { text: 'new text' } }]]),
    });
    expect(state).not.toBe(data);
    expect(state.foo).not.toBe(data.foo);
    expect(state.map.get(1)!.foobar).toBe(foobar);
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
        hook: (target) => {
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
});

describe('changes with mutable data', () => {
  test('object', () => {
    const foobar = {} as { text?: string };
    const data = {
      foo: {
        bar: 'str',
      },
      foobar: {} as any,
    };

    const state = create(data, (draft) => {
      draft.foobar = foobar;
      draft.foobar.text = 'new text0';
      foobar.text = 'new text1';
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

  test('array', () => {
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

  test('set', () => {
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

  test('map', () => {
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
});

describe('class instance ', () => {
  test('base', () => {
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

  test('hook', () => {
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
        hook: (target, { immutable }) => {
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
  // TODO: add test for class inherit instance
});

test('object case2', () => {
  const d = { e: 1 };
  const baseState = { a: { b: { c: { d } } }, f: { d } };
  const state = create(baseState, (draft) => {
    const a = draft.a.b;
    // @ts-ignore
    draft.x = a;
    a.c.d.e = 2;
  });
  // @ts-ignore
  expect(state.x === state.a.b).toBeTruthy();
});

test('cross case1', () => {
  const d = { e: 1 };
  const baseState = { a: { c: { e: 2 }, b: { c: { d } } }, f: { d } };
  const state = create(baseState, (draft) => {
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

test('cross case2', () => {
  const data = {
    foo: {
      bar: 'str',
    },
    foobar: {
      baz: 'str',
    },
  };

  const state = create(data, (draft: any) => {
    draft.foobar.foo = draft.foo;
    draft.foo.bar = 'new str';
    delete draft.foobar.foo;
  });
  expect(state).toEqual({
    foo: { bar: 'new str' },
    foobar: {
      baz: 'str',
    },
  });
  expect(state).not.toBe(data);
  expect(state.foo).not.toBe(data.foo);
  expect(state.foobar).toBe(data.foobar);
});
