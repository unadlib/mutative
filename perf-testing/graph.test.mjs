import assert from 'node:assert/strict';
import test from 'node:test';
import { enableMapSet, enablePatches, Immer, immerable } from 'immer';
import { create } from 'mutative-v1';
import {
  assertSameData,
  canonical,
  deepFreeze,
  isFrozenValue,
  replayPatches,
} from './graph.mjs';

enableMapSet();
enablePatches();

class Entity {
  static [immerable] = true;

  constructor(id) {
    this.id = id;
    this.value = id;
    this.nested = { value: id + 1 };
  }
}

const markEntity = (target, { immutable }) =>
  target instanceof Entity ? immutable : undefined;

const createBase = () => ({
  map: new Map([
    [1, { value: 1 }],
    [2, { value: 2 }],
  ]),
  ids: new Set([1, 2]),
  objects: new Set([
    { id: 1, value: 1 },
    { id: 2, value: 2 },
  ]),
  item: new Entity(1),
});

// Mutative 1.3.0 freezes Map and Set values as the candidate does.
const producers = {
  mutative: (base, recipe, autoFreeze, patches = false) =>
    create(base, recipe, {
      enableAutoFreeze: autoFreeze,
      enablePatches: patches ? { arrayLengthAssignment: false } : false,
      mark: markEntity,
    }),
  immer: (base, recipe, autoFreeze, patches = false) => {
    const immer = new Immer({ autoFreeze });
    return (patches ? immer.produceWithPatches : immer.produce)(base, recipe);
  },
};

const recipe = (draft) => {
  draft.map.get(1).value += 1;
  draft.map.delete(2);
  draft.map.set(3, { value: 3 });
  draft.ids.add(3);
  draft.ids.delete(1);
  draft.objects.values().next().value.value += 1;
  draft.item.nested.value += 1;
};

const expected = () => ({
  map: new Map([
    [1, { value: 2 }],
    [3, { value: 3 }],
  ]),
  ids: new Set([2, 3]),
  objects: new Set([
    { id: 1, value: 2 },
    { id: 2, value: 2 },
  ]),
  item: Object.assign(new Entity(1), { nested: { value: 3 } }),
});

test('frozen collections of both libraries are detected and compared by their data', () => {
  for (const [library, produce] of Object.entries(producers)) {
    const result = produce(createBase(), recipe, true);
    for (const key of ['map', 'ids', 'objects', 'item'])
      assert.equal(isFrozenValue(result[key]), true, `${library} ${key}`);
    assertSameData(result, expected(), library);
    const unfrozen = produce(createBase(), recipe, false);
    for (const key of ['map', 'ids', 'objects', 'item'])
      assert.equal(isFrozenValue(unfrozen[key]), false, `${library} ${key}`);
  }
  // Mutative's replaced mutators are enumerable, so deepStrictEqual alone
  // would report its frozen Map as different data.
  const frozen = producers.mutative(createBase(), recipe, true).map;
  assert.notDeepStrictEqual(frozen, expected().map);
  assertSameData(frozen, expected().map, 'canonical Map');
});

test('ordered views check Map and Set iteration order', () => {
  const forward = new Map([
    [1, 'a'],
    [2, 'b'],
  ]);
  const reversed = new Map([
    [2, 'b'],
    [1, 'a'],
  ]);
  assertSameData(forward, reversed, 'unordered', false);
  assert.throws(() => assertSameData(forward, reversed, 'ordered'));
  assert.throws(() =>
    assertSameData(new Set([1, 2]), new Set([2, 1]), 'ordered Set')
  );
  assertSameData(canonical(forward), forward, 'canonical copies keep order');
});

test('deepFreeze freezes collection contents and rejects their mutators', () => {
  const base = deepFreeze(createBase());
  for (const key of ['map', 'ids', 'objects', 'item'])
    assert.equal(isFrozenValue(base[key]), true, key);
  assert.equal(Object.isFrozen(base.map.get(1)), true);
  assert.equal(Object.isFrozen([...base.objects][0]), true);
  assert.throws(() => base.map.set(4, {}), TypeError);
  assert.throws(() => base.ids.add(4), TypeError);
  // The replaced mutators are not data.
  assert.deepEqual(Object.keys(base.map), []);
  assertSameData(base, createBase(), 'frozen input data');
});

test('replayPatches applies the Map, Set and class patches of both libraries', () => {
  for (const [library, produce] of Object.entries(producers)) {
    const base = createBase();
    const [next, forward, inverse] = produce(base, recipe, false, true);
    assertSameData(next, expected(), `${library} result`);
    assertSameData(
      replayPatches(base, forward),
      next,
      `${library} forward`,
      false
    );
    assertSameData(
      replayPatches(next, inverse),
      createBase(),
      `${library} inverse`,
      false
    );
    assert.equal(
      Object.getPrototypeOf(replayPatches(base, forward).item),
      Entity.prototype
    );
  }
});

test('replayPatches rejects patches whose target does not exist', () => {
  const base = createBase();
  assert.throws(() =>
    replayPatches(base, [
      { op: 'replace', path: ['map', 9, 'value'], value: 1 },
    ])
  );
  assert.throws(() =>
    replayPatches(base, [{ op: 'replace', path: ['map', 9], value: 1 }])
  );
  assert.throws(() =>
    replayPatches(base, [{ op: 'remove', path: ['ids', 0], value: 9 }])
  );
  assert.throws(() =>
    replayPatches(base, [{ op: 'replace', path: ['ids', 0], value: 1 }])
  );
});
