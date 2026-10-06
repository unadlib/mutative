/* eslint-disable @typescript-eslint/no-explicit-any */
import { apply, create, current, isDraft, unsafe } from '../src';

describe('auto-freeze of create() calls inside a recipe', () => {
  test('a create() call inside a recipe does not freeze its result', () => {
    let inner: any;
    const state = create(
      { value: 1 },
      (draft) => {
        inner = create(
          { child: { value: 1 } },
          (innerDraft) => {
            innerDraft.child.value = 2;
          },
          { enableAutoFreeze: true }
        );
        draft.value = 2;
      },
      { enableAutoFreeze: true }
    );
    expect(Object.isFrozen(inner)).toBe(false);
    expect(Object.isFrozen(inner.child)).toBe(false);
    expect(Object.isFrozen(state)).toBe(true);
  });

  test('the outer producer finalizes and freezes its drafts held by such a result', () => {
    // Freezing the result would hide the outer draft from the outer producer,
    // which does not search frozen objects, and leave it revoked in the state.
    const state = create(
      { child: { value: 1 } } as any,
      (draft) => {
        const result = create({ child: draft.child }, () => {}, {
          enableAutoFreeze: true,
        });
        draft.child.value = 2;
        draft.copy = result;
      },
      { enableAutoFreeze: true }
    );
    expect(state).toEqual({
      child: { value: 2 },
      copy: { child: { value: 2 } },
    });
    expect(state.copy.child).toBe(state.child);
    expect(Object.isFrozen(state.copy)).toBe(true);
    expect(Object.isFrozen(state.copy.child)).toBe(true);
  });

  test('manual drafts and apply() inside a recipe are not frozen either', () => {
    let manual: any;
    let applied: any;
    create(
      {},
      () => {
        const [draft, finalize] = create(
          { child: { value: 1 } },
          { enableAutoFreeze: true }
        );
        draft.child.value = 2;
        manual = finalize();
        applied = apply<{ child: { value: number } }, true>(
          { child: { value: 1 } },
          [{ op: 'replace', path: ['child', 'value'], value: 2 }],
          { enableAutoFreeze: true }
        );
      },
      { enableAutoFreeze: true }
    );
    expect(manual).toEqual({ child: { value: 2 } });
    expect(Object.isFrozen(manual)).toBe(false);
    expect(applied).toEqual({ child: { value: 2 } });
    expect(Object.isFrozen(applied)).toBe(false);
  });

  test('create() freezes again once the recipe returns or throws', () => {
    create({}, () => {
      create({}, () => {});
    });
    expect(() =>
      create({}, () => {
        throw new Error('recipe');
      })
    ).toThrow('recipe');
    expect(() =>
      create({}, () => {
        create({}, () => {
          throw new Error('inner recipe');
        });
      })
    ).toThrow('inner recipe');
    const state = create(
      { child: { value: 1 } },
      (draft) => {
        draft.child.value = 2;
      },
      { enableAutoFreeze: true }
    );
    expect(Object.isFrozen(state)).toBe(true);
    expect(Object.isFrozen(state.child)).toBe(true);
  });

  test('a result that holds a draft of an unfinished manual create() call is not frozen', () => {
    const [manual, finalize] = create({ child: { value: 1 } });
    const state = create(
      {} as any,
      (draft) => {
        draft.child = manual.child;
      },
      { enableAutoFreeze: true }
    );
    expect(Object.isFrozen(state)).toBe(false);
    manual.child.value = 2;
    const result = finalize();
    expect(state.child).toBe(result.child);
    expect(state.child).toEqual({ value: 2 });
  });

  test('only the synchronous part of an async recipe counts', async () => {
    let before: any;
    let after: any;
    await create({}, async () => {
      before = create({ value: 1 }, () => {}, { enableAutoFreeze: true });
      await Promise.resolve();
      after = create({ value: 1 }, () => {}, { enableAutoFreeze: true });
    });
    expect(Object.isFrozen(before)).toBe(false);
    expect(Object.isFrozen(after)).toBe(true);
  });
});

