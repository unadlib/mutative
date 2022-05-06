import { create, original, isDraft } from '../src';

describe('original', () => {
  test('should return the original value', () => {
    interface Item {
      foo: string;
      bar?: { foobar: string };
    }
    const value = create(
      {
        arr: [{ foo: 'bar' } as Item],
        set: new Set<Item>([{ foo: 'bar' }]),
        map: new Map<string, Item>([['foo', { foo: 'bar' }]]),
        obj: { foo: 'bar' } as Item,
      },
      (draft) => {
        draft.arr[0].foo = 'baz';
        expect(isDraft(draft.arr[0])).toBe(true);
        expect(original(draft.arr[0])).toEqual({ foo: 'bar' });
        expect(original(draft.arr[0].bar!)).toBeUndefined();
        draft.arr[0].bar = { foobar: 'str' };
        draft.arr[0].bar.foobar = 'baz';
        expect(isDraft(draft.arr[0].bar)).toBe(false);
        expect(original(draft.arr[0].bar)).toEqual({ foobar: 'baz' });

        Array.from(draft.set.values())[0].foo = 'baz';
        expect(isDraft(Array.from(draft.set.values())[0])).toBe(true);
        expect(original(Array.from(draft.set.values())[0])).toEqual({
          foo: 'bar',
        });
        Array.from(draft.set.values())[0].bar = { foobar: 'str' };
        Array.from(draft.set.values())[0].bar!.foobar = 'baz';
        expect(isDraft(Array.from(draft.set.values())[0].bar)).toBe(false);
        expect(original(Array.from(draft.set.values())[0].bar)).toEqual({
          foobar: 'baz',
        });

        draft.map.get('foo')!.foo = 'baz';
        expect(isDraft(draft.map.get('foo'))).toBe(true);
        expect(original(draft.map.get('foo'))).toEqual({ foo: 'bar' });
        draft.map.get('foo')!.bar = { foobar: 'str' };
        draft.map.get('foo')!.bar!.foobar = 'baz';
        expect(isDraft(draft.map.get('foo')!.bar)).toBe(false);
        expect(original(draft.map.get('foo')!.bar)).toEqual({
          foobar: 'baz',
        });

        draft.obj.foo = 'baz';
        expect(isDraft(draft.obj)).toBe(true);
        expect(original(draft.obj)).toEqual({ foo: 'bar' });
        draft.obj.bar = { foobar: 'str' };
        draft.obj.bar!.foobar = 'baz';
        expect(isDraft(draft.obj.bar)).toBe(false);
        expect(original(draft.obj.bar)).toEqual({ foobar: 'baz' });
      }
    );
  });
});
