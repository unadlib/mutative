import { immerable } from 'immer';

// Workloads beyond the upstream suite: keyed collections, object records,
// class instances, a deep path, combined large-state updates, patch
// application, and producers that return a value. Each fixture holds only the
// structure it measures and an untouched branch.
const stable = () => ({ value: 'untouched' });
const range = (length) => Array.from({ length }, (_, i) => i);
const row = (id) => ({ id, value: id, nested: { value: id + 1 } });

export class Entity {
  // Immer drafts class instances marked with immerable; Mutative uses `mark`.
  static [immerable] = true;

  constructor(id) {
    this.id = id;
    this.value = id;
    this.nested = { value: id + 1 };
  }
}

export class Settings {
  static [immerable] = true;

  constructor(size) {
    for (let i = 0; i < size; i++) this[`field${i}`] = i;
  }
}

export const markClasses = (target, { immutable }) =>
  target instanceof Entity || target instanceof Settings
    ? immutable
    : undefined;

export const DEEP_LEVELS = 10;
const DEEP_WIDTH = 10;

function createDeepNode(level) {
  const node = {};
  for (let i = 0; i < DEEP_WIDTH; i++)
    node[`k${i}`] =
      i === 0 && level < DEEP_LEVELS ? createDeepNode(level + 1) : { value: i };
  return node;
}

// The upstream fixture's array and first wide object, as the removed
// `benchmark:base` script updated them: one push and one new property.
export const pushAndInsert = (index) => ({
  type: 'bench/push-and-insert',
  index,
  key: `inserted${index}`,
  payload: { id: index, value: index, nested: { data: index } },
});

