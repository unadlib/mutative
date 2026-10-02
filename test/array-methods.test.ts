/* eslint-disable @typescript-eslint/no-explicit-any */
import { types } from 'node:util';
import { apply, create, current, isDraft, unsafe } from '../src';

const rows = (length: number) => Array.from({ length }, (_, id) => ({ id }));
const ids = (list: { id: number }[]) => list.map((item) => item.id);

function roundTrip<T extends object>(base: T, recipe: (draft: any) => void) {
  const [state, patches, inversePatches] = create(base, recipe, {
    enablePatches: true,
  }) as any;
  expect(apply(base, patches)).toEqual(state);
  expect(apply(state, inversePatches)).toEqual(base);
  return state;
}

describe('native array methods', () => {
  test('removed elements are drafts and the base stays untouched', () => {
    const base = { list: rows(5) };
    const state = roundTrip(base, (draft) => {
      const first = draft.list.shift();
      expect(isDraft(first)).toBe(true);
      first.id = 100;
      const [second] = draft.list.splice(0, 1);
      expect(isDraft(second)).toBe(true);
      second.id = 200;
      draft.list.push(first, second);
    });
    expect(ids(state.list)).toEqual([2, 3, 4, 100, 200]);
    expect(ids(base.list)).toEqual([0, 1, 2, 3, 4]);
  });

  test('a removed element that was already drafted keeps its draft', () => {
    const base = { list: rows(3) };
    create(base, (draft) => {
      const first = draft.list[0];
      const second = draft.list[1];
      expect(draft.list.shift()).toBe(first);
      expect(draft.list.splice(0, 1)[0]).toBe(second);
      expect(draft.list.pop()).toEqual({ id: 2 });
    });
  });

  test('moved original elements are drafted when read', () => {
    const base = { list: rows(4) };
    const state = roundTrip(base, (draft) => {
      draft.list.reverse();
      draft.list[0].id = 30;
      draft.list.unshift({ id: -1 });
      draft.list[2].id = 20;
      // A negative index resolves against the current length.
      draft.list.splice(-1, 0, { id: -2 });
      draft.list[5].id = 100;
    });
    expect(ids(state.list)).toEqual([-1, 30, 20, 1, -2, 100]);
    expect(ids(base.list)).toEqual([0, 1, 2, 3]);
    expect(state.list.some((item: unknown) => types.isProxy(item))).toBe(false);
  });

  test('drafts created before a move are finalized at their new index', () => {
    const base = { list: rows(4) };
    const state = roundTrip(base, (draft) => {
      const item = draft.list[1];
      item.id = 10;
      draft.list.shift();
      expect(draft.list[0]).toBe(item);
      draft.list.reverse();
      expect(draft.list[2]).toBe(item);
      item.id = 11;
    });
    expect(ids(state.list)).toEqual([3, 2, 11]);
  });

  test('copyWithin shares one draft between both indices', () => {
    const base = { list: rows(5) };
    const state = roundTrip(base, (draft) => {
      draft.list.copyWithin(0, 3);
      expect(draft.list[0]).toBe(draft.list[3]);
      draft.list[0].id = 30;
    });
    expect(ids(state.list)).toEqual([30, 4, 2, 30, 4]);
    expect(state.list[0]).toBe(state.list[3]);
    expect(ids(base.list)).toEqual([0, 1, 2, 3, 4]);
  });

  test('fill registers a draft at every filled index', () => {
    const base = { list: rows(4), extra: { id: 9 } };
    const state = roundTrip(base, (draft) => {
      draft.list.fill(draft.extra, 1, 3);
      draft.extra.id = 90;
      draft.list.fill(0, 3);
    });
    expect(state.list).toEqual([{ id: 0 }, { id: 90 }, { id: 90 }, 0]);
    expect(state.list[1]).toBe(state.extra);
  });

  test('calls that change nothing leave the state untouched', () => {
    const base = { list: rows(3), one: [{ id: 1 }], empty: [] as number[] };
    const state = create(base, (draft) => {
      expect(draft.empty.shift()).toBeUndefined();
      expect(draft.empty.splice(0, 5)).toEqual([]);
      expect(draft.list.splice(1, 0)).toEqual([]);
      expect((draft.list.splice as any)()).toEqual([]);
      expect(draft.list.unshift()).toBe(3);
      draft.list.fill({ id: 1 }, 2, 2);
      draft.list.copyWithin(0, 0);
      draft.one.reverse();
      draft.one.sort();
    });
    expect(state).toBe(base);
  });

  test('indexOf, lastIndexOf and includes see drafts and their originals', () => {
    const base = { list: rows(4), nums: [1, 2, NaN, 2] };
    create(base, (draft) => {
      const item = draft.list[2];
      expect(draft.list.indexOf(item)).toBe(2);
      expect(draft.list.indexOf(base.list[3])).toBe(3);
      expect(draft.list.includes(item)).toBe(true);
      expect(draft.list.includes({ id: 2 })).toBe(false);
      draft.list.reverse();
      expect(draft.list.indexOf(item)).toBe(1);
      expect(draft.list.lastIndexOf(base.list[0])).toBe(3);
      expect(draft.nums.includes(NaN)).toBe(true);
      expect(draft.nums.indexOf(NaN)).toBe(-1);
      expect(draft.nums.lastIndexOf(2)).toBe(3);
      expect(draft.nums.lastIndexOf(2, undefined)).toBe(-1);
      draft.list.splice(draft.list.indexOf(item), 1);
      expect(ids(draft.list)).toEqual([3, 1, 0]);
    });
  });

  test('read-only methods run natively on arrays without draftable elements', () => {
    const base = {
      nums: [3, 1, 2],
      dates: [new Date(0)],
      mixed: [1, { id: 1 }] as any[],
    };
    const context = {};
    const state = create(base, (draft) => {
      let calls = 0;
      draft.nums.forEach(function (this: unknown, _value, _index, array) {
        calls += 1;
        expect(array).toBe(draft.nums);
        expect(this).toBe(context);
      }, context);
      expect(calls).toBe(3);
      expect(draft.nums.map((value) => value * 2)).toEqual([6, 2, 4]);
      expect(
        draft.nums.reduce(
          (sum, value, _index, array) =>
            array === draft.nums ? sum + value : NaN,
          0
        )
      ).toBe(6);
      expect(draft.nums.find((value) => value > 1)).toBe(3);
      expect(draft.nums.findLast((value) => value > 1)).toBe(2);
      expect(draft.nums.slice(1)).toEqual([1, 2]);
      expect(draft.nums.at(-1)).toBe(2);
      expect(draft.nums.join('-')).toBe('3-1-2');
      expect(draft.dates.find((date) => date.getTime() === 0)).toBe(
        base.dates[0]
      );
      draft.mixed.forEach((value) => {
        if (typeof value === 'object') value.id = 2;
      });
      draft.nums.push({ id: 5 } as any);
      draft.nums.forEach((value) => {
        if (typeof value === 'object') (value as any).id = 6;
      });
    });
    expect(state.mixed).toEqual([1, { id: 2 }]);
    expect(base.mixed).toEqual([1, { id: 1 }]);
    expect(state.nums[3]).toEqual({ id: 6 });
  });

  test('sort hands drafts to the comparator and keeps the base', () => {
    const base = {
      list: [{ id: 3 }, { id: 1 }, { id: 2 }] as any[],
      nums: [3, 1, 2],
      words: ['b', undefined, 'a'],
    };
    const state = roundTrip(base, (draft) => {
      draft.list.sort((a: any, b: any) => {
        expect(isDraft(a)).toBe(true);
        a.touched = true;
        b.touched = true;
        return a.id - b.id;
      });
      draft.nums.sort((a: number, b: number) => b - a);
      draft.words.sort();
    });
    expect(state.list).toEqual([
      { id: 1, touched: true },
      { id: 2, touched: true },
      { id: 3, touched: true },
    ]);
    expect(state.nums).toEqual([3, 2, 1]);
    expect(state.words).toEqual(['a', 'b', undefined]);
    expect(base.list).toEqual([{ id: 3 }, { id: 1 }, { id: 2 }]);
  });

  test('sort keeps the proxy path for undefined elements and the state for a throwing comparator', () => {
    const base = { list: [{ id: 2 }, undefined, { id: 1 }] as any[] };
    const state = create(base, (draft) => {
      draft.list.sort((a: any, b: any) => a.id - b.id);
    });
    expect(state.list).toEqual([{ id: 1 }, { id: 2 }, undefined]);
    const other = { list: [{ id: 2 }, { id: 1 }] };
    expect(() =>
      create(other, (draft) => {
        draft.list.sort(() => {
          throw new Error('boom');
        });
      })
    ).toThrow('boom');
    expect(other.list).toEqual([{ id: 2 }, { id: 1 }]);
  });

  test('array subclasses and marked arrays use the proxy path', () => {
    class Stack extends Array<number> {}
    const base = { stack: Stack.from([1, 2, 3]) };
    const state = create(base, (draft) => {
      draft.stack.reverse();
      draft.stack.push(0);
    });
    expect(state.stack).toBeInstanceOf(Stack);
    expect([...state.stack]).toEqual([3, 2, 1, 0]);
    const marked = { list: rows(3) };
    const next = create(
      marked,
      (draft) => {
        draft.list.reverse();
        draft.list[0].id = 20;
      },
      { mark: () => undefined }
    );
    expect(ids(next.list)).toEqual([20, 1, 0]);
    expect(ids(marked.list)).toEqual([0, 1, 2]);
  });

  test('current() reflects native changes', () => {
    const base = { list: rows(3) };
    create(base, (draft) => {
      draft.list.reverse();
      draft.list[0].id = 20;
      const snapshot = current(draft.list);
      expect(snapshot).toEqual([{ id: 20 }, { id: 1 }, { id: 0 }]);
      expect(isDraft(snapshot[0])).toBe(false);
    });
  });

  test('strict mode checks removed values that cannot be drafted', () => {
    class Item {
      id = 1;
    }
    const base = { list: [new Item()] };
    expect(() =>
      create(
        base,
        (draft) => {
          draft.list.shift();
        },
        { strict: true }
      )
    ).toThrow();
    const state = create(
      base,
      (draft) => {
        unsafe(() => {
          draft.list.shift();
        });
      },
      { strict: true }
    );
    expect(state.list).toEqual([]);
  });

  test('patches replay for every mutator', () => {
    const base = { list: rows(6) };
    roundTrip(base, (draft) => {
      draft.list.unshift({ id: 10 }, { id: 11 });
    });
    roundTrip(base, (draft) => {
      draft.list.splice(2, 2, { id: 20 });
    });
    roundTrip(base, (draft) => {
      draft.list.splice(-2);
    });
    roundTrip(base, (draft) => {
      draft.list.reverse();
      draft.list[1].id = 40;
    });
    roundTrip(base, (draft) => {
      draft.list.fill({ id: 7 }, 1, 3);
    });
    roundTrip(base, (draft) => {
      draft.list.copyWithin(1, 3, 5);
      draft.list[1].id = 30;
    });
    roundTrip(base, (draft) => {
      draft.list.sort((a: any, b: any) => b.id - a.id);
      draft.list[0].id = 50;
    });
    roundTrip(base, (draft) => {
      draft.list.shift();
      draft.list.pop();
      draft.list.splice(1, 1);
    });
    expect(ids(base.list)).toEqual([0, 1, 2, 3, 4, 5]);
  });
});

