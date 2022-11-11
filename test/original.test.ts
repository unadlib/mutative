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
        expect(() => original(draft.arr[0].bar!)).toThrowError();
        // !new props
        draft.arr[0].bar = { foobar: 'str' };
        draft.arr[0].bar.foobar = 'baz';
        expect(isDraft(draft.arr[0].bar)).toBe(false);
        expect(() => original(draft.arr[0].bar)).toThrowError();

        Array.from(draft.set.values())[0].foo = 'baz';
        expect(isDraft(Array.from(draft.set.values())[0])).toBe(true);
        expect(original(Array.from(draft.set.values())[0])).toEqual({
          foo: 'bar',
        });
        // !new props
        Array.from(draft.set.values())[0].bar = { foobar: 'str' };
        Array.from(draft.set.values())[0].bar!.foobar = 'baz';
        expect(isDraft(Array.from(draft.set.values())[0].bar)).toBe(false);
        expect(() =>
          original(Array.from(draft.set.values())[0].bar)
        ).toThrowError();

        draft.map.get('foo')!.foo = 'baz';
        expect(isDraft(draft.map.get('foo'))).toBe(true);
        expect(original(draft.map.get('foo'))).toEqual({ foo: 'bar' });
        // !new props
        draft.map.get('foo')!.bar = { foobar: 'str' };
        draft.map.get('foo')!.bar!.foobar = 'baz';
        expect(isDraft(draft.map.get('foo')!.bar)).toBe(false);
        expect(() => original(draft.map.get('foo')!.bar)).toThrowError();

        draft.obj.foo = 'baz';
        expect(isDraft(draft.obj)).toBe(true);
        expect(original(draft.obj)).toEqual({ foo: 'bar' });
        // !new props
        draft.obj.bar = { foobar: 'str' };
        draft.obj.bar!.foobar = 'baz';
        expect(isDraft(draft.obj.bar)).toBe(false);
        expect(() => original(draft.obj.bar)).toThrowError();
      }
    );
  });

  test('should return undefined for an object that is not proxied', () => {
    expect(() => original({})).toThrowError(
      `original() is only used for a draft, parameter: [object Object]`
    );
    expect(() => original(3)).toThrowError(
      `original() is only used for a draft, parameter: 3`
    );
  });
});