describe('drafts whose original is a draft of an outer create() call', () => {
  test('a Set draft is copied through the outer draft', () => {
    const base = { set: new Set([1, 2]) };
    const state = create(base, (draft) => {
      const result = create({ set: draft.set }, (innerDraft) => {
        innerDraft.set.add(3);
        innerDraft.set.delete(1);
      });
      expect([...result.set]).toEqual([2, 3]);
      expect([...draft.set]).toEqual([1, 2]);
    });
    expect(state).toBe(base);
  });

  test('a Set keeps the drafts of an outer create() call that it holds', () => {
    const item = { value: 1 };
    const base = { set: new Set([item]) };
    const state = create(base, (draft) => {
      const result = create({ set: draft.set }, (innerDraft) => {
        innerDraft.set.add({ value: 2 });
      });
      const [first] = result.set;
      expect(isDraft(first)).toBe(true);
      first.value = 3;
      draft.set = result.set;
    });
    expect(item).toEqual({ value: 1 });
    expect([...state.set]).toEqual([{ value: 3 }, { value: 2 }]);
  });

  test('a value assigned in the recipe keeps the drafts of an outer create() call', () => {
    const base = { node: { child: { value: 0 } }, other: { value: 0 } };
    const state = create(base as any, (draft) => {
      const result: any = create({ node: draft.node }, (innerDraft: any) => {
        innerDraft.node.child.value = 1;
        innerDraft.list = [draft.other];
      });
      expect(isDraft(result.list[0])).toBe(true);
      result.list[0].value = 1;
      draft.list = result.list;
    });
    expect(base.other).toEqual({ value: 0 });
    expect(state.list[0]).toBe(state.other);
    expect(state.other).toEqual({ value: 1 });
  });

  test('current() returns the current state of the drafts of an outer create() call', () => {
    let changed: any;
    let unchanged: any;
    create({ node: { a: { value: 1 }, b: { value: 1 } } }, (draft) => {
      draft.node.b.value = 2;
      create({ node: draft.node }, (innerDraft) => {
        innerDraft.node.a.value = 2;
        changed = current(innerDraft);
        unchanged = current(innerDraft.node.b);
      });
    });
    // Both producers have ended, so a draft left in a snapshot would throw.
    expect(changed).toEqual({ node: { a: { value: 2 }, b: { value: 2 } } });
    expect(unchanged).toEqual({ value: 2 });
  });

  test('patch values hold no drafts of an outer create() call', () => {
    const base = {
      node: { child: { value: 1 }, other: { value: 1 } },
      set: new Set([{ id: 1 }, { id: 2 }]),
    };
    let patches: any;
    let inversePatches: any;
    create(base, (draft) => {
      draft.node.other.value = 2;
      [, patches, inversePatches] = create(
        { node: draft.node, set: draft.set } as any,
        (innerDraft) => {
          delete innerDraft.node.child;
          innerDraft.node.moved = innerDraft.node.other;
          for (const item of innerDraft.set) {
            if (item.id === 1) innerDraft.set.delete(item);
          }
          innerDraft.set.add({ id: 3 });
        },
        { enablePatches: true }
      );
    });
    // Both producers have ended, so a draft left in a patch would throw.
    expect(patches).toEqual([
      { op: 'remove', path: ['set', 0], value: { id: 1 } },
      { op: 'add', path: ['set', 1], value: { id: 3 } },
      { op: 'remove', path: ['node', 'child'] },
      { op: 'add', path: ['node', 'moved'], value: { value: 2 } },
    ]);
    expect(inversePatches).toEqual([
      { op: 'remove', path: ['set', 1], value: { id: 3 } },
      { op: 'add', path: ['set', 0], value: { id: 1 } },
      { op: 'add', path: ['node', 'child'], value: { value: 1 } },
      { op: 'remove', path: ['node', 'moved'] },
    ]);
  });

  test('a Map draft is copied through the outer draft', () => {
    const base = { map: new Map([['a', 1]]) };
    const state = create(base, (draft) => {
      const result = create({ map: draft.map }, (innerDraft) => {
        innerDraft.map.set('b', 2);
        innerDraft.map.delete('a');
      });
      expect([...result.map]).toEqual([['b', 2]]);
      expect([...draft.map]).toEqual([['a', 1]]);
    });
    expect(state).toBe(base);
  });

  test('changes through the items of such a Set draft stay in its result', () => {
    const base = { set: new Set([{ value: 1 }]) };
    const state = create(base, (draft) => {
      const result = create({ set: draft.set }, (innerDraft) => {
        for (const item of innerDraft.set) item.value += 1;
      });
      expect([...result.set]).toEqual([{ value: 2 }]);
      expect([...draft.set]).toEqual([{ value: 1 }]);
    });
    expect(state).toBe(base);
  });

  test('an array draft that moves drafts of an outer create() call leaves them to that call', () => {
    const base = { list: [{ value: 0 }, { value: 1 }, { value: 2 }] };
    const state = create(base, (draft) => {
      const result = create({ list: draft.list }, (innerDraft) => {
        innerDraft.list.reverse();
        innerDraft.list[0].value = 3;
      });
      expect(isDraft(result.list[2])).toBe(true);
      result.list[2].value = 4;
      draft.list = result.list;
    });
    expect(base.list).toEqual([{ value: 0 }, { value: 1 }, { value: 2 }]);
    expect(state.list).toEqual([{ value: 3 }, { value: 1 }, { value: 4 }]);
  });
});

