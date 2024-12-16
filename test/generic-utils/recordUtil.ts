import { assertAlways } from './assertAlways';

import { MutativeMap } from '../..';

/**
 *
 * @param value
 * @param filter returns false to stop iteration within the current object
 */
export function deepIterateObjectNodes(
  value: unknown,
  filter?: (path: (string | number)[], value: unknown) => boolean
): Generator<[path: (string | number)[], value: unknown], void> {
  return deepIterateObjectNodes2(value, [], filter);
}

function* deepIterateObjectNodes2(
  value: unknown,
  path: (string | number)[],
  filter?: (path: (string | number)[], value: unknown) => boolean
): Generator<[path: (string | number)[], value: unknown], void> {
  yield [path, value];
  if (value == null) {
    return;
  }
  const shouldContinue = filter?.(path, value);
  if (shouldContinue === false) {
    return;
  }
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      yield* deepIterateObjectNodes2(value[i], [...path, i], filter);
    }
  } else if (value instanceof Map || value instanceof MutativeMap) {
    for (const [key, subValue] of value.entries()) {
      yield* deepIterateObjectNodes2(subValue, [...path, key], filter);
    }
  } else if (value instanceof Set) {
    // hack to iterate over set values
    let i = 0;
    for (const subValue of value.values()) {
      yield* deepIterateObjectNodes2(subValue, [...path, i], filter);
      i++;
    }
  } else if (typeof value === 'object') {
    for (const [key, subValue] of Object.entries(value)) {
      yield* deepIterateObjectNodes2(subValue, [...path, key], filter);
    }
  }
}

/**
 * similar to radash crush, but has arrays as paths and supports Maps and Sets
 * TODO support symbols and other values in paths + fix typing for map keys that are not strings
 * @param data
 */
export function getAllChildIntermediateAndLeafNodePaths(
  data: unknown
): (string | number)[][] {
  if (typeof data !== 'object' || data === null) {
    return [];
  }
  if (data instanceof Map || data instanceof MutativeMap) {
    const keys = [...data.keys()];
    return keys.flatMap((key) => {
      return [
        [key],
        ...getAllChildIntermediateAndLeafNodePaths(data.get(key)).map(
          (path) => {
            return [key, ...path];
          }
        ),
      ];
    });
  }
  if (data instanceof Set) {
    return getAllChildIntermediateAndLeafNodePaths([...data.values()]);
  }
  if (Array.isArray(data)) {
    return data.flatMap((v, index) => {
      return [
        [index],
        ...getAllChildIntermediateAndLeafNodePaths(v).map((path) => [
          index,
          ...path,
        ]),
      ];
    });
  }
  const keys = Object.keys(data);
  return keys.flatMap((key) => {
    return [
      [key],
      ...getAllChildIntermediateAndLeafNodePaths((data as any)[key]).map(
        (path) => {
          return [key, ...path];
        }
      ),
    ];
  });
}

export function getDeepValueByPath(
  data: unknown,
  path: (string | number)[]
): unknown {
  let current = data;
  for (const key of path) {
    if (typeof current !== 'object' || current === null) {
      throw new Error(`cannot get value by path '${path.join('.')}'`);
    }
    if (current instanceof Map || current instanceof MutativeMap) {
      current = (current as Map<any, any> | MutativeMap<any, any>).get(key);
    } else if (current instanceof Set) {
      assertAlways(
        typeof key === 'number',
        () => 'key must be a index (number) for Set values but was ' + key
      );
      current = [...current.values()][key as number];
    } else {
      current = (current as any)[key];
    }
  }
  return current;
}

export function tryGetDeepValueByPath(
  data: unknown,
  path: (string | number)[]
): undefined | { value: unknown } {
  let current = data;
  for (const key of path) {
    if (typeof current !== 'object' || current === null) {
      return undefined;
    }
    if (current instanceof Map || current instanceof MutativeMap) {
      current = (current as Map<any, any> | MutativeMap<any, any>).get(key);
    } else if (current instanceof Set) {
      if (typeof key !== 'number') {
        return undefined;
      }
      current = [...current.values()][key];
    } else {
      current = (current as any)[key];
    }
  }
  return { value: current };
}

export function setDeepValueByPath(
  data: unknown,
  path: (string | number)[],
  value: unknown
): void {
  const parent = getDeepValueByPath(data, path.slice(0, -1));
  const key = path[path.length - 1];
  if (parent instanceof Map || parent instanceof MutativeMap) {
    (parent as Map<any, any> | MutativeMap<any, any>).set(key, value);
  } else if (parent instanceof Set) {
    // TODO [unimportant] does this make any sense?
    parent.add(value);
  } else if (Array.isArray(parent)) {
    assertAlways(
      typeof key === 'number',
      () => 'key must be a index (number) for array values but was ' + key
    );
    if (parent.length === key) {
      parent.push(value);
    } else if (parent.length < key) {
      throw new Error(
        `cannot set value by path '${path.join('.')}' in array with length ${
          parent.length
        }`
      );
    } else {
      parent[key] = value;
    }
  } else {
    (parent as any)[key] = value;
  }
}

export function deleteDeepValueByPath(
  data: unknown,
  path: (string | number)[]
): void {
  const parent = getDeepValueByPath(data, path.slice(0, -1));
  const key = path[path.length - 1];
  if (parent instanceof Map || parent instanceof MutativeMap) {
    (parent as Map<any, any> | MutativeMap<any, any>).delete(key);
  } else if (parent instanceof Set) {
    assertAlways(
      typeof key === 'number',
      () => 'key must be a index (number) for Set values but was ' + key
    );
    parent.delete([...parent.values()][key]);
  } else if (Array.isArray(parent)) {
    assertAlways(
      typeof key === 'number',
      () => 'key must be a index (number) for array values but was ' + key
    );
    parent.splice(key, 1);
  } else {
    delete (parent as any)[key];
  }
}
