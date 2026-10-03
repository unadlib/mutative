import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';

const collectionMutators = {
  map: ['set', 'delete', 'clear'],
  set: ['add', 'delete', 'clear'],
};

function rejectMutation() {
  throw new TypeError('Cannot modify a frozen benchmark collection');
}

// Pre-freezes inputs and payloads as both libraries freeze their results.
// Map and Set contents ignore Object.freeze, so their mutators are replaced too.
export function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    if (value instanceof Map || value instanceof Set) {
      for (const child of graphChildren(value)) deepFreeze(child);
      for (const name of collectionMutators[
        value instanceof Map ? 'map' : 'set'
      ])
        Object.defineProperty(value, name, { value: rejectMutation });
    } else {
      for (const child of Object.values(value)) deepFreeze(child);
    }
    Object.freeze(value);
  }
  return value;
}

// Immer freezes a Map or Set with Object.freeze and replaced mutators; Mutative
// replaces the mutators only. Either way, the collection rejects mutation.
export function isFrozenValue(value) {
  if (value instanceof Map) return value.set !== Map.prototype.set;
  if (value instanceof Set) return value.add !== Set.prototype.add;
  return Object.isFrozen(value);
}

export function graphChildren(value) {
  if (value instanceof Map) return [...value.keys(), ...value.values()];
  if (value instanceof Set) return [...value];
  return Object.values(value);
}

class OrderedEntries {
  constructor(kind, entries) {
    this.kind = kind;
    this.entries = entries;
  }
}

// A deep copy of the data alone: arrays, Map entries, Set values, and own
// enumerable properties of objects, which keep their prototypes. It ignores
// the mutators a frozen collection carries. An ordered view also lists Map
// entries and Set values in iteration order, for which deepStrictEqual alone
// does not check.
export function canonical(value, ordered = false) {
  if (!value || typeof value !== 'object') return value;
  if (value instanceof Map) {
    const entries = [...value].map(([key, entry]) => [
      canonical(key, ordered),
      canonical(entry, ordered),
    ]);
    return ordered ? new OrderedEntries('map', entries) : new Map(entries);
  }
  if (value instanceof Set) {
    const entries = [...value].map((entry) => canonical(entry, ordered));
    return ordered ? new OrderedEntries('set', entries) : new Set(entries);
  }
  if (Array.isArray(value))
    return value.map((entry) => canonical(entry, ordered));
  const copy = Object.create(Object.getPrototypeOf(value));
  for (const key of Object.keys(value))
    copy[key] = canonical(value[key], ordered);
  return copy;
}

export function assertSameData(actual, expected, message, ordered = true) {
  assert.deepEqual(
    canonical(actual, ordered),
    canonical(expected, ordered),
    message
  );
}

function childAt(parent, key) {
  if (parent instanceof Map) {
    assert.ok(parent.has(key), 'patch parent must exist');
    return parent.get(key);
  }
  if (parent instanceof Set) {
    const values = [...parent];
    assert.ok(Number.isSafeInteger(key) && key >= 0 && key < values.length);
    return values[key];
  }
  assert.ok(parent && typeof parent === 'object');
  assert.ok(Object.hasOwn(parent, key), 'patch parent must exist');
  return parent[key];
}

function applyLeaf(parent, op, key, patch) {
  if (Array.isArray(parent)) {
    const index = Number(key);
    assert.ok(Number.isSafeInteger(index) && index >= 0);
    assert.ok(
      index < parent.length || (op === 'add' && index === parent.length)
    );
    if (op === 'add') parent.splice(index, 0, canonical(patch.value));
    else if (op === 'remove') parent.splice(index, 1);
    else parent[index] = canonical(patch.value);
  } else if (parent instanceof Map) {
    if (op !== 'add') assert.ok(parent.has(key), 'patched Map key must exist');
    if (op === 'remove') parent.delete(key);
    else parent.set(key, canonical(patch.value));
  } else if (parent instanceof Set) {
    // Set patches address values; their index only records the position.
    assert.ok(Number.isSafeInteger(key) && key >= 0);
    assert.notEqual(op, 'replace', 'Set values are added or removed');
    if (op === 'add') parent.add(canonical(patch.value));
    else {
      const removed = [...parent].find((entry) =>
        isDeepStrictEqual(canonical(entry), canonical(patch.value))
      );
      assert.ok(
        removed !== undefined || parent.has(patch.value),
        'removed Set value must exist'
      );
      parent.delete(removed === undefined ? patch.value : removed);
    }
  } else {
    assert.ok(typeof key === 'string' || typeof key === 'number');
    if (op !== 'add') assert.ok(Object.hasOwn(parent, key));
    if (op === 'remove') delete parent[key];
    else parent[key] = canonical(patch.value);
  }
}

// Independent plain-JavaScript replay, including own fields with undefined
// values in the RTKQ fixture, Map keys, Set values, and class prototypes.
// JSON serialization would lose all of them.
export function replayPatches(base, patches) {
  let document = canonical(base);
  for (const patch of patches) {
    const { op, path } = patch;
    assert.ok(['add', 'remove', 'replace'].includes(op));
    assert.ok(Array.isArray(path), 'patch paths must be arrays');
    if (op !== 'remove') assert.ok(Object.hasOwn(patch, 'value'));
    if (!path.length) {
      assert.equal(op, 'replace');
      document = canonical(patch.value);
    } else {
      let parent = document;
      for (const key of path.slice(0, -1)) parent = childAt(parent, key);
      assert.ok(parent && typeof parent === 'object');
      applyLeaf(parent, op, path.at(-1), patch);
    }
  }
  return document;
}