export function createExtendedScenarios(config) {
  const size = config.arraySize;
  const middle = Math.floor(size / 2);
  const tenPercent = Math.max(1, Math.ceil(size / 10));
  const mapState = () => ({
    map: new Map(range(size).map((id) => [id, row(id)])),
    stable: stable(),
  });
  const numberMapState = () => ({
    map: new Map(range(size).map((id) => [id, id])),
    stable: stable(),
  });
  const idSetState = () => ({ ids: new Set(range(size)), stable: stable() });
  const objectSetState = () => ({
    objects: new Set(range(size).map((id) => ({ id, value: id }))),
    stable: stable(),
  });
  const collectionsState = () => ({
    ...mapState(),
    ids: new Set(range(size)),
    value: 0,
  });
  const recordState = () => {
    const entities = {};
    for (const id of range(size)) entities[`id${id}`] = row(id);
    return { entities, stable: stable() };
  };
  const rowsState = () => ({ rows: range(size).map(row), stable: stable() });
  const entry = (name, createBase, steps, options = {}) => ({
    name,
    createBase,
    steps,
    ...options,
  });
  const collection = { mapSet: true };
  const classes = { mark: markClasses };
  const apply = (name, patches) =>
    entry(name, rowsState, [{ type: 'bench/apply', patches }], {
      kind: 'apply',
    });
  return [
    entry(
      'map-update',
      mapState,
      [{ type: 'bench/map-update', key: middle }],
      collection
    ),
    entry(
      'map-update-10pct',
      mapState,
      [{ type: 'bench/map-update-many', count: tenPercent }],
      collection
    ),
    entry(
      'map-insert',
      mapState,
      [{ type: 'bench/map-insert', key: size, payload: row(size) }],
      collection
    ),
    entry(
      'map-delete',
      mapState,
      [{ type: 'bench/map-delete', key: middle }],
      collection
    ),
    entry('map-read', mapState, [{ type: 'bench/read-map' }], collection),
    entry(
      'map-forEach',
      numberMapState,
      [{ type: 'bench/read-map-forEach' }],
      collection
    ),
    // One producer changes a Map and a Set, which copies them, and the next
    // ones update a value beside them. With auto-freeze, the first producer
    // freezes the copies, which the others then find frozen.
    entry(
      'map-set-beside',
      collectionsState,
      [
        {
          type: 'bench/map-set-insert',
          key: size,
          payload: row(size),
          value: size,
        },
        ...Array.from({ length: config.reuseStateIterations - 1 }, () => ({
          type: 'bench/value-update',
        })),
      ],
      collection
    ),
    entry(
      'set-add',
      idSetState,
      [{ type: 'bench/set-add', value: size }],
      collection
    ),
    entry(
      'set-delete',
      idSetState,
      [{ type: 'bench/set-delete', value: middle }],
      collection
    ),
    entry(
      'set-read',
      idSetState,
      [{ type: 'bench/read-set', present: middle, missing: size }],
      collection
    ),
    entry(
      'set-update',
      objectSetState,
      [{ type: 'bench/set-update', count: 1 }],
      collection
    ),
    entry(
      'set-update-10pct',
      objectSetState,
      [{ type: 'bench/set-update', count: tenPercent }],
      collection
    ),
    entry('object-update', recordState, [
      { type: 'bench/object-update', keys: [`id${middle}`] },
    ]),
    entry('object-update-10pct', recordState, [
      {
        type: 'bench/object-update',
        keys: range(tenPercent).map((id) => `id${id}`),
      },
    ]),
    entry('object-delete', recordState, [
      { type: 'bench/object-delete', key: `id${middle}` },
    ]),
    entry(
      'class-update',
      () => ({
        items: range(size).map((id) => new Entity(id)),
        stable: stable(),
      }),
      [{ type: 'bench/class-update', index: middle }],
      classes
    ),
    entry(
      'class-wide-update',
      () => ({ settings: new Settings(size), stable: stable() }),
      [{ type: 'bench/class-wide-update', field: `field${middle}` }],
      classes
    ),
    entry(
      'deep-update',
      () => ({ root: createDeepNode(1), stable: stable() }),
      [
        {
          type: 'bench/deep-update',
          path: ['root', ...Array.from({ length: DEEP_LEVELS }, () => 'k0')],
        },
      ]
    ),
    apply(
      'apply-update-10pct',
      range(tenPercent).map((id) => ({
        op: 'replace',
        path: ['rows', id, 'nested', 'value'],
        value: id + 2,
      }))
    ),
    apply('apply-array-ops', [
      { op: 'add', path: ['rows', middle], value: row(size) },
      { op: 'remove', path: ['rows', 0] },
      { op: 'replace', path: ['rows', size - 1], value: row(size + 1) },
    ]),
    // The forward patches of reversing the rows, with values that arrive
    // detached from the state, as they do from storage or another client.
    apply(
      'apply-reverse',
      range(size).map((index) => ({
        op: 'replace',
        path: ['rows', index],
        value: row(size - 1 - index),
      }))
    ),
    // Both libraries search a returned value for drafts; rawReturn() tells
    // Mutative that it holds none. Immer has no equivalent.
    entry('return-replace', rowsState, [
      { type: 'bench/return-replace', payload: range(size).map(row) },
    ]),
    entry('return-replace-raw', rowsState, [
      { type: 'bench/return-replace-raw', payload: range(size).map(row) },
    ]),
    entry('return-filter', () => range(size).map(row), [
      { type: 'bench/return-filter' },
    ]),
    // Find the last row and update it after the array changed: by searching
    // the draft, which drafts every row it visits, or a current() snapshot,
    // which reads plain values, after an update or after a shift.
    entry('search-draft', rowsState, [
      { type: 'bench/search', via: 'draft', id: size - 1 },
    ]),
    entry('search-current', rowsState, [
      { type: 'bench/search', via: 'current', id: size - 1 },
    ]),
    entry('search-current-shifted', rowsState, [
      { type: 'bench/search', via: 'current', shift: true, id: size - 1 },
    ]),
    // Update a row that shift() moved: drafting it needs its original index.
    entry('shift-and-update', rowsState, [
      { type: 'bench/shift-and-update', index: middle },
    ]),
  ];
}

