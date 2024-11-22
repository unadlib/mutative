/* eslint-disable prefer-destructuring */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable consistent-return */
/* eslint-disable no-param-reassign */
import { create, current, isDraft } from '../src';

describe('current', () => {
  test('base', () => {
    const state = create({ a: { b: { c: 1 } }, d: { f: 1 } }, (draft) => {
      draft.a.b.c = 2;
      expect(current(draft.a)).toEqual({ b: { c: 2 } });
      // The node `a` has been modified.
      expect(current(draft.a) === current(draft.a)).toBeFalsy();
      // The node `d` has not been modified.
      expect(current(draft.d) === current(draft.d)).toBeTruthy();
    });
  });
  test('should return the current value', () => {
    interface Item {
      foo: string;
      bar?: { foobar: string };
      data?: { foo: string };
    }
    const set = new Set([1]);
    const boz = {
      a: 1,
      set,
    };
    const value = create(
      {
        arr: [{ foo: 'bar' } as Item],
        set: new Set<Item>([{ foo: 'bar' }]),
        map: new Map<string, Item>([['foo', { foo: 'bar' }]]),
        obj: { foo: 'bar' } as Item,
        data: { foo: 'bar' },
        boz,
      },
      (draft) => {
        const { data } = draft;
        draft.arr[0].foo = 'baz';
        expect(isDraft(draft.arr[0])).toBe(true);
        expect(current(draft.arr[0])).toEqual({ foo: 'baz' });
        // expect(current(draft.arr[0].bar!)).toBeUndefined();
        draft.arr[0].bar = { foobar: 'str' };
        draft.arr[0].bar.foobar = 'baz';
        expect(isDraft(draft.arr[0].bar)).toBe(false);
        // expect(current(draft.arr[0].bar)).toEqual({ foobar: 'baz' });
        data.foo = 'new str1';
        draft.arr[0].data = data;
        expect(current(draft.arr[0])).toEqual({
          bar: { foobar: 'baz' },
          data: { foo: 'new str1' },
          foo: 'baz',
        });

        Array.from(draft.set.values())[0].foo = 'baz';
        expect(isDraft(Array.from(draft.set.values())[0])).toBe(true);
        expect(current(Array.from(draft.set.values())[0])).toEqual({
          foo: 'baz',
        });
        Array.from(draft.set.values())[0].bar = { foobar: 'str' };
        Array.from(draft.set.values())[0].bar!.foobar = 'baz';
        expect(isDraft(Array.from(draft.set.values())[0].bar!)).toBe(false);
        // expect(current(Array.from(draft.set.values())[0].bar!)).toEqual({
        //   foobar: 'baz',
        // });
        data.foo = 'new str2';
        Array.from(draft.set.values())[0].data = data;
        expect(current(Array.from(draft.set.values())[0])).toEqual({
          bar: { foobar: 'baz' },
          data: { foo: 'new str2' },
          foo: 'baz',
        });

        expect(current(draft.set)).toEqual(
          new Set([
            { bar: { foobar: 'baz' }, data: { foo: 'new str2' }, foo: 'baz' },
          ])
        );

        draft.map.get('foo')!.foo = 'baz';
        expect(isDraft(draft.map.get('foo')!)).toBe(true);
        expect(current(draft.map.get('foo')!)).toEqual({ foo: 'baz' });
        draft.map.get('foo')!.bar = { foobar: 'str' };
        draft.map.get('foo')!.bar!.foobar = 'baz';
        expect(isDraft(draft.map.get('foo')!.bar!)).toBe(false);
        // expect(current(draft.map.get('foo')!.bar!)).toEqual({
        //   foobar: 'baz',
        // });
        data.foo = 'new str3';
        draft.map.get('foo')!.data = data;
        expect(current(draft.map.get('foo')!)).toEqual({
          bar: { foobar: 'baz' },
          data: { foo: 'new str3' },
          foo: 'baz',
        });

        draft.obj.foo = 'baz';
        expect(isDraft(draft.obj)).toBe(true);
        expect(current(draft.obj)).toEqual({ foo: 'baz' });
        draft.obj.bar = { foobar: 'str' };
        draft.obj.bar!.foobar = 'baz';
        expect(isDraft(draft.obj.bar)).toBe(false);
        // expect(current(draft.obj.bar)).toEqual({ foobar: 'baz' });
        data.foo = 'new str4';
        draft.obj.data = data;
        expect(current(draft.obj)).toEqual({
          bar: { foobar: 'baz' },
          data: { foo: 'new str4' },
          foo: 'baz',
        });
        draft.boz.a = 2;
        expect(current(draft.boz).set).toBe(boz.set);
      },
      {
        mark: (target, { mutable }) => {
          if (target === set) return mutable;
        },
      }
    );
  });
});

