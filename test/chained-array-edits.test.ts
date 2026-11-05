/* eslint-disable no-bitwise */
import { isDeepStrictEqual } from 'node:util';
import { apply, create, type Patches } from '../src';

// Writes as a store makes them: each state is the base of the next write, so a
// write starts from what earlier ones finalized -- arrays that auto-freeze or
// the application froze, holes, and elements no write touched. Each write
// makes one to three random edits, among them deletes at indexes the list has
// and at indexes it does not have, and the list is compared with a plain array
// given the same edits. As in the random sparse edits of
// sparse-array-patches.test.ts, native methods on a proxy are the oracle, with
// Mutative's documented delete: an index the array has becomes `undefined`,
// and deleting one it does not have -- a hole, or past the end -- changes
// nothing.

type Item = { n: number };
type Row = Item | number | string | null | undefined;
type State = { list: Row[]; other: number };
type Edit = { code: number; a: number; b: number; value: number };

const isItem = (row: Row): row is Item =>
  typeof row === 'object' && row !== null;

// Each side of an edit makes its own value, so the list and the plain array
// never share an object.
const values: (() => Row)[] = [
  () => ({ n: 0 }),
  () => ({ n: 5 }),
  () => 0,
  () => -0,
  () => NaN,
  () => 1.5,
  () => 'a',
  () => null,
  () => undefined,
];

const deleteAsMutative: ProxyHandler<Row[]> = {
  deleteProperty(target, key) {
    if (Object.hasOwn(target, key)) Reflect.set(target, key, undefined);
    return true;
  },
};

// Edits a list at indexes up to two past its end. Code 12 is the write's edit
// beside the list, which `recipe` makes.
const editList = (list: Row[], { code, a, b, value }: Edit) => {
  const at = a % (list.length + 3);
  const other = b % (list.length + 3);
  switch (code) {
    case 0:
      list[at] = values[value]();
      break;
    case 1: {
      const row = list[at];
      if (isItem(row)) row.n += 1;
      else list[at] = { n: 1 };
      break;
    }
    case 2:
      list.push(values[value]());
      break;
    case 3:
      list.pop();
      break;
    case 4:
      list.splice(
        at,
        b % 4,
        ...Array.from({ length: value % 3 }, () => values[value]())
      );
      break;
    case 5:
      list.reverse();
      break;
    case 6:
      if (at < list.length && other < list.length) {
        const held = list[at];
        list[at] = list[other];
        list[other] = held;
      }
      break;
    case 7:
      list.length = at;
      break;
    case 8:
      delete list[at];
      break;
    case 9:
      if (at < list.length) list[at] = list[other];
      break;
    case 10:
      list.unshift(values[value]());
      break;
    case 11:
      list.shift();
      break;
    default: {
      // An index the list does not have: a hole, or one past the end.
      const missing: number[] = [];
      for (let index = 0; index < list.length + 3; index += 1) {
        if (!(index in list)) missing.push(index);
      }
      delete list[missing[a % missing.length]];
    }
  }
};

// The plain array's own objects, so that an edit inside one changes it at only
// the index it was made at, as an edit inside a draft does.
const copyList = (list: Row[]) =>
  list.map((row) => (isItem(row) ? { ...row } : row));

// As an application that hands its state out frozen does.
const freezeList = (list: Row[]) => {
  list.forEach((row) => {
    if (isItem(row)) Object.freeze(row);
  });
  Object.freeze(list);
};

const createRandom = (seed: number) => {
  let state = seed;
  return (limit: number) => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) % limit;
  };
};

// `isDeepStrictEqual` tells holes from `undefined`, as `toStrictEqual` does, in
// a fraction of the time; `expect` then describes the difference.
const same = (actual: unknown, expected: unknown, context: string) => {
  if (isDeepStrictEqual(actual, expected)) return;
  expect(actual, context).toStrictEqual(expected);
  throw new Error(`${context}: the values are not deeply strictly equal`);
};

describe.each([
  { name: 'unfrozen', enableAutoFreeze: false, freeze: false, seed: 0x2f6b1 },
  { name: 'auto-frozen', enableAutoFreeze: true, freeze: false, seed: 0x5d3a7 },
  {
    name: 'application-frozen',
    enableAutoFreeze: false,
    freeze: true,
    seed: 0x7c4e9,
  },
])('writes chained on $name states', ({ enableAutoFreeze, freeze, seed }) => {
  test.each([false, true])(
    'random edits match a plain array, with enablePatches %s',
    (enablePatches) => {
      const random = createRandom(seed + Number(enablePatches));
      for (let sample = 0; sample < 100; sample += 1) {
        const initial: Row[] = Array.from({ length: random(25) }, () =>
          random(4) === 0
            ? Object.freeze({ n: random(10) })
            : values[random(values.length)]()
        );
        for (let index = 0; index < initial.length; index += 1) {
          if (random(4) === 0) delete initial[index];
        }
        let state: State = { list: initial, other: 0 };
        let model: State = { list: copyList(initial), other: 0 };
        if (freeze) freezeList(state.list);
        for (let write = 0; write < 30; write += 1) {
          const edits: Edit[] = Array.from({ length: 1 + random(3) }, () => ({
            code: random(14),
            a: random(65536),
            b: random(65536),
            value: random(values.length),
          }));
          const recipe = (draft: State) => {
            for (const edit of edits) {
              if (edit.code === 12) draft.other += 1;
              else editList(draft.list, edit);
            }
          };
          const before = model;
          const rows = copyList(before.list);
          const plain = {
            list: new Proxy(rows, deleteAsMutative),
            other: before.other,
          };
          recipe(plain);
          model = { list: rows, other: plain.other };
          const previous = state;
          let patches: Patches | undefined;
          let inverse: Patches | undefined;
          if (enablePatches) {
            const [next, forward, backward] = create(previous, recipe, {
              enablePatches: true,
              enableAutoFreeze,
            });
            state = next as State;
            patches = forward;
            inverse = backward;
          } else {
            state = create(previous, recipe, { enableAutoFreeze }) as State;
          }
          const context = `sample ${sample}, write ${write}: ${JSON.stringify(edits)}`;
          same(state, model, context);
          // The base is left as it was.
          same(previous, before, context);
          if (edits.every(({ code }) => code >= 12)) {
            // Nothing in the list changed, so it is shared with the base; and
            // with no other edit, the state is the base.
            expect(state.list, context).toBe(previous.list);
            if (edits.every(({ code }) => code === 13)) {
              expect(state, context).toBe(previous);
              if (patches) expect(patches, context).toStrictEqual([]);
            }
          }
          if (patches && inverse) {
            same(apply(previous, patches), state, context);
            same(apply(state, inverse), previous, context);
          }
          if (freeze) freezeList(state.list);
        }
      }
    }
  );
});