describe('create() with a draft as its base, like Immer', () => {
  type Node = { name: string; metadata: { value: string } };

  // A helper that may run inside a recipe, as in #160.
  const rename = (node: Node, name: string) =>
    create(node, (draft) => {
      draft.name = name;
    });

  test.each([false, true])(
    'a value that the recipe leaves unchanged is a draft of the outer create() call (auto-freeze: %s)',
    (enableAutoFreeze) => {
      const base = { nodes: [{ name: 'a', metadata: { value: '' } }] };
      const state = create(
        base,
        (draft) => {
          draft.nodes = draft.nodes.map((node) => {
            const renamed = rename(node, 'b');
            expect(isDraft(renamed.metadata)).toBe(true);
            renamed.metadata.value = 'changed';
            return renamed;
          });
        },
        { enableAutoFreeze }
      );
      expect(base).toEqual({ nodes: [{ name: 'a', metadata: { value: '' } }] });
      expect(state).toEqual({
        nodes: [{ name: 'b', metadata: { value: 'changed' } }],
      });
      expect(Object.isFrozen(state.nodes[0].metadata)).toBe(enableAutoFreeze);
    }
  );

  test('array drafts', () => {
    const base = {
      list: [
        { id: 1, data: { value: 0 } },
        { id: 2, data: { value: 0 } },
        { id: 3, data: { value: 0 } },
      ],
    };
    const state = create(base, (draft) => {
      const list = create(draft.list, (listDraft) => {
        listDraft.push({ id: 4, data: { value: 0 } });
        listDraft.splice(0, 1);
        listDraft.reverse();
        listDraft[0].data.value = 4;
      });
      expect(isDraft(list[1])).toBe(true);
      list[1].data.value = 3;
      draft.list = list;
    });
    expect(base.list.map((item) => item.data.value)).toEqual([0, 0, 0]);
    expect(state.list).toEqual([
      { id: 4, data: { value: 4 } },
      { id: 3, data: { value: 3 } },
      { id: 2, data: { value: 0 } },
    ]);
    expect(state.list[2]).toBe(base.list[1]);
  });

  test('Map drafts', () => {
    const base = {
      map: new Map([
        ['a', { value: 0 }],
        ['b', { value: 0 }],
      ]),
    };
    const state = create(base, (draft) => {
      const map = create(draft.map, (mapDraft) => {
        mapDraft.set('c', { value: 0 });
        mapDraft.delete('a');
      });
      expect(isDraft(map.get('b'))).toBe(true);
      map.get('b')!.value = 1;
      draft.map = map;
    });
    expect(base.map.get('b')).toEqual({ value: 0 });
    expect([...state.map]).toEqual([
      ['b', { value: 1 }],
      ['c', { value: 0 }],
    ]);
  });

  test('Set drafts', () => {
    const item = { value: 0 };
    const base = { set: new Set([item]) };
    const state = create(base, (draft) => {
      const set = create(draft.set, (setDraft) => {
        setDraft.add({ value: 1 });
      });
      const [first] = set;
      expect(isDraft(first)).toBe(true);
      first.value = 2;
      draft.set = set;
    });
    expect(item).toEqual({ value: 0 });
    expect([...state.set]).toEqual([{ value: 2 }, { value: 1 }]);
  });

  test('drafts of a wide object', () => {
    const wide: any = {};
    for (let index = 0; index < 200; index += 1) {
      wide[`key${index}`] = { index };
    }
    const state = create({ wide }, (draft) => {
      const result = create(draft.wide, (wideDraft) => {
        wideDraft.key0.index = -1;
      });
      expect(isDraft(result.key1)).toBe(true);
      result.key1.index = -2;
      draft.wide = result;
    });
    expect(wide.key1).toEqual({ index: 1 });
    expect(state.wide.key0).toEqual({ index: -1 });
    expect(state.wide.key1).toEqual({ index: -2 });
    expect(state.wide.key2).toBe(wide.key2);
  });

  test('the recipe sees the changes of the outer recipe', () => {
    const base = { child: { count: 1, nested: { total: 0 } } };
    const state = create(base as any, (draft) => {
      draft.child.count = 2;
      draft.child.extra = 1;
      draft.child = create(draft.child, (child: any) => {
        child.nested.total = child.count + child.extra;
      });
    });
    expect(state).toEqual({
      child: { count: 2, extra: 1, nested: { total: 3 } },
    });
    expect(base).toEqual({ child: { count: 1, nested: { total: 0 } } });
  });

  test('a recipe that changes nothing returns the draft', () => {
    create({ child: { value: 1 } }, (draft) => {
      expect(create(draft.child, () => {})).toBe(draft.child);
      expect(create(draft, () => {})).toBe(draft);
    });
  });

  test('without a recipe, a draft base is copied, like createDraft()', () => {
    create({ value: 1 } as any, (draft) => {
      draft.value = 2;
      const [copy, finalize] = create(draft);
      draft.value = 3;
      copy.extra = true;
      expect(finalize()).toEqual({ value: 2, extra: true });
      expect(draft).toEqual({ value: 3 });
    });
  });

  test('the result holds drafts of the outer create() call until it ends', () => {
    let result: any;
    create({ child: { value: 1 }, other: { value: 1 } }, (draft) => {
      result = create(draft, (innerDraft) => {
        innerDraft.other.value = 2;
      });
      draft.child.value = 3;
      expect(result.child.value).toBe(3);
    });
    expect(result.other).toEqual({ value: 2 });
    expect(() => result.child.value).toThrow(TypeError);
  });

  test('patches of a recipe on a draft base replay its changes', () => {
    const base = { list: [{ id: 1 }, { id: 2 }] };
    let before: any;
    let after: any;
    let patches: any;
    let inversePatches: any;
    create(base, (draft) => {
      before = current(draft.list);
      [after, patches, inversePatches] = create(
        draft.list,
        (listDraft) => {
          listDraft.pop();
          listDraft[0].id = 3;
        },
        { enablePatches: true }
      );
    });
    expect(after).toEqual([{ id: 3 }]);
    expect(apply(before, patches)).toEqual(after);
    expect(apply(after, inversePatches)).toEqual(before);
    expect(inversePatches).toContainEqual({
      op: 'add',
      path: [1],
      value: base.list[1],
    });
  });
});

