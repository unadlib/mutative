export interface ArrayItem {
  id: string;
  value: number;
  nested: { count: number };
}

export interface ArrayState {
  items: ArrayItem[];
  source?: { count: number };
}

export type ArrayMethodFailure =
  | 'patch-order'
  | 'raw-return'
  | 'stale-assignment'
  | 'unfinalized-value';

export interface ArrayMethodCase {
  name: string;
  failure?: ArrayMethodFailure;
  recipe: (draft: ArrayState) => void;
}

export const makeArrayState = (): ArrayState => ({
  items: Array.from({ length: 3 }, (_, value) => ({
    id: String.fromCharCode(97 + value),
    value,
    nested: { count: value },
  })),
  source: { count: 42 },
});

const newItem = (): ArrayItem => ({
  id: 'x',
  value: 9,
  nested: { count: 9 },
});

// The exhaustive test composes each of these 17 operations three times.
export const arrayMethodOperations: ArrayMethodCase[] = [
  {
    name: 'push',
    recipe: (draft) => {
      draft.items.push(newItem());
    },
  },
  {
    name: 'unshift',
    recipe: (draft) => {
      draft.items.unshift(newItem());
    },
  },
  {
    name: 'insert first',
    recipe: (draft) => {
      draft.items.splice(0, 0, newItem());
    },
  },
  {
    name: 'insert middle',
    recipe: (draft) => {
      draft.items.splice(1, 0, newItem());
    },
  },
  {
    name: 'insert negative',
    recipe: (draft) => {
      draft.items.splice(-1, 0, newItem());
    },
  },
  {
    name: 'pop',
    recipe: (draft) => {
      draft.items.pop();
    },
  },
  {
    name: 'shift',
    recipe: (draft) => {
      draft.items.shift();
    },
  },
  {
    name: 'delete first',
    recipe: (draft) => {
      draft.items.splice(0, 1);
    },
  },
  {
    name: 'reverse',
    recipe: (draft) => {
      draft.items.reverse();
    },
  },
  {
    name: 'sort asc',
    recipe: (draft) => {
      draft.items.sort((a, b) => a.id.localeCompare(b.id));
    },
  },
  {
    name: 'sort desc',
    recipe: (draft) => {
      draft.items.sort((a, b) => b.id.localeCompare(a.id));
    },
  },
  {
    name: 'edit first',
    recipe: (draft) => {
      if (draft.items.length) draft.items[0].value++;
    },
  },
  {
    name: 'edit last',
    recipe: (draft) => {
      if (draft.items.length) draft.items[draft.items.length - 1].value++;
    },
  },
  {
    name: 'edit nested',
    recipe: (draft) => {
      if (draft.items.length) draft.items[0].nested.count++;
    },
  },
  {
    name: 'read first',
    recipe: (draft) => {
      Reflect.get(draft.items, 0);
    },
  },
  {
    name: 'read all',
    recipe: (draft) => {
      Array.from(draft.items);
    },
  },
  {
    name: 'replace first',
    recipe: (draft) => {
      if (draft.items.length) draft.items[0] = newItem();
    },
  },
];