export function expectedExtendedReads(state, action) {
  switch (action.type) {
    case 'bench/read-map': {
      let sum = 0;
      for (const value of state.map.values()) sum += value.nested.value;
      return [sum];
    }
    case 'bench/read-map-forEach': {
      let sum = 0;
      state.map.forEach((value) => {
        sum += value;
      });
      return [sum];
    }
    case 'bench/read-set':
      return [
        state.ids.has(action.present),
        state.ids.has(action.missing),
        state.ids.size,
      ];
    default:
      return [];
  }
}

export function applyExtendedRecipe(
  draft,
  action,
  consumeRead,
  state,
  rawReturn,
  current
) {
  switch (action.type) {
    case 'bench/map-update':
      draft.map.get(action.key).nested.value += 1;
      break;
    case 'bench/map-update-many':
      for (let key = 0; key < action.count; key++)
        draft.map.get(key).nested.value += 1;
      break;
    case 'bench/map-insert':
      draft.map.set(action.key, action.payload);
      break;
    case 'bench/map-delete':
      draft.map.delete(action.key);
      break;
    case 'bench/read-map': {
      let sum = 0;
      for (const value of draft.map.values()) sum += value.nested.value;
      consumeRead(sum);
      break;
    }
    case 'bench/read-map-forEach': {
      let sum = 0;
      draft.map.forEach((value) => {
        sum += value;
      });
      consumeRead(sum);
      break;
    }
    case 'bench/map-set-insert':
      draft.map.set(action.key, action.payload);
      draft.ids.add(action.value);
      break;
    case 'bench/value-update':
      draft.value += 1;
      break;
    case 'bench/set-add':
      draft.ids.add(action.value);
      break;
    case 'bench/set-delete':
      draft.ids.delete(action.value);
      break;
    case 'bench/read-set':
      consumeRead(draft.ids.has(action.present));
      consumeRead(draft.ids.has(action.missing));
      consumeRead(draft.ids.size);
      break;
    case 'bench/set-update': {
      const values = draft.objects.values();
      for (let i = 0; i < action.count; i++) values.next().value.value += 1;
      break;
    }
    case 'bench/object-update':
      for (const key of action.keys) draft.entities[key].nested.value += 1;
      break;
    case 'bench/object-delete':
      delete draft.entities[action.key];
      break;
    case 'bench/class-update': {
      const item = draft.items[action.index];
      item.value += 1;
      item.nested.value += 1;
      break;
    }
    case 'bench/class-wide-update':
      draft.settings[action.field] += 1;
      break;
    case 'bench/deep-update': {
      let node = draft;
      for (const key of action.path) node = node[key];
      node.value += 1;
      break;
    }
    case 'bench/push-and-insert':
      draft.largeArray.push(action.payload);
      draft.largeObject1[action.key] = { id: action.index };
      break;
    case 'bench/return-replace':
      return { ...state, rows: action.payload };
    case 'bench/return-replace-raw':
      return rawReturn({ ...state, rows: action.payload });
    case 'bench/return-filter':
      return draft.filter((item) => item.value % 2 === 0);
    case 'bench/search': {
      if (action.shift) draft.rows.shift();
      else draft.rows[0].nested.value += 1;
      const rows = action.via === 'current' ? current(draft.rows) : draft.rows;
      const index = rows.findIndex((item) => item.id === action.id);
      if (index !== -1) draft.rows[index].nested.value += 1;
      break;
    }
    case 'bench/shift-and-update':
      draft.rows.shift();
      draft.rows[action.index].nested.value += 1;
      break;
    default:
      throw new Error(`Unknown extended recipe: ${action.type}`);
  }
  return undefined;
}

const cloneInstance = (instance, changes) =>
  Object.assign(
    Object.create(Object.getPrototypeOf(instance)),
    instance,
    changes
  );

const incrementNested = (item) => ({
  ...item,
  nested: { ...item.nested, value: item.nested.value + 1 },
});

function updateIn(node, path, index) {
  if (index === path.length) return { ...node, value: node.value + 1 };
  const key = path[index];
  return { ...node, [key]: updateIn(node[key], path, index + 1) };
}