describe('array drafts of an outer create() call are copied from their current array', () => {
  test('holes, undefined, primitives and non-draftable objects are kept as they are', () => {
    const date = new Date(0);
    const list: any[] = [1, undefined, { v: 1 }, date, 'a'];
    list[6] = { v: 6 };
    const base = { list };
    const state = create(base, (draft) => {
      const result = create(draft.list, (inner) => {
        inner.push(7);
        inner[2].v = 2;
      });
      expect(isDraft(result[6])).toBe(true);
      expect(result[3]).toBe(date);
      expect(1 in result).toBe(true);
      expect(5 in result).toBe(false);
      result[6].v = 7;
      draft.list = result;
    });
    expect(state.list).toEqual([
      1,
      undefined,
      { v: 2 },
      date,
      'a',
      undefined,
      { v: 7 },
      7,
    ]);
    expect(5 in state.list).toBe(false);
    expect(state.list[3]).toBe(date);
    expect(base.list[2]).toEqual({ v: 1 });
    expect(base.list[6]).toEqual({ v: 6 });
    expect(base.list.length).toBe(7);
  });

  test('an array whose Symbol.isConcatSpreadable is false', () => {
    const list: any = [{ v: 1 }, 2];
    list[Symbol.isConcatSpreadable] = false;
    const state = create({ list }, (draft) => {
      draft.list = create(draft.list, (inner) => {
        inner.push(3);
        inner[0].v = 2;
      });
    });
    expect([...state.list]).toEqual([{ v: 2 }, 2, 3]);
    expect([...list]).toEqual([{ v: 1 }, 2]);
  });

  test('the array of a frozen state is copied like a locked array', () => {
    const base = create({ list: [{ v: 0 }, 1] as any[] }, () => {}, {
      enableAutoFreeze: true,
    });
    expect(Object.isFrozen(base.list)).toBe(true);
    const state = create(
      base,
      (draft) => {
        draft.list = create(draft.list, (inner) => {
          inner.push(2);
          inner[0].v = 1;
        });
      },
      { enableAutoFreeze: true }
    );
    expect(state.list).toEqual([{ v: 1 }, 1, 2]);
    expect(Object.isFrozen(state.list)).toBe(true);
    expect(base.list).toEqual([{ v: 0 }, 1]);
  });

  test('elements the outer recipe assigned are not drafted', () => {
    const assigned = { v: 1 };
    const state = create({ list: [{ v: 0 }] } as any, (draft) => {
      draft.list[1] = assigned;
      const result = create(draft.list, (inner) => {
        inner.push({ v: 2 });
      });
      expect(result[1]).toBe(assigned);
      expect(isDraft(result[0])).toBe(true);
      draft.list = result;
    });
    expect(state.list[1]).toBe(assigned);
  });
});