test('nested draft', () => {
  type Data = {
    f: {
      f: {
        f: {
          a: number;
        };
      };
    };
  };
  type State = {
    c: {
      a: number;
    };
    d: {
      d: number | Data;
    };
    map: Map<
      string,
      {
        d: {
          d: number | Data;
        };
      }
    >;
    set: Set<{
      d: {
        d: number;
      };
    }>;
    j: {
      k: number;
    };
  };
  const baseState: State = {
    c: {
      a: 1,
    },
    d: {
      d: 1,
    },
    map: new Map([
      [
        'd',
        {
          d: {
            d: 1,
          },
        },
      ],
    ]),

    set: new Set([
      {
        d: {
          d: 1,
        },
      },
    ]),
    j: {
      k: 1,
    },
  };
  create(baseState, (draft) => {
    draft.c.a = 2;
    draft.d.d = {
      f: {
        f: {
          f: draft.c,
        },
      },
    };
    draft.map.get('d')!.d.d = {
      f: {
        f: {
          f: draft.c,
        },
      },
    };
    // @ts-ignore
    draft.set.values().next().value!.d!.d = {
      f: {
        f: {
          f: draft.c,
        },
      },
    };
    const d = current(draft.d);
    const map = current(draft.map);
    const set = current(draft.set);
    expect((d.d as Data).f.f.f).toEqual({ a: 2 });
    expect(isDraft((d.d as Data).f.f.f)).toBeFalsy();
    expect((map.get('d')!.d.d as Data).f.f.f).toEqual({ a: 2 });
    // @ts-ignore
    expect(isDraft((map.get('d')!.d.d as Data).f.f.f)).toBeFalsy();
    // @ts-ignore
    const f = set.values().next().value!.d.d.f.f.f;
    expect(f).toEqual({ a: 2 });
    expect(isDraft(f)).toBeFalsy();
    // the node `d` has been changed
    expect(current(draft.d) === current(draft.d)).toBeFalsy();
    // the node `j` has not been changed
    expect(current(draft.j) === current(draft.j)).toBeTruthy();
  });
});

test('#47 current creates new copies of the objects where unnecessary', () => {
  const obj = { k: 42 };
  const original = { x: { y: { z: [obj] } } };
  const yReplace = { z: [obj] };

  // with create
  const withCreate = create(original, (draft) => {
    draft.x.y = yReplace;
  });
  expect(withCreate.x.y === yReplace).toBe(true);
  expect(withCreate.x.y.z[0] === obj).toBe(true);
  // with draft + current
  const [draft] = create(original);
  draft.x.y = yReplace;
  const withDraft = current(draft);
  expect(withDraft.x.y === yReplace).toBe(true);
  expect(withDraft.x.y.z[0] === obj).toBe(true);
});

test('current() for changed Set/Map draft', () => {
  const obj = { k: 42 };
  const base = { x: { y: { z: obj } }, a: new Set([1]), b: new Map([[1, 2]]) };
  create(base, (draft) => {
    draft.a.add(2);
    draft.b.delete(1);
    draft.x.y.z = { k: 43 };
    const c = current(draft);
    expect(c.a.has(2)).toBeTruthy();
    expect(c.a.has(1)).toBeTruthy();
    expect(c.b.has(1)).toBeFalsy();
    expect(c.x.y.z.k).toBe(43);
    expect(JSON.stringify(c)).toMatchInlineSnapshot(
      `"{"x":{"y":{"z":{"k":43}}},"a":{},"b":{}}"`
    );
  });
});

test('Avoid deep copies', () => {
  const obj = { k: 42 };
  const base = { x: { y: { z: obj } }, a: { c: 1 } };
  create(base, (draft) => {
    // @ts-ignore
    const a = draft.a;
    a.c = 2;
    // @ts-ignore
    delete draft.a;
    // @ts-ignore
    draft.x1 = { y1: { z1: obj }, a };
    const c = current(draft);
    // @ts-ignore
    expect(c.x1.y1.z1).toBe(obj);
    expect(JSON.stringify(c)).toMatchInlineSnapshot(
      `"{"x":{"y":{"z":{"k":42}}},"x1":{"y1":{"z1":{"k":42}},"a":{"c":2}}}"`
    );
  });
});

test('nested create() - Avoid deep copies', () => {
  const obj = { k: 42 };
  const base = { x: { y: { z: obj } }, a: { c: 1 } };
  const base0 = { x: { y: { z: obj } }, a: { c: 1 } };
  create(base0, (draft0) => {
    // @ts-ignore
    const a = draft0.a;
    a.c = 2;
    // @ts-ignore
    delete draft0.a;
    create(base, (draft) => {
      // @ts-ignore
      draft.x1 = { y1: { z1: obj }, a };
      const c = current(draft);
      // @ts-ignore
      expect(c.x1.y1.z1).toBe(obj);
      expect(JSON.stringify(c)).toMatchInlineSnapshot(
        `"{"x":{"y":{"z":{"k":42}}},"a":{"c":1},"x1":{"y1":{"z1":{"k":42}},"a":{"c":2}}}"`
      );
    });
  });
});


test('#61 - type issue: current of Draft<T> type should return T type', () => {
  function test<T extends { x: { y: ReadonlySet<string> } }>(base: T): T {
    const [draft] = create(base);
    const currentValue0 = current(draft); // Type Draft<T> is assignable to type T
    const currentValue1: T = current(base); // T is assignable to type T
    return currentValue0;
  }
});