// Copies every container on a patch's path; the reference for apply-*.
function applyPatchImmutably(node, patch, index) {
  const { op, path } = patch;
  const key = path[index];
  const copy = Array.isArray(node) ? node.slice() : { ...node };
  if (index < path.length - 1) {
    copy[key] = applyPatchImmutably(node[key], patch, index + 1);
  } else if (Array.isArray(copy) && op !== 'replace') {
    if (op === 'add') copy.splice(key, 0, patch.value);
    else copy.splice(key, 1);
  } else if (op === 'remove') {
    delete copy[key];
  } else {
    copy[key] = patch.value;
  }
  return copy;
}

export function reduceExtended(state, action) {
  switch (action.type) {
    case 'bench/map-update': {
      const map = new Map(state.map);
      map.set(action.key, incrementNested(map.get(action.key)));
      return { ...state, map };
    }
    case 'bench/map-update-many': {
      const map = new Map(state.map);
      for (let key = 0; key < action.count; key++)
        map.set(key, incrementNested(map.get(key)));
      return { ...state, map };
    }
    case 'bench/map-insert':
      return {
        ...state,
        map: new Map(state.map).set(action.key, action.payload),
      };
    case 'bench/map-delete': {
      const map = new Map(state.map);
      map.delete(action.key);
      return { ...state, map };
    }
    case 'bench/map-set-insert':
      return {
        ...state,
        map: new Map(state.map).set(action.key, action.payload),
        ids: new Set(state.ids).add(action.value),
      };
    case 'bench/value-update':
      return { ...state, value: state.value + 1 };
    case 'bench/set-add':
      return { ...state, ids: new Set(state.ids).add(action.value) };
    case 'bench/set-delete': {
      const ids = new Set(state.ids);
      ids.delete(action.value);
      return { ...state, ids };
    }
    case 'bench/set-update': {
      const objects = new Set();
      let index = 0;
      for (const item of state.objects) {
        objects.add(
          index < action.count ? { ...item, value: item.value + 1 } : item
        );
        index += 1;
      }
      return { ...state, objects };
    }
    case 'bench/object-update': {
      const entities = { ...state.entities };
      for (const key of action.keys)
        entities[key] = incrementNested(entities[key]);
      return { ...state, entities };
    }
    case 'bench/object-delete': {
      const entities = { ...state.entities };
      delete entities[action.key];
      return { ...state, entities };
    }
    case 'bench/class-update': {
      const items = state.items.slice();
      const item = items[action.index];
      items[action.index] = cloneInstance(item, {
        value: item.value + 1,
        nested: { ...item.nested, value: item.nested.value + 1 },
      });
      return { ...state, items };
    }
    case 'bench/class-wide-update':
      return {
        ...state,
        settings: cloneInstance(state.settings, {
          [action.field]: state.settings[action.field] + 1,
        }),
      };
    case 'bench/deep-update':
      return updateIn(state, action.path, 0);
    case 'bench/push-and-insert':
      return {
        ...state,
        largeArray: [...state.largeArray, action.payload],
        largeObject1: {
          ...state.largeObject1,
          [action.key]: { id: action.index },
        },
      };
    case 'bench/apply':
      return action.patches.reduce(
        (result, patch) => applyPatchImmutably(result, patch, 0),
        state
      );
    case 'bench/return-replace':
    case 'bench/return-replace-raw':
      return { ...state, rows: action.payload };
    case 'bench/return-filter':
      return state.filter((item) => item.value % 2 === 0);
    case 'bench/search': {
      const rows = state.rows.slice(action.shift ? 1 : 0);
      if (!action.shift) rows[0] = incrementNested(rows[0]);
      const index = rows.findIndex((item) => item.id === action.id);
      if (index !== -1) rows[index] = incrementNested(rows[index]);
      return { ...state, rows };
    }
    case 'bench/shift-and-update': {
      const rows = state.rows.slice(1);
      rows[action.index] = incrementNested(rows[action.index]);
      return { ...state, rows };
    }
    default:
      return state;
  }
}