describe('Set drafts whose original is a draft of an outer create() call', () => {
  test('deleting an item through the draft of the outer create() call is recorded', () => {
    const base = { set: new Set([{ id: 1 }, { id: 2 }]) };
    let patches: any;
    let inversePatches: any;
    const state = create(base, (draft) => {
      const [first] = draft.set;
      let result: any;
      [result, patches, inversePatches] = create(
        draft.set,
        (inner) => {
          expect(inner.delete(first)).toBe(true);
          expect(inner.delete(first)).toBe(false);
          expect(inner.has(first)).toBe(false);
          expect(inner.size).toBe(1);
        },
        { enablePatches: true }
      );
      draft.set = result;
    });
    expect([...state.set]).toEqual([{ id: 2 }]);
    const [item] = base.set;
    expect(patches).toEqual([{ op: 'remove', path: [0], value: item }]);
    expect(patches[0].value).toBe(item);
    expect(inversePatches).toEqual([{ op: 'add', path: [0], value: item }]);
    expect([...apply(new Set(base.set), patches)]).toEqual([{ id: 2 }]);
    expect([...apply(state.set, inversePatches)]).toEqual([
      { id: 2 },
      { id: 1 },
    ]);
  });
});

describe('Set drafts that hold drafts of another create() call', () => {
  test('a draft of an unfinished manual create() call added to a Set draft', () => {
    const [manual, finalize] = create({ item: { id: 9 } });
    const state = create({ set: new Set([{ id: 1 }]) }, (draft) => {
      draft.set.add(manual.item);
    });
    manual.item.id = 10;
    const result = finalize();
    expect([...state.set]).toEqual([{ id: 1 }, { id: 10 }]);
    expect([...state.set][1]).toBe(result.item);
  });

  test('a draft of the outer create() call added in a nested recipe', () => {
    const base = { set: new Set([{ id: 1 }]), other: { id: 3 } };
    const state = create(base, (draft) => {
      const result = create(draft.set, (inner) => {
        inner.add(draft.other);
      });
      draft.other.id = 4;
      draft.set = result;
    });
    expect([...state.set]).toEqual([{ id: 1 }, { id: 4 }]);
    expect([...state.set][1]).toBe(state.other);
    expect(base.other).toEqual({ id: 3 });
  });

  test('a result left outside the state is resolved when the outer call ends', () => {
    let result: any;
    create({ set: new Set([{ id: 1 }]), other: { id: 3 } }, (draft) => {
      result = create(draft.set, (inner) => {
        inner.add(draft.other);
      });
      draft.other.id = 4;
    });
    expect([...result]).toEqual([{ id: 1 }, { id: 4 }]);
  });

  test('an item deleted and added back through the draft of the outer create() call', () => {
    const base = { set: new Set([{ id: 1 }, { id: 2 }]) };
    let patches: any;
    const state = create(base, (draft) => {
      const [first] = draft.set;
      let result: any;
      [result, patches] = create(
        draft.set,
        (inner) => {
          inner.delete(first);
          inner.add(first);
        },
        { enablePatches: true }
      );
      draft.set = result;
    });
    expect([...state.set]).toEqual([{ id: 2 }, { id: 1 }]);
    expect(patches).toEqual([]);
  });
});

