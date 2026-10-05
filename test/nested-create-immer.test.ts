/* eslint-disable @typescript-eslint/no-explicit-any */
import { Immer, enableMapSet } from 'immer';
import { create } from '../src';

enableMapSet();

// Random recipes that call create() on drafts of an outer recipe, as helpers
// do, and then change the values that the inner call left unchanged. A
// Park-Miller generator checks the same recipes on every run.
function random(seed: number) {
  return () => (seed = (seed * 16807) % 2147483647) / 2147483647;
}

const createBase = () => ({
  nodes: [0, 1, 2, 3].map((id) => ({
    id,
    name: `n${id}`,
    meta: { value: 0 },
    tags: [{ tag: id }],
  })),
  map: new Map([
    ['a', { value: 0, deep: { value: 0 } }],
    ['b', { value: 1, deep: { value: 1 } }],
    ['c', { value: 2, deep: { value: 2 } }],
  ]),
  set: new Set([
    { id: 0, deep: { value: 0 } },
    { id: 1, deep: { value: 1 } },
  ]),
  object: { child: { value: 0, deep: { value: 0 } }, other: { value: 0 } },
});

type Recipe = (draft: any, value: number) => void;

// The recipes of the inner create() call, by the kind of draft it receives.
const recipes: Record<string, Recipe[]> = {
  node: [
    (node, value) => {
      node.name += value;
    },
    (node, value) => {
      node.meta.value += value;
    },
    (node, value) => {
      node.tags.push({ tag: value });
    },
    (node) => {
      node.meta = { value: -1 };
    },
    (node) => {
      if (node.tags.length) node.tags[0].tag += 1;
    },
  ],
  nodes: [
    (nodes, value) => {
      nodes.push({ id: 10 + value, name: 'new', meta: { value }, tags: [] });
    },
    (nodes) => {
      nodes.pop();
    },
    (nodes) => {
      nodes.splice(0, 1);
    },
    (nodes) => {
      nodes.reverse();
    },
    (nodes) => {
      nodes.sort((a: any, b: any) => b.id - a.id);
    },
    (nodes, value) => {
      if (nodes.length) nodes[value % nodes.length].meta.value += 1;
    },
    (nodes, value) => {
      const node = nodes.find((item: any) => item.id === value % 4);
      if (node) node.name += '!';
    },
    (nodes) => {
      nodes
        .filter((item: any) => item.id % 2)
        .forEach((item: any) => {
          item.meta.value += 2;
        });
    },
    (nodes) => {
      const node = nodes.shift();
      if (node) nodes.push(node);
    },
  ],
  map: [
    (map, value) => {
      map.set(`k${value}`, { value, deep: { value } });
    },
    (map) => {
      map.delete('b');
    },
    (map) => {
      const item = map.get('a');
      if (item) item.deep.value += 1;
    },
    (map) => {
      for (const [, item] of map) item.value += 1;
    },
  ],
  set: [
    (set, value) => {
      set.add({ id: 10 + value, deep: { value } });
    },
    (set) => {
      for (const item of set) item.deep.value += 1;
    },
    (set) => {
      const [first] = set;
      if (first) set.delete(first);
    },
  ],
  object: [
    (object, value) => {
      object.child.value += value;
    },
    (object) => {
      delete object.other;
    },
    (object, value) => {
      object.extra = { value };
    },
    (object) => {
      object.child.deep.value += 1;
    },
    (object) => {
      object.child = { value: 9, deep: { value: 9 } };
    },
  ],
};

// Writes to the result of the inner call through values it left unchanged.
const writes: Record<string, (result: any) => void> = {
  node: (node) => {
    if (node.meta) node.meta.value = 77;
  },
  nodes: (nodes) => {
    if (nodes.length) nodes[nodes.length - 1].meta.value = 77;
  },
  map: (map) => {
    const item = map.get('c');
    if (item) item.deep.value = 77;
  },
  set: (set) => {
    const items = [...set];
    if (items.length) items[items.length - 1].deep.value = 77;
  },
  object: (object) => {
    if (object.other) object.other.value = 77;
  },
};

