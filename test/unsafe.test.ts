/* eslint-disable no-shadow */
/* eslint-disable prefer-regex-literals */
/* eslint-disable no-unused-expressions */
/* eslint-disable consistent-return */
/* eslint-disable no-param-reassign */
import { create, unsafe } from '../src';

test('base with strict mode', () => {
  class Foobar {
    bar = 1;
  }

  const foobar = new Foobar();
  const foobar0 = new Foobar();
  const data = {
    foo: {
      bar: 'str',
    },
    foobar,
    foobar0,
  };

  const state = create(
    data,
    (draft) => {
      unsafe(() => {
        draft.foobar.bar = 2;
      });
      draft.foo.bar = 'new str';
      const foobar0 = unsafe(() => draft.foobar0);
      foobar0.bar = 3;
    },
    {
      strict: true,
    }
  );
  expect(state).toEqual({
    foo: {
      bar: 'new str',
    },
    foobar,
    foobar0,
  });
  expect(state).not.toBe(data);
  expect(state.foo).not.toBe(data.foo);
  expect(state.foobar).toBe(foobar);
  expect(() => {
    create(
      data,
      (draft) => {
        draft.foobar.bar = 2;
      },
      {
        strict: true,
      }
    );
  }).toThrowError();
});

test('base without strict mode', () => {
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

  const state = create(
    data,
    (draft) => {
      unsafe(() => {
        draft.foobar.bar = 2;
      });
      draft.foo.bar = 'new str';
    },
    {
      strict: false,
    }
  );
  expect(state).toEqual({
    foo: {
      bar: 'new str',
    },
    foobar,
  });
  expect(state).not.toBe(data);
  expect(state.foo).not.toBe(data.foo);
  expect(state.foobar).toBe(foobar);
  expect(() => {
    create(
      data,
      (draft) => {
        draft.foobar.bar = 2;
      },
      {
        strict: false,
      }
    );
  }).not.toThrowError();
});

test('access primitive type and immutable object', () => {
  [
    1,
    0,
    NaN,
    BigInt(1),
    Infinity,
    '',
    'test',
    null,
    true,
    false,
    undefined,
    Symbol('foo'),
    // immutable object
    {},
    [],
    new Set(),
    new Map(),
  ].forEach((value) => {
    expect(() => {
      create(
        { value },
        (draft) => {
          draft.value;
        },
        {
          strict: true,
        }
      );
    }).not.toThrowError();
  });
});

test('access mutable type', () => {
  [new Date(), new RegExp(''), new Error(), new ArrayBuffer(8)].forEach(
    (value) => {
      expect(() => {
        create(
          { value },
          (draft) => {
            unsafe(() => {
              draft.value;
            });
          },
          {
            strict: true,
          }
        );
      }).not.toThrowError();
      expect(() => {
        create(
          { value },
          (draft) => {
            draft.value;
          },
          {
            strict: true,
          }
        );
      }).toThrowError();
      expect(() => {
        create(
          { value },
          (draft) => {
            unsafe(() => {
              draft.value;
            });
            draft.value;
          },
          {
            strict: true,
          }
        );
      }).toThrowError();

      // array
      expect(() => {
        create(
          { value: [value] },
          (draft) => {
            unsafe(() => {
              draft.value[0];
            });
          },
          {
            strict: true,
          }
        );
      }).not.toThrowError();

      expect(() => {
        create(
          { value: [value] },
          (draft) => {
            draft.value[0];
          },
          {
            strict: true,
          }
        );
      }).toThrowError();

      expect(() => {
        create(
          { value: [value] },
          (draft) => {
            unsafe(() => {
              draft.value[0];
            });
            draft.value[0];
          },
          {
            strict: true,
          }
        );
      }).toThrowError();

      // set
      expect(() => {
        create(
          { value: new Set([value]) },
          (draft) => {
            unsafe(() => {
              draft.value.values().next().value;
            });
          },
          {
            strict: true,
          }
        );
      }).not.toThrowError();

      expect(() => {
        create(
          { value: new Set([value]) },
          (draft) => {
            draft.value.values().next().value;
          },
          {
            strict: true,
          }
        );
      }).toThrowError();

      expect(() => {
        create(
          { value: new Set([value]) },
          (draft) => {
            unsafe(() => {
              draft.value.values().next().value;
            });
            draft.value.values().next().value;
          },
          {
            strict: true,
          }
        );
      }).toThrowError();

      // map
      expect(() => {
        create(
          { value: new Map([[0, value]]) },
          (draft) => {
            unsafe(() => {
              draft.value.get(0);
            });
          },
          {
            strict: true,
          }
        );
      }).not.toThrowError();

      expect(() => {
        create(
          { value: new Map([[0, value]]) },
          (draft) => {
            draft.value.get(0);
          },
          {
            strict: true,
          }
        );
      }).toThrowError();

      expect(() => {
        create(
          { value: new Map([[0, value]]) },
          (draft) => {
            unsafe(() => {
              draft.value.get(0);
            });
            draft.value.get(0);
          },
          {
            strict: true,
          }
        );
      }).toThrowError();
    }
  );
});