// Inputs and final outputs are trees. In particular, moving source deletes its
// old location, so these cases do not depend on shared references or cycles.
export const arrayMethodCases: ArrayMethodCase[] = [
  {
    name: 'unshift then edit shifted tail',
    failure: 'patch-order',
    recipe(draft) {
      draft.items.unshift(newItem());
      draft.items[draft.items.length - 1].value++;
    },
  },
  {
    name: 'splice at start then edit shifted tail',
    failure: 'patch-order',
    recipe(draft) {
      draft.items.splice(0, 0, newItem());
      draft.items[draft.items.length - 1].value++;
    },
  },
  {
    name: 'splice in middle then edit nested shifted tail',
    failure: 'patch-order',
    recipe(draft) {
      draft.items.splice(1, 0, newItem());
      draft.items[draft.items.length - 1].nested.count++;
    },
  },
  {
    name: 'two unshifts then edit shifted tail',
    failure: 'patch-order',
    recipe(draft) {
      draft.items.unshift(newItem());
      draft.items.unshift(newItem());
      draft.items[draft.items.length - 1].value++;
    },
  },
  {
    name: 'unshift and sort then edit shifted tail',
    failure: 'patch-order',
    recipe(draft) {
      draft.items.unshift(newItem());
      draft.items.sort((a, b) => b.id.localeCompare(a.id));
      draft.items[draft.items.length - 1].value++;
    },
  },
  {
    name: 'unshift and find then edit shifted tail',
    failure: 'patch-order',
    recipe(draft) {
      draft.items.unshift(newItem());
      draft.items.find((item) => item.id === 'c')!.value++;
    },
  },
  {
    name: 'shift then edit removed object and push it back',
    failure: 'raw-return',
    recipe(draft) {
      const removed = draft.items.shift()!;
      removed.value++;
      draft.items.push(removed);
    },
  },
  {
    name: 'pop then edit removed object and unshift it back',
    failure: 'raw-return',
    recipe(draft) {
      const removed = draft.items.pop()!;
      removed.value++;
      draft.items.unshift(removed);
    },
  },
  {
    name: 'splice then edit removed object and push it back',
    failure: 'raw-return',
    recipe(draft) {
      const [removed] = draft.items.splice(0, 1);
      removed.value++;
      draft.items.push(removed);
    },
  },
  {
    name: 'push and reverse then edit original first object',
    failure: 'stale-assignment',
    recipe(draft) {
      draft.items.push(newItem());
      draft.items.reverse();
      draft.items[draft.items.length - 1].value++;
    },
  },
  {
    name: 'unshift and reverse then edit original last object',
    failure: 'stale-assignment',
    recipe(draft) {
      draft.items.unshift(newItem());
      draft.items.reverse();
      draft.items[0].nested.count++;
    },
  },
  {
    name: 'push and sort descending then edit original first object',
    failure: 'stale-assignment',
    recipe(draft) {
      draft.items.push(newItem());
      draft.items.sort((a, b) => b.id.localeCompare(a.id));
      draft.items[draft.items.length - 1].value++;
    },
  },
  {
    name: 'control: sort restores original object indices before editing',
    recipe(draft) {
      draft.items.unshift(newItem());
      draft.items.sort((a, b) => a.id.localeCompare(b.id));
      draft.items[0].value++;
    },
  },
  {
    name: 'negative splice insertion then edit shifted tail',
    failure: 'stale-assignment',
    recipe(draft) {
      draft.items.splice(-1, 0, newItem());
      draft.items[draft.items.length - 1].value++;
    },
  },
  {
    name: 'move a draft into a wrapper with negative splice insertion',
    failure: 'unfinalized-value',
    recipe(draft) {
      const source = draft.source!;
      delete draft.source;
      draft.items.splice(-1, 0, { ...newItem(), nested: source });
    },
  },
  {
    name: 'move a draft into a wrapper with negative splice deletion',
    failure: 'unfinalized-value',
    recipe(draft) {
      const source = draft.source!;
      delete draft.source;
      draft.items.splice(-2, 2, { ...newItem(), nested: source });
    },
  },
  {
    name: 'push a wrapper containing a moved draft then reverse',
    failure: 'unfinalized-value',
    recipe(draft) {
      const source = draft.source!;
      delete draft.source;
      draft.items.push({ ...newItem(), nested: source });
      draft.items.reverse();
    },
  },
  {
    name: 'unshift a wrapper containing a moved draft then reverse',
    failure: 'unfinalized-value',
    recipe(draft) {
      const source = draft.source!;
      delete draft.source;
      draft.items.unshift({ ...newItem(), nested: source });
      draft.items.reverse();
    },
  },
  {
    name: 'splice a wrapper containing a moved draft then reverse',
    failure: 'unfinalized-value',
    recipe(draft) {
      const source = draft.source!;
      delete draft.source;
      draft.items.splice(1, 0, { ...newItem(), nested: source });
      draft.items.reverse();
    },
  },
  {
    name: 'control: reverse then edit a relocated object',
    recipe(draft) {
      draft.items.reverse();
      draft.items[0].value++;
    },
  },
  {
    name: 'control: unshift then edit inside the original index range',
    recipe(draft) {
      draft.items.unshift(newItem());
      draft.items[1].value++;
    },
  },
  {
    name: 'control: draft the removed object before shifting',
    recipe(draft) {
      const removed = draft.items[0];
      draft.items.shift();
      removed.value++;
      draft.items.push(removed);
    },
  },
  {
    name: 'control: move a draft into a wrapper with positive splice',
    recipe(draft) {
      const source = draft.source!;
      delete draft.source;
      draft.items.splice(1, 0, { ...newItem(), nested: source });
    },
  },
];
