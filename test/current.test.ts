import { create, current, isDraft } from '../src';

describe('current', () => {
  test('should return the current value', () => {
    interface Item {
      foo: string;
      bar?: { foobar: string };
      data?: { foo: string };
    }
    const value = create(
      {
        arr: [{ foo: 'bar' } as Item],
        set: new Set<Item>([{ foo: 'bar' }]),
        map: new Map<string, Item>([['foo', { foo: 'bar' }]]),
        obj: { foo: 'bar' } as Item,
        data: { foo: 'bar' },
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
      }
    );
  });
});

test.skip('nested draft', () => {
  create(
    {
      c: {
        a: 1,
      },
      d: {
        d: 1,
      },
    },
    (draft) => {
      draft.c.a = 2;
      // @ts-ignore
      draft.d.d = {
        f: {
          f: {
            f: draft.c,
          },
        },
      };
      const a = current(draft.d);
    }
  );
});