test('base with immutable mark in strict mode', () => {
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

  const state = create(
    data,
    (draft) => {
      draft.foobar.bar = 2;
      draft.foo.bar = 'new str';
    },
    {
      strict: true,
      mark: (target, { immutable }) => {
        if (target instanceof Foobar) {
          return immutable;
        }
      },
    }
  );
  const foobar2 = new Foobar();
  foobar2.bar = 2;
  expect(state).toEqual({
    foo: {
      bar: 'new str',
    },
    foobar: foobar2,
  });
  expect(state).not.toBe(data);
  expect(state.foo).not.toBe(data.foo);
  expect(state.foobar).not.toBe(foobar);
});

test('object with mutable mark in strict mode', () => {
  const foo = {
    bar: 'str',
  };
  const data = {
    foo,
  };

  const state = create(
    data,
    (draft) => {
      unsafe(() => {
        draft.foo.bar = 'new str';
      });
    },
    {
      strict: true,
      mark: (target, { mutable }) => {
        if (target === foo) {
          return mutable;
        }
      },
    }
  );
  expect(state).toBe(data);
  expect(state.foo).toBe(data.foo);
  expect(() => {
    create(
      data,
      (draft) => {
        draft.foo.bar = 'new str';
      },
      {
        strict: true,
        mark: (target, { mutable }) => {
          if (target === foo) {
            return mutable;
          }
        },
      }
    );
  }).toThrowError();
});

test('array with mutable mark in strict mode', () => {
  const foo = {
    bar: 'str',
  };
  const data = {
    foo: [foo],
  };

  const state = create(
    data,
    (draft) => {
      unsafe(() => {
        draft.foo[0].bar = 'new str';
      });
    },
    {
      strict: true,
      mark: (target, { mutable }) => {
        if (target === foo) {
          return mutable;
        }
      },
    }
  );
  expect(state).toBe(data);
  expect(state.foo).toBe(data.foo);
  expect(() => {
    create(
      data,
      (draft) => {
        draft.foo[0].bar = 'new str';
      },
      {
        strict: true,
        mark: (target, { mutable }) => {
          if (target === foo) {
            return mutable;
          }
        },
      }
    );
  }).toThrowError();
});

test('set with mutable mark in strict mode', () => {
  const foo = {
    bar: 'str',
  };
  const data = {
    foo: new Set([foo]),
  };

  const state = create(
    data,
    (draft) => {
      unsafe(() => {
        draft.foo.values().next().value.bar = 'new str';
      });
    },
    {
      strict: true,
      mark: (target, { mutable }) => {
        if (target === foo) {
          return mutable;
        }
      },
    }
  );
  expect(state).toBe(data);
  expect(state.foo).toBe(data.foo);
  expect(() => {
    create(
      data,
      (draft) => {
        draft.foo.values().next().value.bar = 'new str';
      },
      {
        strict: true,
        mark: (target, { mutable }) => {
          if (target === foo) {
            return mutable;
          }
        },
      }
    );
  }).toThrowError();
});

test('map with mutable mark in strict mode', () => {
  const foo = {
    bar: 'str',
  };
  const data = {
    foo: new Map([[0, foo]]),
  };

  const state = create(
    data,
    (draft) => {
      unsafe(() => {
        draft.foo.get(0)!.bar = 'new str';
      });
    },
    {
      strict: true,
      mark: (target, { mutable }) => {
        if (target === foo) {
          return mutable;
        }
      },
    }
  );
  expect(state).toBe(data);
  expect(state.foo).toBe(data.foo);
  expect(() => {
    create(
      data,
      (draft) => {
        draft.foo.get(0)!.bar = 'new str';
      },
      {
        strict: true,
        mark: (target, { mutable }) => {
          if (target === foo) {
            return mutable;
          }
        },
      }
    );
  }).toThrowError();
});

test('change Date instance - custom shallow copy', () => {
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
      strict: true,
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

test('change Date instance', () => {
  const data = {
    foo: {
      bar: 'str',
    },
    date: new Date(0),
  };

  const state = create(
    data,
    (draft) => {
      unsafe(() => {
        draft.date.setMilliseconds(42);
      });
    },
    {
      strict: true,
    }
  );
  expect(data).toBe(state);
  expect(data.foo).toBe(state.foo);
  expect(data.date).toBe(state.date);
  expect(state.date.getTime()).toBe(42);
});
