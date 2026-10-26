import { DraftType, Operation, Patches, ProxyDraft } from './interface';
import {
  checkPathKey,
  escapePath,
  get,
  getProxyDraft,
  getType,
  has,
  isEqual,
} from './utils';
import { current } from './current';

/**
 * Patch values must not contain drafts. A draft that is still present when its
 * container generates patches is represented by its original object when it
 * was not modified, or by a snapshot of its current state otherwise.
 */
function cloneIfNeeded<T>(target: T): T {
  const proxyDraft = getProxyDraft(target);
  if (!proxyDraft) return target;
  return proxyDraft.operated ? current(target as any) : proxyDraft.original;
}

const hasOwn = Object.prototype.hasOwnProperty;

// In Node.js 24, checking an index takes about 7 ns, or 30 ns in a
// dictionary-mode array, and enumerating an own key about 150 ns. A suffix is
// checked index by index until this many holes have passed, and the rest of a
// long gap is crossed by enumerating own keys.
const SPARSE_HOLE_LIMIT = 65536;

// Patches that restore the own indices of `to` from `start` on, including
// non-enumerable ones. `indices`, if given, holds all of them, among others,
// in ascending order.
function restoreSuffix(
  to: any[],
  start: number,
  indices: number[] | null,
  basePath: any[],
  result: Patches,
  pathAsArray: boolean
) {
  const restore = (index: number) =>
    result.push({
      op: Operation.Replace,
      path: escapePath(basePath.concat([index]), pathAsArray),
      value: cloneIfNeeded(to[index]),
    });
  if (indices !== null) {
    for (let position = 0; position < indices.length; position += 1) {
      const index = indices[position];
      if (index >= start && index < to.length && hasOwn.call(to, index)) {
        restore(index);
      }
    }
    return;
  }
  let index = start;
  let holes = 0;
  while (index < to.length && holes <= SPARSE_HOLE_LIMIT) {
    if (hasOwn.call(to, index)) restore(index);
    else holes += 1;
    index += 1;
  }
  if (index === to.length) return;
  // Array indices only, not length or custom properties such as '1.5'.
  for (const key of Object.getOwnPropertyNames(to)) {
    const own = Number(key);
    if (
      Number.isInteger(own) &&
      own >= index &&
      own < to.length &&
      String(own) === key
    ) {
      restore(own);
    }
  }
}

// Index patches carry values, so neither an undefined value nor an index
// removal can represent a hole. Rebuild the affected suffix in each direction:
// truncate it, grow the length to leave holes, then restore only own indices.
// Keeping the array itself supports mutable application and arrays inside Sets.
// `added`, when known, holds every own index that the copy has from `start` on.
function generateSparseArrayPatches(
  original: any[],
  copy: any[],
  start: number,
  added: number[] | null,
  basePath: any[],
  patches: Patches,
  inversePatches: Patches,
  pathAsArray: boolean,
  arrayLengthAssignment: boolean
) {
  const lengthPath = escapePath(basePath.concat(['length']), pathAsArray);
  const rebuild = (
    from: any[],
    to: any[],
    result: Patches,
    indices: number[] | null
  ) => {
    const cut = Math.min(start, to.length);
    if (arrayLengthAssignment) {
      if (from.length > cut) {
        result.push({ op: Operation.Replace, path: lengthPath, value: cut });
      }
    } else {
      for (let index = from.length - 1; index >= cut; index -= 1) {
        result.push({
          op: Operation.Remove,
          path: escapePath(basePath.concat([index]), pathAsArray),
        });
      }
    }
    if (to.length <= cut) return;
    // JSON cannot encode holes. Growing a sparse array needs a length patch
    // even when shrinking arrays use per-index removals.
    result.push({
      op: Operation.Replace,
      path: lengthPath,
      value: to.length,
    });
    restoreSuffix(to, cut, indices, basePath, result, pathAsArray);
  };
  rebuild(original, copy, patches, added);
  rebuild(copy, original, inversePatches, null);
}