const targets: [
  string,
  (draft: any, value: number) => any,
  (draft: any, value: number, result: any) => void,
][] = [
  [
    'node',
    (draft, value) => draft.nodes[value % draft.nodes.length],
    (draft, value, result) => {
      draft.nodes[value % draft.nodes.length] = result;
    },
  ],
  [
    'nodes',
    (draft) => draft.nodes,
    (draft, _, result) => {
      draft.nodes = result;
    },
  ],
  [
    'map',
    (draft) => draft.map,
    (draft, _, result) => {
      draft.map = result;
    },
  ],
  [
    'set',
    (draft) => draft.set,
    (draft, _, result) => {
      draft.set = result;
    },
  ],
  [
    'object',
    (draft) => draft.object,
    (draft, _, result) => {
      draft.object = result;
    },
  ],
];

type Step =
  | { edit: number; value: number }
  | {
      target: number;
      operations: [number, number][];
      value: number;
      // 0: assign the result back, 1: assign it elsewhere, 2: discard it.
      mode: number;
      write: boolean;
    };

function generate(next: () => number): Step[] {
  const integer = (limit: number) => Math.floor(next() * limit);
  const steps: Step[] = [];
  for (let count = 1 + integer(4); count > 0; count -= 1) {
    if (next() < 0.3) {
      steps.push({ edit: integer(3), value: integer(5) });
    } else {
      const target = integer(targets.length);
      const operations: [number, number][] = [];
      for (let count = 1 + integer(3); count > 0; count -= 1) {
        operations.push([
          integer(recipes[targets[target][0]].length),
          integer(5),
        ]);
      }
      steps.push({
        target,
        operations,
        value: integer(5),
        mode: integer(3),
        write: next() < 0.6,
      });
    }
  }
  return steps;
}

function run(
  produce: (base: any, recipe: (draft: any) => void) => any,
  steps: Step[],
  base: any
) {
  return produce(base, (draft) => {
    for (const step of steps) {
      if ('edit' in step) {
        if (step.edit === 0) draft.object.child.value += 1;
        else if (step.edit === 1) {
          draft.nodes[step.value % draft.nodes.length].meta.value += 1;
        } else draft.object.child.deep.value += 1;
      } else {
        const [name, get, put] = targets[step.target];
        const result = produce(get(draft, step.value), (inner) => {
          for (const [operation, value] of step.operations) {
            recipes[name][operation](inner, value);
          }
        });
        if (step.write) writes[name](result);
        if (step.mode === 0) put(draft, step.value, result);
        else if (step.mode === 1) draft.copy = result;
      }
    }
  });
}

// Reading the whole state also fails on a draft revoked in it.
function serialize(value: any): string {
  return JSON.stringify(value, (_, item) =>
    item instanceof Map
      ? { map: [...item] }
      : item instanceof Set
        ? { set: [...item] }
        : item
  );
}

test.each([false, true])(
  'random create() calls on drafts match Immer (auto-freeze: %s)',
  (enableAutoFreeze) => {
    const immer = new Immer({ autoFreeze: enableAutoFreeze });
    const next = random(160);
    const failures: string[] = [];
    for (let index = 0; index < 1000; index += 1) {
      const steps = generate(next);
      const base = createBase();
      const before = serialize(base);
      let state: string | undefined;
      try {
        state = serialize(
          run(
            (base, recipe) => create(base, recipe, { enableAutoFreeze }),
            steps,
            base
          )
        );
      } catch (error) {
        failures.push(`${JSON.stringify(steps)} threw ${error}`);
      }
      if (serialize(base) !== before) {
        failures.push(`${JSON.stringify(steps)} changed the base state`);
      }
      // Immer's nested Set drafts can throw, change their base state or
      // duplicate items, so only recipes without them are compared.
      if (
        state !== undefined &&
        !steps.some((step) => 'target' in step && step.target === 3) &&
        serialize(run(immer.produce, steps, createBase())) !== state
      ) {
        failures.push(`${JSON.stringify(steps)} differs from Immer`);
      }
    }
    expect(failures).toEqual([]);
  }
);
