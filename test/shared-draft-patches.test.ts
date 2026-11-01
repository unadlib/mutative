/* eslint-disable no-void -- Pre-reads intentionally discard values to control draft creation order. */
import { apply, create, type Patches } from '../src';

type SharedValue = number[] | { inner: SharedValue };
type SharedParent = { q: SharedValue; extra?: SharedValue };
type State = {
  a: SharedParent;
  b: Partial<SharedParent>;
  c: { x: SharedValue };
};

function sharedValue(depth: number, values: number[]): SharedValue {
  return depth === 0 ? values : { inner: sharedValue(depth - 1, values) };
}

function changedArray(value: SharedValue): number[] {
  return Array.isArray(value) ? value : changedArray(value.inner);
}

function makeBase(depth: number): State {
  return { a: { q: sharedValue(depth, [0]) }, b: {}, c: { x: [] } };
}

const readOrders: {
  name: string;
  before: ('b' | 'c.x')[];
  readB: boolean;
  readX: boolean;
}[] = [
  {
    name: 'both reads before assignment',
    before: [],
    readB: true,
    readX: true,
  },
  { name: 'only b read', before: [], readB: true, readX: false },
  { name: 'only c.x read', before: [], readB: false, readX: true },
  { name: 'no pre-reads', before: [], readB: false, readX: false },
  { name: 'b read first', before: ['b'], readB: false, readX: true },
  { name: 'c.x read first', before: ['c.x'], readB: true, readX: false },
  {
    name: 'b then c.x read first',
    before: ['b', 'c.x'],
    readB: false,
    readX: false,
  },
  {
    name: 'c.x then b read first',
    before: ['c.x', 'b'],
    readB: false,
    readX: false,
  },
];

const configurations = [false, true].flatMap((enableAutoFreeze) =>
  [false, true].flatMap((pathAsArray) =>
    [false, true].map((arrayLengthAssignment) => ({
      enableAutoFreeze,
      enablePatches: { pathAsArray, arrayLengthAssignment },
    }))
  )
);

describe.each(configurations)(
  'shared draft patches with options %j',
  (options) => {
    describe.each([0, 1, 2])('shared draft depth %i', (depth) => {
      test.each(readOrders)('$name', ({ before, readB, readX }) => {
        const base = makeBase(depth);
        const [state, patches, inversePatches] = create(
          base,
          (draft) => {
            // Reads create drafts whose finalization order must not affect replay.
            for (const key of before) {
              if (key === 'b') void draft.b;
              else void draft.c.x;
            }
            const q = draft.a.q;
            const values = changedArray(q);
            if (readB) void draft.b;
            draft.b = draft.a;
            if (readX) void draft.c.x;
            // The changed array itself is shared, also when q nests it: with
            // c.x read after it, c.x finds it before its own node, the order
            // in which #217 generated its patches twice.
            draft.c.x = values;
            draft.a.extra = q;
            values.push(1);
          },
          options
        );

        const expectedValue = sharedValue(depth, [0, 1]);
        const expectedParent = { q: expectedValue, extra: expectedValue };
        expect(state).toStrictEqual({
          a: expectedParent,
          b: expectedParent,
          c: { x: [0, 1] },
        });
        expect(state.b).toBe(state.a);
        expect(state.c.x).toBe(changedArray(state.a.q as SharedValue));
        expect(state.a.extra).toBe(state.a.q);
        expect(Object.isFrozen(state)).toBe(options.enableAutoFreeze);
        expect(apply(base, patches)).toStrictEqual(state);
        expect(apply(state, inversePatches)).toStrictEqual(base);

        // Serialized patches must also support persistence and undo/redo.
        const serializedPatches = JSON.parse(JSON.stringify(patches));
        const serializedInverse = JSON.parse(JSON.stringify(inversePatches));
        const replayed = apply(makeBase(depth), serializedPatches);
        expect(replayed).toStrictEqual(state);
        const restored = apply(replayed, serializedInverse);
        expect(restored).toStrictEqual(base);
        expect(apply(restored, serializedPatches)).toStrictEqual(state);
        expect(base).toStrictEqual(makeBase(depth));

        const arrayPath = ['a', 'q', ...Array(depth).fill('inner'), 1];
        const path = options.enablePatches.pathAsArray
          ? arrayPath
          : `/${arrayPath.join('/')}`;
        expect(
          patches.filter(
            (patch) => JSON.stringify(patch.path) === JSON.stringify(path)
          )
        ).toStrictEqual([{ op: 'add', path, value: 1 }]);
      });
    });
  }
);

type ListState = {
  a: { q: number[]; extra?: number[] };
  b: { q?: number[]; extra?: number[] };
  c: { x: number[] };
};

const makeListBase = (): ListState => ({
  a: { q: [0, 1, 2] },
  b: {},
  c: { x: [] },
});

const removals: [string, (values: number[]) => void][] = [
  [
    'pop',
    (values) => {
      values.pop();
    },
  ],
  [
    'splice',
    (values) => {
      values.splice(1, 1);
    },
  ],
  [
    'shift',
    (values) => {
      values.shift();
    },
  ],
];

// A repeated inverse patch restores a removed item twice, which breaks undo.
describe.each(
  [false, true].flatMap((strict) =>
    [false, true].map((arrayLengthAssignment) => ({
      strict,
      enablePatches: { arrayLengthAssignment },
    }))
  )
)('shared draft removals with options %j', (options) => {
  test.each(removals)('%s', (_, remove) => {
    const base = makeListBase();
    const [state, patches, inversePatches] = create(
      base,
      (draft) => {
        const q = draft.a.q;
        void draft.b;
        draft.b = draft.a;
        void draft.c.x;
        draft.c.x = q;
        draft.a.extra = q;
        remove(q);
      },
      options
    );
    expect(apply(base, patches)).toStrictEqual(state);
    expect(apply(state, inversePatches)).toStrictEqual(base);
    expect(base).toStrictEqual(makeListBase());
  });
});

const sharedDrafts: [string, () => object, (value: any) => void][] = [
  [
    'object',
    () => ({ k: 0 }),
    (value) => {
      value.n = 1;
    },
  ],
  [
    'Map',
    () => new Map([['k', 0]]),
    (value) => {
      value.set('n', 1);
    },
  ],
  [
    'Set',
    () => new Set([0]),
    (value) => {
      value.add(1);
    },
  ],
];

describe.each([false, true])('shared drafts with strict %s', (strict) => {
  test.each(sharedDrafts)(
    'a shared %s draft generates its patches once',
    (_, make, change) => {
      const base: any = { a: { q: make() }, b: {}, c: { x: {} } };
      const [state, patches, inversePatches] = create(
        base,
        (draft: any) => {
          const q = draft.a.q;
          void draft.b;
          draft.b = draft.a;
          void draft.c.x;
          draft.c.x = q;
          draft.a.extra = q;
          change(q);
        },
        { enablePatches: true, strict }
      );
      const inQ = (list: Patches) =>
        list.filter(
          (patch) => patch.path.length === 3 && patch.path[1] === 'q'
        );
      expect(inQ(patches)).toHaveLength(1);
      expect(inQ(inversePatches)).toHaveLength(1);
      expect(apply(base, patches)).toStrictEqual(state);
      expect(apply(state, inversePatches)).toStrictEqual(base);
    }
  );
});
