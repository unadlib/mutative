/* eslint-disable prefer-destructuring */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable consistent-return */
/* eslint-disable no-param-reassign */
import { create, current, isDraft } from '../src';

describe('current', () => {
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
    draft.set.values().next().value.d.d = {
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
    expect(isDraft((map.get('d')!.d.d as Data).f.f.f)).toBeFalsy();
    const f = set.values().next().value.d.d.f.f.f;
    expect(f).toEqual({ a: 2 });
    expect(isDraft(f)).toBeFalsy();
  });
});