describe('strict mode and create() on a draft', () => {
  test('the copy of a draft of the outer create() call reads non-draftable values unchecked', () => {
    const date = new Date(0);
    const base: any = {
      node: {
        date,
        list: [date, { v: 1 }],
        set: new Set([date, { v: 1 }]),
        map: new Map([['date', date]]),
        k: 1,
      },
    };
    const state = create(
      base,
      (draft: any) => {
        const result = create(draft.node, (inner) => {
          inner.k = 2;
          inner.list.push(2);
          inner.set.add(2);
          inner.map.set('k', 2);
        });
        expect(result.date).toBe(date);
        expect(result.list[0]).toBe(date);
        expect(isDraft(result.list[1])).toBe(true);
        draft.node = result;
      },
      { strict: true }
    );
    expect(state.node.date).toBe(date);
    expect(state.node.list).toEqual([date, { v: 1 }, 2]);
    expect([...state.node.set]).toEqual([date, { v: 1 }, 2]);
    expect([...state.node.map]).toEqual([
      ['date', date],
      ['k', 2],
    ]);
    expect(base.node.list).toEqual([date, { v: 1 }]);
  });

  test('the drafts of a strict create() call on a draft check the reads of its recipe', () => {
    const date = new Date(0);
    create({ node: { date, k: 1 } }, (draft) => {
      expect(() =>
        create(
          draft.node,
          (inner) => {
            inner.k = 2;
            expect(inner.date).toBe(date);
          },
          { strict: true }
        )
      ).toThrow(/Strict mode/);
      const result = create(
        draft.node,
        (inner) => {
          inner.k = 2;
          unsafe(() => {
            expect(inner.date).toBe(date);
          });
        },
        { strict: true }
      );
      expect(result).toEqual({ date, k: 2 });
    });
  });
});
