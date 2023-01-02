import { produce, enableMapSet, setAutoFreeze, Immutable } from 'immer';
import { create } from '../src';

enableMapSet();

beforeEach(() => {
  setAutoFreeze(true);
});

test('Set draft constructor is not equal to Set', () => {
  {
    const data = new Set([1, 2, 3]);

    produce(data, (draft) => {
      expect(draft.constructor).not.toBe(Set);
    });
  }

  {
    const data = new Set([1, 2, 3]);
    create(data, (draft) => {
      expect(draft.constructor).toBe(Set);
    });
  }
});

test('Map draft constructor is not equal to Map', () => {
  {
    const data = new Map([[1, 'a']]);
    produce(data, (draft) => {
      expect(draft.constructor).not.toBe(Map);
    });
  }

  {
    const data = new Map([[1, 'a']]);
    create(data, (draft) => {
      expect(draft.constructor).toBe(Map);
    });
  }
});

test('Unexpected operation check of Set draft', () => {
  {
    const data = new Set([1]);

    // ! it should throw an error
    expect(() => {
      produce(data, (draft) => {
        // @ts-ignore
        draft.x = 1;
      });
    }).not.toThrowError();
  }
  {
    const data = new Set([1]);
    expect(() => {
      create(data, (draft) => {
        // @ts-ignore
        draft.x = 1;
      });
    }).toThrowError(`'set' draft does not support any property assignment.`);
  }
});

test('Unexpected operation check of Map draft', () => {
  {
    const data = new Map([[1, 'a']]);

    // ! it should throw an error
    expect(() => {
      produce(data, (draft) => {
        // @ts-ignore
        draft.x = 1;
      });
    }).not.toThrowError();
  }

  {
    const data = new Map([[1, 'a']]);
    expect(() => {
      create(data, (draft) => {
        // @ts-ignore
        draft.x = 1;
      });
    }).toThrowError(`'map' draft does not support any property assignment.`);
  }
});

// https://github.com/immerjs/immer/issues/819
test('immer failed case - maintains order when adding', () => {
  {
    const objs = [
      {
        id: 'a',
      },
      'b',
    ];

    const set = new Set([objs[0]]);
    const newSet = produce(set, (draft) => {
      draft.add(objs[1]);
    });
    // ! it should keep the order
    expect(Array.from(newSet)).not.toEqual([objs[0], objs[1]]);
  }

  {
    const objs = [
      {
        id: 'a',
      },
      'b',
    ];

    const set = new Set([objs[0]]);
    const newSet0 = create(set, (draft) => {
      draft.add(objs[1]);
    });
    // does not pass
    expect(Array.from(newSet0)).toEqual([objs[0], objs[1]]);
  }
});

// https://github.com/immerjs/immer/issues/819
test('immer failed case - maintains order when adding2', () => {
  {
    const objs = [
      {
        id: 'a',
      },
      {
        id: 'b',
      },
    ];

    const set = new Set([objs[0]]);
    const newSet = produce(set, (draft) => {
      draft.add(objs[1]);
    });

    // ! it should keep the order
    expect(Array.from(newSet)).not.toEqual([objs[0], objs[1]]);
  }

  {
    const objs = [
      {
        id: 'a',
      },
      {
        id: 'b',
      },
    ];

    const set = new Set([objs[0]]);
    const newSet0 = create(set, (draft) => {
      draft.add(objs[1]);
    });

    expect(Array.from(newSet0)).toEqual([objs[0], objs[1]]);
  }
});

// https://github.com/immerjs/immer/issues/936
test("[936] immer failed case- Nested and chained produce usage results in error: Cannot perform 'get' on a proxy that has been revoked", () => {
  {
    setAutoFreeze(true);
    const state = {
      foo: {
        bar: {
          baz: 1,
        },
      },
    };
    const newState = produce(state, (draft) => {
      draft.foo = produce(draft.foo, (fooDraft) => {
        // @ts-ignore
        fooDraft.baz = fooDraft.bar.baz;
      });
      draft.foo = produce(draft.foo, (fooDraft) => {
        /* another produce call makes this fail */
        /* no actual mutation necessary to make this happen */
      });
    });
    expect(() => {
      JSON.stringify(newState);
    }).toThrowError();
  }

  {
    const state = {
      foo: {
        bar: {
          baz: 1,
        },
      },
    };
    const newState = create(
      state,
      (draft) => {
        draft.foo = create(
          draft.foo,
          (fooDraft) => {
            // @ts-ignore
            fooDraft.baz = fooDraft.bar.baz;
          },
          {
            enableAutoFreeze: true,
          }
        );
        // draft.foo = create(draft.foo, fooDraft => {
        //   /* another produce call makes this fail */
        //   /* no actual mutation necessary to make this happen */
        // })
      },
      {
        enableAutoFreeze: true,
      }
    );

    expect(() => {
      JSON.stringify(newState);
    }).not.toThrowError();
  }
});

test('immer failed case - freeze Map key', () => {
  {
    setAutoFreeze(true);
    const base = new Map<{ a: number }, number>([[{ a: 1 }, 1]]);
    const state: Immutable<Map<{ a: number }, number>> = produce(
      base,
      (draft) => {
        draft.values().next().value = 2;
      }
    );

    // ! it should throw error about freeze
    expect(() => {
      // @ts-ignore
      Array.from(state.keys())[0].a = 2;
    }).not.toThrowError();
  }

  {
    const base = new Map<{ a: number }, number>([[{ a: 1 }, 1]]);
    const state = create(
      base,
      (draft) => {
        draft.values().next().value = 2;
      },
      {
        enableAutoFreeze: true,
      }
    );

    expect(() => {
      // @ts-ignore
      Array.from(state.keys())[0].a = 2;
    }).toThrowError();
  }
});

test('immer failed case - escaped draft', () => {
  {
    setAutoFreeze(false);
    const dataSet = [{}, {}, {}] as any;
    const data = {
      data: null,
      a: {
        b: 1,
      },
    };
    const state = produce(data, (draft) => {
      draft.data = dataSet;
      const a = draft.a;
      dataSet[0] = a;
      dataSet[1].a = { b: 1, c: [a] };
      draft.a.b = 2;
    });

    expect(() => {
      JSON.stringify(state);
    }).toThrowError();
  }

  {
    const dataSet = [{}, {}, {}] as any;
    const data = {
      data: null,
      a: {
        b: 1,
      },
    };
    const state = create(data, (draft) => {
      draft.data = dataSet;
      const a = draft.a;
      dataSet[0] = a;
      dataSet[1].a = { b: 1, c: [a] };
      draft.a.b = 2;
    });

    expect(() => {
      JSON.stringify(state);
    }).not.toThrowError();
  }
});

test('immer failed case - escaped draft about return value', () => {
  {
    setAutoFreeze(false);
    const dataSet = [{}, {}, {}] as any;
    const data = {
      data: null,
      a: {
        b: 1,
        c: 1,
      },
    };
    const producer = produce((draft: any) => {
      const a = draft.a;
      dataSet[0] = a;
      dataSet[1].a = { b: 1, c: [a] };
      draft.a.b = 2;
      draft.a.c = 2;
      return {
        ...dataSet,
      };
    });

    expect(() => {
      JSON.stringify(producer(data));
    }).toThrowError();
  }
});
