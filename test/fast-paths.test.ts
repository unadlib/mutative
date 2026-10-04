/* eslint-disable @typescript-eslint/no-explicit-any */
import { apply, create, current, isDraft } from '../src';

describe('draft fast paths keep the original semantics', () => {
  test('current() snapshots a plain Set that contains drafts', () => {
    let snapshot: any;
    create({ a: { child: { x: 1 } } }, (draft: any) => {
      draft.a.child.x = 2;
      draft.a.s = new Set([draft.a.child]);
      snapshot = current(draft.a);
    });
    const [item] = [...snapshot.s];
    expect(isDraft(item)).toBe(false);
    expect(item).toEqual({ x: 2 });
  });

  test('current() keeps a plain Set without drafts by identity', () => {
    const inner = new Set([{ q: 1 }]);
    let snapshot: any;
    create({ a: { t: 0 } } as any, (draft: any) => {
      draft.a.s = inner;
      draft.a.t = 1;
      snapshot = current(draft.a);
    });
    expect(snapshot.s).toBe(inner);
  });

  test('a draft referenced from a plain Set and assigned elsewhere generates patches', () => {
    const base: any = { a: { child: {} }, b: {} };
    const [state, patches, inversePatches] = create(
      base,
      (draft: any) => {
        const a = draft.a;
        a.s = new Set([a.child]);
        draft.b.a = a;
      },
      { enablePatches: true }
    );
    expect(state.b.a).toBe(state.a);
    expect(state.a.s.has(state.a.child)).toBe(true);
    expect(apply(base, patches)).toEqual(state);
    expect(apply(state, inversePatches)).toEqual(base);
  });

  test('array copies keep holes', () => {
    // eslint-disable-next-line no-sparse-arrays
    const state = create([, 1] as any[], (draft) => {
      draft[1] = 2;
    });
    expect(0 in state).toBe(false);
    expect(Object.keys(state)).toEqual(['1']);
    // eslint-disable-next-line no-sparse-arrays
    const frozen = create(Object.freeze([, 1]) as any[], (draft) => {
      draft[1] = 2;
    });
    expect(0 in frozen).toBe(false);
  });

  test('array copies ignore an own Symbol.iterator', () => {
    const base: any = [1, 2, 3];
    base[Symbol.iterator] = function* () {
      yield 9;
    };
    const state = create(base, (draft: any) => {
      draft[0] = 7;
    });
    expect(Array.from(Array.prototype.values.call(state))).toEqual([7, 2, 3]);
  });

  test('array copies preserve subclasses', () => {
    class List extends Array<number> {}
    const state = create(List.from([1, 2]), (draft) => {
      draft[0] = 7;
    });
    expect(state).toBeInstanceOf(List);
    expect([...state]).toEqual([7, 2]);
    const frozen = create(Object.freeze(List.from([1, 2])), (draft) => {
      draft[0] = 7;
    });
    expect(frozen).toBeInstanceOf(List);
  });

  test('reading a copied plain value does not re-invoke the original getter', () => {
    let calls = 0;
    const base = {
      other: 1,
      get g() {
        calls += 1;
        return 'v';
      },
    };
    create(base, (draft) => {
      draft.other = 2;
      expect(draft.g).toBe('v');
      expect(draft.g).toBe('v');
      expect(draft.g).toBe('v');
    });
    expect(calls).toBe(1);
    let reads = 0;
    const throwing = {
      other: 1,
      get g() {
        reads += 1;
        if (reads > 1) throw new Error('second read');
        return 'v';
      },
    };
    expect(
      create(throwing, (draft) => {
        draft.other = 2;
        expect(draft.g).toBe('v');
      }).other
    ).toBe(2);
  });

  test('accessors returning non-draftable objects are read once', () => {
    for (const make of [() => new Date(0), () => /x/]) {
      let reads = 0;
      const base = {
        count: 0,
        get value() {
          reads += 1;
          if (reads > 1) throw new Error('second read');
          return make();
        },
      };
      const next = create(base, (draft) => {
        draft.count = 1;
        expect(draft.value).toEqual(make());
      });
      expect(next.count).toBe(1);
      expect(reads).toBe(1);
    }
  });

  test('a fresh object from an accessor is not drafted on first access', () => {
    const base = {
      get item() {
        return { x: 1 };
      },
    };
    const next = create(base, (draft: any) => {
      draft.item.x = 2;
    });
    expect(next).toBe(base);
  });

  test('child draft cache follows the current value', () => {
    const base = { a: { v: 1 }, b: { v: 2 }, [Symbol.for('s')]: { v: 3 } };
    const next = create(base, (draft: any) => {
      const a = draft.a;
      expect(draft.a).toBe(a);
      // assigning the original back re-drafts on the next read
      draft.a = base.a;
      const again = draft.a;
      expect(again).not.toBe(a);
      expect(isDraft(again)).toBe(true);
      again.v = 10;
      // a child moved to another key is still a draft there
      draft.b = draft.a;
      expect(draft.b).toBe(draft.a);
      // symbol keys are cached too
      const s = draft[Symbol.for('s')];
      expect(draft[Symbol.for('s')]).toBe(s);
      s.v = 30;
      delete draft.b;
      expect(draft.b).toBeUndefined();
    });
    expect(next).toEqual({ a: { v: 10 }, [Symbol.for('s')]: { v: 30 } });
    expect(base.a).toEqual({ v: 1 });
  });

  test('a moved first child stays valid when its key is drafted again', () => {
    const base = { a: { v: 1 }, b: { v: 2 } };
    const next = create(base, (draft: any) => {
      const a = draft.a;
      draft.b = a;
      draft.a = base.a;
      const again = draft.a;
      expect(again).not.toBe(a);
      expect(isDraft(again)).toBe(true);
      expect(draft.b).toBe(a);
      again.v = 10;
      a.v = 20;
    });
    expect(next).toEqual({ a: { v: 10 }, b: { v: 20 } });
    expect(base).toEqual({ a: { v: 1 }, b: { v: 2 } });
  });

  test('array child draft cache survives reverse()', () => {
    const base = { arr: [{ v: 0 }, { v: 1 }, { v: 2 }] };
    const [next, patches, inversePatches] = create(
      base,
      (draft) => {
        const first = draft.arr[0];
        draft.arr.reverse();
        expect(draft.arr[2]).toBe(first);
        draft.arr[2].v = 9;
        draft.arr[0].v = 8;
      },
      { enablePatches: true }
    );
    expect(next.arr).toEqual([{ v: 8 }, { v: 1 }, { v: 9 }]);
    expect(base.arr).toEqual([{ v: 0 }, { v: 1 }, { v: 2 }]);
    expect(apply(base, patches)).toEqual(next);
    expect(apply(next, inversePatches)).toEqual(base);
  });

  test('a Set of array drafts can be iterated twice', () => {
    const base = { s: new Set([[1, 2], [3]]) };
    const next = create(base, (draft) => {
      for (const arr of draft.s) arr.push(0);
      let total = 0;
      for (const arr of draft.s) total += arr.length;
      expect(total).toBe(5);
    });
    expect([...next.s]).toEqual([
      [1, 2, 0],
      [3, 0],
    ]);
    expect([...base.s]).toEqual([[1, 2], [3]]);
  });

  test('wide object copies keep an own __proto__ key as a data property', () => {
    const base = JSON.parse('{"__proto__":{"polluted":1},"k":1}');
    for (let index = 0; index < 200; index += 1) base[`p${index}`] = index;
    const state = create(base, (draft: any) => {
      draft.k = 2;
    });
    expect(Object.getPrototypeOf(state)).toBe(Object.prototype);
    expect((state as any).polluted).toBeUndefined();
    const descriptor = Object.getOwnPropertyDescriptor(state, '__proto__');
    expect(descriptor && 'value' in descriptor).toBe(true);
  });
  test('wide object copies keep own enumerable symbols like a spread', () => {
    const visible = Symbol('visible');
    const hidden = Symbol('hidden');
    const base: any = { k: 1, [visible]: 'shown' };
    Object.defineProperty(base, hidden, { value: 'hidden', enumerable: false });
    for (let index = 0; index < 200; index += 1) base[`p${index}`] = index;
    const state: any = create(base, (draft: any) => {
      draft.k = 2;
    });
    expect(state.k).toBe(2);
    expect(state[visible]).toBe('shown');
    expect(Object.getOwnPropertySymbols(state)).toStrictEqual(
      Object.getOwnPropertySymbols({ ...base })
    );
    expect(Object.keys(state)).toStrictEqual(Object.keys(base));
  });

  test('marked instances keep writable properties that are not enumerable', () => {
    class Model {
      value = 1;
    }
    const base = new Model();
    Object.defineProperty(base, 'hidden', {
      value: 'kept',
      writable: true,
      enumerable: false,
      configurable: true,
    });
    const state: any = create(
      base,
      (draft) => {
        draft.value = 2;
      },
      {
        mark: (target, { immutable }) =>
          target instanceof Model ? immutable : undefined,
      }
    );
    expect(state).not.toBe(base);
    expect(state).toBeInstanceOf(Model);
    expect(state.value).toBe(2);
    expect(Object.getOwnPropertyDescriptor(state, 'hidden')).toStrictEqual({
      value: 'kept',
      writable: true,
      enumerable: false,
      configurable: true,
    });
  });

  test.each(['x', 'notAnArrayIndexKey'])(
    'arrays reject the non-index key %s at any length',
    (key) => {
      expect(() =>
        create({ list: [1] }, (draft: any) => {
          draft.list[key] = 1;
        })
      ).toThrow(
        "Only supports setting array indices and the 'length' property."
      );
    }
  );

  test('arrays reject symbol keys like other non-index keys and still read them', () => {
    const message =
      "Only supports setting array indices and the 'length' property.";
    const tag = Symbol('tag');
    const list: any = [1];
    list[tag] = 'kept';
    const base = { list };
    expect(() =>
      create(base, (draft: any) => {
        draft.list[tag] = 'changed';
      })
    ).toThrow(message);
    expect(() =>
      create(base, (draft: any) => {
        draft.list[Symbol('new')] = 1;
      })
    ).toThrow(message);
    expect(() =>
      create(base, (draft: any) => {
        delete draft.list[tag];
      })
    ).toThrow(message);
    const state = create(base, (draft: any) => {
      expect(draft.list[tag]).toBe('kept');
    });
    expect(state).toBe(base);
    expect(Object.getOwnPropertySymbols(base.list)).toStrictEqual([tag]);
  });

  test('an unmodified draft added to a container created later is patched as its original', () => {
    const base = { a: { x: { v: 1 } }, b: [] as { v: number }[] };
    const [state, patches, inverse] = create(
      base,
      (draft) => {
        const x = draft.a.x;
        draft.b.push(x);
      },
      { enablePatches: true }
    );
    expect(state.b[0]).toBe(base.a.x);
    expect(patches).toStrictEqual([
      { op: 'add', path: ['b', 0], value: { v: 1 } },
    ]);
    expect(patches[0].value).toBe(base.a.x);
    expect(isDraft(patches[0].value)).toBe(false);
    expect(apply(base, patches)).toStrictEqual(state);
    expect(apply(state, inverse)).toStrictEqual(base);
  });
});
