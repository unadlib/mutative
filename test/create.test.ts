/* eslint-disable no-promise-executor-return */
/* eslint-disable lines-between-class-members */
/* eslint-disable consistent-return */
/* eslint-disable no-unused-expressions */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable no-param-reassign */
/* eslint-disable no-plusplus */
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

    const state = create(data, (draft) => {
      draft.foo.bar!.b = 'new str';
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

  test('object with Symbol key', () => {
    const a = Symbol('a');
    const data = {
      foo: {
        [a]: 'str',
      },
      foobar: {
        baz: 'str',
      },
    };

    const state = create(data, (draft) => {
      draft.foo[a] = 'new str';
    });
    expect(state).toEqual({
      foo: { [a]: 'new str' },
      foobar: { baz: 'str' },
    });
    expect(state).not.toBe(data);
    expect(state.foo).not.toBe(data.foo);
    expect(state.foobar).toBe(data.foobar);
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
      draft.list.copyWithin(-2, 0);
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
      map: new Map<Record<string, any>, Record<string, any>>([
        [a, {}],
        [b, {}],
        [{}, {}],
      ]),
    };

    const state = create(data, (draft) => {
      const iterator = draft.map.values();
      iterator.next().value.x = 1;
      for (const [key, item] of draft.map) {
        if (item.x === 1) {
          item.c = 2;
        }
      }

      expect(iterator.next().done).toBe(false);
      expect(iterator.next().done).toBe(false);
      expect(iterator.next().done).toBe(true);
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
      set: new Set<Record<string, any>>([a, b]),
    };

    const state = create(data, (draft) => {
      draft.set.values().next().value.x = 1;
      const [first] = draft.set.values();
      expect(draft.set.has(first)).toBeTruthy();
      for (const item of draft.set) {
        if (item.x === 1) {
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
      draft.foo.bar = 'str';
    });
    expect(state).toBe(data);
  });
  test('assign the original value to a draft', () => {
    const a = {
      a: 2,
    };
    const data = {
      s: {
        a: 1,
      },
      a,
    };

    const state = create(data, (draft) => {
      draft.a.a = 2;
      draft.a = a;
    });

    expect(state).toBe(data);
  });
  test('object delete', () => {
    const data: {
      foo: {
        bar: string;
      };
      foobar: {
        baz: string;
      };
      foobar1?: number;
    } = {
      foo: {
        bar: 'str',
      },
      foobar: {
        baz: 'str',
      },
    };

    const state = create(data, (draft) => {
      delete draft.foobar1;
    });
    expect(state).toBe(data);
  });

  test('array with setter', () => {
    const data = {
      arr: ['str'] as any,
      foo: 'bar',
    };

    const state = create(data, (draft) => {
      draft.arr[0] = 'str';
    });
    expect(state).toBe(data);
  });

  test('array set length', () => {
    const data = {
      arr: ['str'] as any,
      foo: 'bar',
    };

    const state = create(data, (draft) => {
      draft.arr.length = 1;
    });
    expect(state).toBe(data);
  });

  test('set about new value operations', () => {
    const data = {
      set: new Set([{ a: 1 }]),
      foo: 'bar',
    };

    const state = create(data, (draft) => {
      draft.set.values().next().value.a = 1;
    });
    expect(state).toBe(data);
  });

  test('map with new value operations', () => {
    const data = {
      map: new Map([
        [1, 'a'],
        [2, 'b'],
        [3, 'c'],
      ]),
      foo: 'bar',
    };

    const state = create(data, (draft) => {
      draft.map.set(1, 'a');
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
      draft.map.get(1)!.a.b = 1;
      draft.map.get(2)!.a.b = 2;
      draft.map.get(3)!.a.b = 3;
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
  test('custom shallow copy', () => {
    const data = {
      foo: {
        bar: 'str',
      },
      date: new Date(0),
    };

    const state = create(
      data,
      (draft) => {
        draft.date.setMilliseconds(42);
      },
      {
        mark: (target) => {
          if (target instanceof Date) return () => new Date(target.getTime());
        },
      }
    );
    expect(data).not.toBe(state);
    expect(data.foo).toBe(state.foo);
    expect(data.date).not.toBe(state.date);
    expect(state.date.getTime()).toBe(42);
    expect(data.date.getTime()).not.toBe(42);
  });

  class A {}

  test.each([
    { value: 0 },
    { value: 1 },
    { value: null },
    { value: true },
    { value: false },
    { value: {} },
    { value: [] },
    { value: new A() },
  ])('Unexpected mark function $value', ({ value }) => {
    const data = {
      foo: 'str',
    };

    expect(() => {
      create(
        data,
        (draft) => {
          draft.foo = 'bar';
        },
        {
          // @ts-expect-error
          mark: (target) => {
            if (typeof target === 'object') return value;
          },
        }
      );
    }).toThrowError(/Unsupported mark result/);
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
        mark: (target, { mutable }) => {
          if (target === data.foobar) return mutable;
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
      map: new Map([[1, { foobar }]]),
    };

    const state = create(
      data,
      (draft) => {
        draft.foo.bar = 'new str';
        draft.map.get(1)!.foobar.text = 'new text';
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
        const iterator = draft.set.values();
        iterator.next().value.text = 'new text';
        expect(iterator.next().done).toBe(true);
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
  // TODO: add test for class inherit instance

  test('class with getters - should use a method to assing a field using a getter that return a non primitive object', () => {
    class State {
      _bar = { baz: 1 };
      foo: any;
      get bar() {
        return this._bar;
      }
      syncFoo() {
        const value = this.bar.baz;
        this.foo = value;
        this.bar.baz++;
      }
    }
    const state = new State();

    const newState = create(
      state,
      (draft) => {
        draft.syncFoo();
      },
      {
        mark: (target, { immutable }) => {
          if (target instanceof State) return immutable;
        },
      }
    );
    expect(newState.foo).toEqual(1);
    expect(newState.bar).toEqual({ baz: 2 });
    expect(state.bar).toEqual({ baz: 1 });
  });

  test('super class with getters - should use a method to assing a field using a getter that return a non primitive object', () => {
    class BaseState {
      _bar = { baz: 1 };
      foo: any;
      get bar() {
        return this._bar;
      }
      syncFoo() {
        const value = this.bar.baz;
        this.foo = value;
        this.bar.baz++;
      }
    }

    class State extends BaseState {}

    const state = new State();
    const newState = create(
      state,
      (draft) => {
        draft.syncFoo();
      },
      {
        mark: (target, { immutable }) => {
          if (target instanceof State) return immutable;
        },
      }
    );
    expect(newState.foo).toEqual(1);
    expect(newState.bar).toEqual({ baz: 2 });
    expect(state.bar).toEqual({ baz: 1 });
  });

  test('class with setters - should define a field with a setter', () => {
    class State {
      _bar = 0;
      get bar() {
        return this._bar;
      }
      set bar(x) {
        this._bar = x;
      }
    }
    const state = new State();

    const newState3 = create(
      state,
      (d) => {
        d.bar = 1;
        expect(d._bar).toEqual(1);
      },
      {
        mark: (target, { immutable }) => {
          if (target instanceof State) return immutable;
        },
      }
    );
    expect(newState3._bar).toEqual(1);
    expect(newState3.bar).toEqual(1);
    expect(state._bar).toEqual(0);
    expect(state.bar).toEqual(0);
  });

  test('object with setters - should define a field with a setter', () => {
    const data = {
      _bar: 1,
      get bar() {
        return this._bar;
      },
      set bar(x) {
        this._bar = x;
      },
    };

    const state = create(
      data,
      (draft) => {
        draft.bar = 2;
        expect(draft._bar).toEqual(1);
      },
      {
        mark: (target, { immutable }) => {
          if (target === data) return immutable;
        },
      }
    );
    expect(state._bar).toEqual(1);
    expect(state.bar).toEqual(2);
    expect(data._bar).toEqual(1);
    expect(data.bar).toEqual(1);
  });

  test('setter only', () => {
    let setterCalled = 0;
    class State {
      x = 0;
      set y(value: any) {
        setterCalled++;
        this.x = value;
      }
    }

    const state = new State();
    const next = create(
      state,
      (draft) => {
        expect(draft.y).toBeUndefined();
        draft.y = 2; // setter is inherited, so works
        expect(draft.x).toBe(2);
      },
      {
        mark: (target, { immutable }) => {
          if (target instanceof State) return immutable;
        },
      }
    );
    expect(setterCalled).toBe(1);
    expect(next.x).toBe(2);
    expect(state.x).toBe(0);
  });

  test('getter only', () => {
    let getterCalled = 0;
    class State {
      x = 0;
      get y() {
        getterCalled++;
        return this.x;
      }
    }

    const state = new State();
    const next = create(
      state,
      (draft) => {
        expect(draft.y).toBe(0);
        expect(() => {
          draft.y = 2;
        }).toThrow('Cannot set property y');
        draft.x = 2;
        expect(draft.y).toBe(2);
      },
      {
        mark: (target, { immutable }) => {
          if (target instanceof State) return immutable;
        },
      }
    );
    expect(next.x).toBe(2);
    expect(next.y).toBe(2);
    expect(state.x).toBe(0);
  });

  test('own setter only', () => {
    let setterCalled = 0;
    const state = {
      x: 0,
      set y(value: any) {
        setterCalled++;
        this.x = value;
      },
    };

    const next = create(state, (draft) => {
      expect(draft.y).toBeUndefined();
      // setter is not preserved, so we can write
      draft.y = 2;
      expect(draft.x).toBe(0);
      expect(draft.y).toBe(2);
    });
    expect(setterCalled).toBe(0);
    expect(next.x).toBe(0);
    expect(next.y).toBe(2);
    expect(state.x).toBe(0);
  });

  test('own getter only', () => {
    let getterCalled = 0;
    const state = {
      x: 0,
      get y() {
        getterCalled++;
        return this.x;
      },
    };

    const next = create(state, (draft) => {
      expect(draft.y).toBe(0);
      // de-referenced, so stores it locally
      draft.y = 2;
      expect(draft.y).toBe(2);
      expect(draft.x).toBe(0);
    });
    expect(getterCalled).not.toBe(1);
    expect(next.x).toBe(0);
    expect(next.y).toBe(2);
    expect(state.x).toBe(0);
  });

  test('can work with class with computed props', () => {
    class State {
      x = 1;

      set y(v) {
        this.x = v;
      }

      get y() {
        return this.x;
      }
    }

    const baseState = new State();

    const nextState = create(
      baseState,
      (d) => {
        expect(d.y).toBe(1);
        d.y = 2;
        expect(d.x).toBe(2);
        expect(d.y).toBe(2);
        expect(Object.getOwnPropertyDescriptor(d, 'y')).toBeUndefined();
      },
      {
        mark: (target, { immutable }) => {
          if (target instanceof State) return immutable;
        },
      }
    );
    expect(baseState.x).toBe(1);
    expect(baseState.y).toBe(1);

    expect(nextState.x).toBe(2);
    expect(nextState.y).toBe(2);
    expect(Object.getOwnPropertyDescriptor(nextState, 'y')).toBeUndefined();
  });

  test('array about getOwnPropertyDescriptor', () => {
    create([1], (d) => {
      expect(Object.getOwnPropertyDescriptor(d, 'length')).not.toBeUndefined();
    });
  });
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

test('cross case1', () => {
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
  expect(state.foobar).not.toBe(data.foobar);
});

describe('error', () => {
  test('not support: defineProperty', () => {
    const data = {};

    expect(() => {
      create(data, (draft) => {
        Object.defineProperty(draft, 'foo', {});
      });
    }).toThrowError(`Cannot call 'defineProperty()' on drafts`);
  });

  test('not support: setPrototypeOf', () => {
    const data = {};

    expect(() => {
      create(data, (draft) => {
        Object.setPrototypeOf(draft, {});
      });
    }).toThrowError(`Cannot call 'setPrototypeOf()' on drafts`);
  });
});

test('can work with own computed props with enableAutoFreeze', () => {
  const baseState = {
    x: 1,
    get y() {
      return this.x;
    },
    set y(v) {
      this.x = v;
    },
  };

  const nextState = create(
    baseState,
    (d) => {
      expect(d.y).toBe(1);
      d.x = 2;
      expect(d.x).toBe(2);
      expect(d.y).toBe(1); // this has been copied!
      d.y = 3;
      expect(d.x).toBe(2);
    },
    {
      enableAutoFreeze: true,
    }
  );
  expect(baseState.x).toBe(1);
  expect(baseState.y).toBe(1);

  expect(nextState.x).toBe(2);
  expect(nextState.y).toBe(3);
});

test('can work with own computed props', () => {
  const baseState = {
    x: 1,
    get y() {
      return this.x;
    },
    set y(v) {
      this.x = v;
    },
  };

  const nextState = create(baseState, (d) => {
    expect(d.y).toBe(1);
    d.x = 2;
    expect(d.x).toBe(2);
    expect(d.y).toBe(1); // this has been copied!
    d.y = 3;
    expect(d.x).toBe(2);
  });
  expect(baseState.x).toBe(1);
  expect(baseState.y).toBe(1);

  expect(nextState.x).toBe(2);
  expect(nextState.y).toBe(3);
  nextState.y = 4; // decoupled now!
  expect(nextState.y).toBe(4);
  expect(nextState.x).toBe(2);
  expect(Object.getOwnPropertyDescriptor(nextState, 'y')!.value).toBe(4);
});

test('set a Set value', () => {
  const data = {
    set: new Set<any>([1, 2, 3]),
    bar: {
      baz: 'str',
    },
  };

  const state = create(data, (draft) => {
    draft.set = new Set([draft.bar, 1, 2, 3]);
  });
  const fistItem = state.set.values().next().value;
  expect(fistItem).toBe(state.bar);
  expect(isDraft(fistItem)).toBe(false);
});

test('Set with enable patches in root', () => {
  const [state, patches, inversePatches] = create(
    new Set<any>([1, 2]),
    (draft) => {
      draft.add({});
    },
    {
      enablePatches: true,
    }
  );
  expect(state).toEqual(new Set([1, 2, {}]));
  expect(patches).toEqual([{ op: 'add', path: [2], value: {} }]);
  expect(inversePatches).toEqual([{ op: 'remove', path: [2], value: {} }]);
});

test('copy error: check stable mark()', () => {
  let time = 0;
  class Foo {
    bar = 0;
  }
  expect(() => {
    create(
      {
        foo: new Foo(),
      },

      (draft) => {
        draft.foo.bar = 1;
      },
      {
        mark: (target, { immutable }) => {
          if (target instanceof Foo && time < 2) {
            time += 1;
            return immutable;
          }
        },
      }
    );
  }).toThrowErrorMatchingInlineSnapshot(
    `"Please check mark() to ensure that it is a stable marker draftable function."`
  );
});

test('enablePatches and changes', () => {
  expect(() => {
    create(
      { a: { b: 1 }, c: 1 },
      (draft) => {
        draft.c = 2;
        draft.a.b;
      },
      {
        enablePatches: true,
      }
    );
  }).not.toThrowError();
});

test(`Don't auto freeze non-enumerable or symbolic properties`, () => {
  const component = {};
  Object.defineProperty(component, 'state', {
    value: { x: 1 },
    enumerable: false,
    writable: true,
    configurable: true,
  });

  const state = {
    x: 1,
  };

  const state2: any = create(
    state,
    (draft) => {
      // @ts-expect-error
      draft.ref = component;
    },
    {
      enableAutoFreeze: true,
    }
  );

  state2.ref.state.x++;

  expect(Object.isFrozen(state2)).toBeTruthy();
  expect(Object.isFrozen(state2.ref)).toBeTruthy();
  // Do not auto freeze non-enumerable or symbolic properties
  expect(Object.isFrozen(state2.ref.state)).toBeFalsy();
});

test('create options', () => {
  expect(() => {
    create(
      {},
      () => {
        //
      }, // @ts-expect-error
      () => {
        //
      }
    );
  }).toThrowErrorMatchingInlineSnapshot(`
    "Invalid options: () => {
                //
            }, 'options' should be an object."
  `);
});
