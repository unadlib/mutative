// In strict mode, development builds warn once when a recipe leaves at least
// 1,000 drafts unchanged, as a search through a large draft array does. The
// warning is shown once per module instance, so each test loads a fresh copy
// of the library.
const load = async () => {
  vi.resetModules();
  return import('../src');
};

const rows = (length: number) =>
  Array.from({ length }, (_, id) => ({ id, nested: { id } }));

let warn: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  globalThis.__DEV__ = true;
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  warn.mockRestore();
});

test('a strict search through 1,000 elements warns once', async () => {
  const { create } = await load();
  create(
    rows(1000),
    (draft) => {
      draft.find((row) => row.id === -1);
    },
    { strict: true }
  );
  expect(warn).toHaveBeenCalledTimes(1);
  expect(warn.mock.calls[0][0]).toContain(
    'Strict mode: the recipe left 1000 drafts unchanged;'
  );
  expect(warn.mock.calls[0][0]).toContain(
    "search 'current(draft.list)' instead"
  );
  create(
    rows(5000),
    (draft) => {
      draft.find((row) => row.id === -1);
    },
    { strict: true }
  );
  expect(warn).toHaveBeenCalledTimes(1);
});

test('fewer unchanged drafts do not warn', async () => {
  const { create } = await load();
  create(
    rows(999),
    (draft) => {
      draft.find((row) => row.id === -1);
    },
    { strict: true }
  );
  expect(warn).not.toHaveBeenCalled();
});

test('only strict mode warns', async () => {
  const { create } = await load();
  create(rows(2000), (draft) => {
    draft.find((row) => row.id === -1);
  });
  expect(warn).not.toHaveBeenCalled();
});

test('changed drafts do not count', async () => {
  const { create } = await load();
  create(
    rows(2000),
    (draft) => {
      draft.forEach((row) => {
        row.nested.id += 1;
      });
    },
    { strict: true }
  );
  // 999 visited rows stay unchanged; the match and the array change.
  create(
    rows(1000),
    (draft) => {
      draft.find((row) => row.id === 999)!.id = -1;
    },
    { strict: true }
  );
  expect(warn).not.toHaveBeenCalled();
});

test('elements drafted while being removed or moved do not count', async () => {
  const { create } = await load();
  // Strict mode moves arrays of objects through the proxy, which drafts
  // every element it reads.
  create(
    rows(2000),
    (draft) => {
      draft.splice(0);
    },
    { strict: true }
  );
  create(
    rows(2000),
    (draft) => {
      draft.shift();
    },
    { strict: true }
  );
  create(
    rows(2000),
    (draft) => {
      draft.reverse();
    },
    { strict: true }
  );
  expect(warn).not.toHaveBeenCalled();
});

test('a search through current() does not warn', async () => {
  const { create, current } = await load();
  const state = create(
    rows(2000),
    (draft) => {
      const index = current(draft).findIndex((row) => row.id === 1999);
      draft[index].id = -1;
    },
    { strict: true }
  );
  expect(state[1999].id).toBe(-1);
  expect(warn).not.toHaveBeenCalled();
});

test('reading the values of a large object warns too', async () => {
  const { create } = await load();
  const entities = Object.fromEntries(
    rows(1000).map((row) => [`id${row.id}`, row])
  );
  create(
    { entities },
    (draft) => {
      Object.values(draft.entities).find((row) => row.id === -1);
    },
    { strict: true }
  );
  expect(warn).toHaveBeenCalledTimes(1);
  expect(warn.mock.calls[0][0]).toContain('left 1001 drafts unchanged');
});