function generateArrayPatches(
  proxyState: ProxyDraft<Array<any>>,
  basePath: any[],
  patches: Patches,
  inversePatches: Patches,
  pathAsArray: boolean
) {
  let { original, assignedMap, options } = proxyState;
  let copy = proxyState.copy!;
  const { arrayLengthAssignment = true } = options.enablePatches;
  const shorter = copy.length < original.length;
  if (shorter) {
    [original, copy] = [copy, original];
    [patches, inversePatches] = [inversePatches, patches];
  }
  // Only assigned indices and the range touched by native array operations
  // can differ, so visit those in ascending order instead of scanning every
  // element of a possibly very large array.
  const arrayState = proxyState.arrayState;
  const diffStart = arrayState === null ? 0 : arrayState.diffStart;
  const diffEnd = arrayState === null ? 0 : arrayState.diffEnd;
  const assigned: number[] = [];
  assignedMap!.forEach((flag, key) => {
    if (flag && key !== 'length') {
      const index = Number(key);
      if (index < diffStart || index >= diffEnd) assigned.push(index);
    }
  });
  assigned.sort((a, b) => a - b);
  // Assigned indices below the range, the range itself, then the rest.
  const indices: number[] = [];
  let position = 0;
  for (
    ;
    position < assigned.length && assigned[position] < diffStart;
    position += 1
  ) {
    indices.push(assigned[position]);
  }
  for (let index = diffStart; index < diffEnd; index += 1) indices.push(index);
  for (; position < assigned.length; position += 1)
    indices.push(assigned[position]);
  for (let position = 0; position < indices.length; position += 1) {
    const index = indices[position];
    if (index < original.length) {
      const value = copy[index];
      const previous = original[index];
      if (
        (value === undefined || previous === undefined) &&
        hasOwn.call(copy, index) !== hasOwn.call(original, index)
      ) {
        return generateSparseArrayPatches(
          original,
          copy,
          index,
          null,
          basePath,
          patches,
          inversePatches,
          pathAsArray,
          arrayLengthAssignment
        );
      }
      // As the set trap compares, so 0 and -0 differ and NaN equals itself.
      if (!isEqual(value, previous)) {
        const _path = basePath.concat([index]);
        const path = escapePath(_path, pathAsArray);
        patches.push({
          op: Operation.Replace,
          path,
          value: cloneIfNeeded(value),
        });
        inversePatches.push({
          op: Operation.Replace,
          path,
          value: cloneIfNeeded(previous),
        });
      }
    }
  }
  for (let index = original.length; index < copy.length; index += 1) {
    const value = copy[index];
    if (value === undefined && !hasOwn.call(copy, index)) {
      // Every index that the copy has past the end of the original was set
      // by the recipe, so `indices` holds it. A shorter copy was swapped,
      // which makes `copy` the original array.
      return generateSparseArrayPatches(
        original,
        copy,
        index,
        shorter ? null : indices,
        basePath,
        patches,
        inversePatches,
        pathAsArray,
        arrayLengthAssignment
      );
    }
    const _path = basePath.concat([index]);
    const path = escapePath(_path, pathAsArray);
    patches.push({
      op: Operation.Add,
      path,
      // If it is a draft, it needs to be deep cloned, and it may also be non-draft.
      value: cloneIfNeeded(value),
    });
  }
  if (original.length < copy.length) {
    // https://www.rfc-editor.org/rfc/rfc6902#appendix-A.4
    // For performance, here we only generate an operation that replaces the length of the array,
    // which is inconsistent with JSON Patch specification
    if (arrayLengthAssignment) {
      const _path = basePath.concat(['length']);
      const path = escapePath(_path, pathAsArray);
      inversePatches.push({
        op: Operation.Replace,
        path,
        value: original.length,
      });
    } else {
      for (let index = copy.length; original.length < index; index -= 1) {
        const _path = basePath.concat([index - 1]);
        const path = escapePath(_path, pathAsArray);
        inversePatches.push({
          op: Operation.Remove,
          path,
        });
      }
    }
  }
}

function generatePatchesFromAssigned(
  { original, copy, assignedMap }: ProxyDraft<Record<string, any>>,
  basePath: any[],
  patches: Patches,
  inversePatches: Patches,
  pathAsArray: boolean
) {
  assignedMap!.forEach((assignedValue, key) => {
    const originalValue = get(original, key);
    const value = cloneIfNeeded(get(copy, key));
    const op = !assignedValue
      ? Operation.Remove
      : has(original, key)
        ? Operation.Replace
        : Operation.Add;
    if (isEqual(originalValue, value) && op === Operation.Replace) return;
    if (__DEV__) checkPathKey(getType(original), key, pathAsArray);
    // A Map key can be an array, which stays one path segment.
    const _path = basePath.concat([key]);
    const path = escapePath(_path, pathAsArray);
    patches.push(op === Operation.Remove ? { op, path } : { op, path, value });
    inversePatches.push(
      op === Operation.Add
        ? { op: Operation.Remove, path }
        : op === Operation.Remove
          ? { op: Operation.Add, path, value: originalValue }
          : { op: Operation.Replace, path, value: originalValue }
    );
  });
}

function generateSetPatches(
  { original, copy }: ProxyDraft<Set<any>>,
  basePath: any[],
  patches: Patches,
  inversePatches: Patches,
  pathAsArray: boolean
) {
  let index = 0;
  original.forEach((value: any) => {
    if (!copy!.has(value)) {
      const _path = basePath.concat([index]);
      const path = escapePath(_path, pathAsArray);
      patches.push({
        op: Operation.Remove,
        path,
        value,
      });
      inversePatches.unshift({
        op: Operation.Add,
        path,
        value,
      });
    }
    index += 1;
  });
  index = 0;
  copy!.forEach((value: any) => {
    if (!original.has(value)) {
      const _path = basePath.concat([index]);
      const path = escapePath(_path, pathAsArray);
      patches.push({
        op: Operation.Add,
        path,
        value,
      });
      inversePatches.unshift({
        op: Operation.Remove,
        path,
        value,
      });
    }
    index += 1;
  });
}

export function generatePatches(
  proxyState: ProxyDraft,
  basePath: any[],
  patches: Patches,
  inversePatches: Patches
) {
  const { pathAsArray = true } = proxyState.options.enablePatches;
  switch (proxyState.type) {
    case DraftType.Object:
    case DraftType.Map:
      return generatePatchesFromAssigned(
        proxyState,
        basePath,
        patches,
        inversePatches,
        pathAsArray
      );
    case DraftType.Array:
      return generateArrayPatches(
        proxyState,
        basePath,
        patches,
        inversePatches,
        pathAsArray
      );
    case DraftType.Set:
      return generateSetPatches(
        proxyState,
        basePath,
        patches,
        inversePatches,
        pathAsArray
      );
  }
}