describe('array method review findings', () => {
  test('removal returns the element the copy holds, not a stale child', () => {
    const base = { list: [{ id: 1 }, { id: 2 }, { id: 3 }] };
    const state = roundTrip(base, (draft) => {
      draft.list.sort((a: any, b: any) => b.id - a.id);
      const removed = draft.list.shift();
      expect(removed.id).toBe(3);
      removed.id = 99;
      draft.list.push(removed);
    });
    expect(ids(state.list)).toEqual([2, 1, 99]);
    expect(ids(base.list)).toEqual([1, 2, 3]);
    const other = { list: rows(2) };
    create(other, (draft) => {
      expect(isDraft(draft.list[0])).toBe(true);
      draft.list[0] = { id: 9 };
      expect(draft.list.shift()).toEqual({ id: 9 });
      expect(ids(draft.list)).toEqual([1]);
    });
  });

  test('callbacks observe changes made during iteration', () => {
    const base = { nums: [1, 2, 3] };
    const seen: number[] = [];
    create(base, (draft) => {
      draft.nums.forEach((value, index, array) => {
        if (index === 0) array[1] = 20;
        seen.push(value);
      });
    });
    expect(seen).toEqual([1, 20, 3]);
    const cut: number[] = [];
    create(base, (draft) => {
      draft.nums.forEach((value, index, array) => {
        if (index === 0) array.length = 1;
        cut.push(value);
      });
    });
    expect(cut).toEqual([1]);
  });

  test('strict mode still guards non-draftable elements', () => {
    const base = { dates: [new Date(0)] };
    expect(() =>
      create(
        base,
        (draft) => {
          draft.dates.at(0)!.setTime(42);
        },
        { strict: true }
      )
    ).toThrow();
    expect(() =>
      create(
        base,
        (draft) => {
          draft.dates.forEach((date) => date.setTime(42));
        },
        { strict: true }
      )
    ).toThrow();
    expect(base.dates[0].getTime()).toBe(0);
  });

  test('array subclasses keep their own methods', () => {
    class Stack extends Array<number> {
      shift() {
        return -1;
      }
    }
    const base = { stack: Stack.from([1, 2]) };
    create(base, (draft) => {
      expect(draft.stack.shift()).toBe(-1);
    });
  });

  test('splice coerces its arguments once', () => {
    const base = { list: [0, 1, 2] };
    let calls = 0;
    const state = roundTrip(base, (draft) => {
      draft.list.splice({ valueOf: () => calls++ } as any, 1, 9);
    });
    expect(state.list).toEqual([9, 1, 2]);
    expect(calls).toBe(1);
  });

  test('operations that change nothing keep the state', () => {
    const base = { nums: [1, 2, 3], same: [1, 2, 1] };
    expect(
      create(base, (draft) => {
        draft.nums.sort((a, b) => a - b);
      })
    ).toBe(base);
    expect(
      create(base, (draft) => {
        expect(draft.nums.splice(1, 1, 2)).toEqual([2]);
      })
    ).toBe(base);
    expect(
      create(base, (draft) => {
        draft.same.reverse();
      })
    ).toBe(base);
    expect(
      create(base, (draft) => {
        draft.nums.sort((a, b) => a - b);
        return { nums: [9], same: [] };
      })
    ).toEqual({ nums: [9], same: [] });
  });

  test('sparse arrays and undefined elements use the proxy path', () => {
    const list: (number | undefined)[] = new Array(2);
    list[1] = 1;
    const base = { list, mixed: [1, undefined, 3] };
    const [state, patches] = create(
      base,
      (draft) => {
        draft.list.reverse();
        draft.mixed.reverse();
      },
      { enablePatches: true }
    );
    const replay = apply(base, patches);
    expect(state.list).toEqual([1, undefined]);
    expect(1 in state.list).toBe(1 in replay.list);
    expect(replay).toEqual(state);
    expect(state.mixed).toEqual([3, undefined, 1]);
  });
});
