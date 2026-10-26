import { DraftType, Operation, Patches, ProxyDraft } from './interface';
import {
  checkPathKey,
  escapePath,
  get,
  getProxyDraft,
  getType,
  getWrittenDrafts,
  has,
  isEqual,
} from './utils';
import { current } from './current';
import { hasHoles } from './array';

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
// removal can represent a hole. Patches that turn an own index of `from` into
// a hole of `to` rebuild the suffix from there: they truncate it, grow the
// length to leave holes, then restore only own indices. Filling a hole takes
// an index patch, so only that direction rebuilds. Keeping the array itself
// supports mutable application and arrays inside Sets. `indices`, when known,
// holds every own index that `to` has from `start` on.
function rebuildSuffix(
  from: any[],
  to: any[],
  start: number,
  indices: number[] | null,
  basePath: any[],
  result: Patches,
  pathAsArray: boolean,
  arrayLengthAssignment: boolean
) {
  const lengthPath = escapePath(basePath.concat(['length']), pathAsArray);
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
}

// Whether `value`, at `index` of an array, is `base` or an unchanged draft of
// it (1), a changed draft of it (2), or another value (0). A draft that the
// array still holds because the recipe read it first, and one that
// finalization wrote into the index, stand for their originals. A draft of
// another producer counts as changed: that producer may still change it, and
// then writes its final value into the index.
function retained(
  value: any,
  base: any,
  drafts: Map<number, ProxyDraft> | undefined,
  index: number,
  target: ProxyDraft
) {
  if (isEqual(value, base)) return 1;
  const draft = getProxyDraft(value) ?? drafts?.get(index);
  if (!draft || !isEqual(draft.original, base)) return 0;
  return draft.operated || draft.finalities !== target.finalities ? 2 : 1;
}

// A child emits patches under its array only at its own index.
function ownPatches(
  draft: ProxyDraft | undefined,
  parent: ProxyDraft,
  index: number
) {
  return (
    draft !== undefined &&
    draft.patched &&
    draft.parent === parent &&
    draft.key === index
  );
}

// Compact array patches keep the common prefix and suffix of one contiguous
// insertion or deletion, and carry only elements, like the default generator.
// A retained element may also have changed in place: where it keeps its index,
// the patches of its own draft carry the change, and a replace patch at its
// final index does where the insertion or deletion moved it. Anything else,
// such as a new value at a retained index, holes, reordering or an ambiguous
// shape, uses the default generator. The final elements decide, so the patches
// do not depend on how the recipe changed the array: through native methods,
// the proxy path of strict mode or a mark, index assignments or `length`.
function tryGenerateCompactArrayPatches(
  proxyState: ProxyDraft<Array<any>>,
  basePath: any[],
  patches: Patches,
  inversePatches: Patches,
  pathAsArray: boolean
) {
  const { enablePatches } = proxyState.options;
  if (
    typeof enablePatches !== 'object' ||
    enablePatches.arrayPatchStrategy !== 'compact'
  )
    return false;
  const original = proxyState.original;
  const copy = proxyState.copy!;
  const oldLength = original.length;
  const newLength = copy.length;
  const shortest = Math.min(oldLength, newLength);
  if (oldLength === newLength) return false;
  // Elements change places only at indices that native methods moved or the
  // recipe assigned. When none lies below the shorter length, the change is
  // an append or a truncation, which the default generator patches as such.
  const arrayState = proxyState.arrayState;
  let first =
    arrayState !== null && arrayState.relocated
      ? arrayState.diffStart
      : shortest;
  proxyState.assignedMap!.forEach((_flag, key) => {
    if (key !== 'length') first = Math.min(first, Number(key));
  });
  if (first >= shortest) return false;

  // Identity alone is not enough: a draft of a base element may have
  // changed, and the indices of such elements are collected.
  const drafts = getWrittenDrafts(proxyState);
  let changed: number[] | undefined;
  let prefix = 0;
  let state;
  while (
    prefix < shortest &&
    (state = retained(
      copy[prefix],
      original[prefix],
      drafts,
      prefix,
      proxyState
    ))
  ) {
    if (state === 2) (changed ??= []).push(prefix);
    prefix += 1;
  }
  let suffix = 0;
  let index = newLength - 1;
  while (
    suffix < shortest - prefix &&
    (state = retained(
      copy[index],
      original[oldLength - 1 - suffix],
      drafts,
      index,
      proxyState
    ))
  ) {
    if (state === 2) (changed ??= []).push(index);
    suffix += 1;
    index -= 1;
  }

  // A full shorter side proves one contiguous insertion or deletion. Tail
  // changes already use the default generator's efficient append/truncate form.
  if (prefix + suffix !== shortest || prefix === shortest) return false;
  // Before the insertion or deletion, an element keeps its index, and the
  // patches of its own child carry its change; anywhere else, they would
  // change another element.
  if (proxyState.patched) {
    let moved = drafts === undefined;
    drafts?.forEach((draft, index) => {
      if (index >= prefix && ownPatches(draft, proxyState, index)) moved = true;
    });
    if (moved) return false;
  }
  // A hole compares like an undefined element, which the patches would make
  // explicit. Only an array that has the compact shape is searched for holes.
  if (hasHoles(original) || hasHoles(copy)) return false;

  const removed = oldLength - prefix - suffix;
  const added = newLength - prefix - suffix;
  for (index = prefix + removed - 1; index >= prefix; index -= 1) {
    patches.push({
      op: Operation.Remove,
      path: escapePath(basePath.concat([index]), pathAsArray),
    });
  }
  // An inserted draft that is finalized after this array, because the recipe
  // read it first or another producer owns it, is still a draft here. It is
  // represented as in the default generator's patches.
  for (index = prefix; index < prefix + added; index += 1) {
    patches.push({
      op: Operation.Add,
      path: escapePath(basePath.concat([index]), pathAsArray),
      value: cloneIfNeeded(copy[index]),
    });
  }
  // A changed element that its own patches do not carry is replaced at its
  // final index once the insertion or deletion is done, and restored before
  // it is undone.
  changed?.forEach((index) => {
    if (!ownPatches(drafts?.get(index), proxyState, index)) {
      const path = escapePath(basePath.concat([index]), pathAsArray);
      patches.push({
        op: Operation.Replace,
        path,
        value: cloneIfNeeded(copy[index]),
      });
      inversePatches.push({
        op: Operation.Replace,
        path,
        value: cloneIfNeeded(
          original[index < prefix ? index : index - added + removed]
        ),
      });
    }
  });
  for (index = prefix + added - 1; index >= prefix; index -= 1) {
    inversePatches.push({
      op: Operation.Remove,
      path: escapePath(basePath.concat([index]), pathAsArray),
    });
  }
  for (index = prefix; index < prefix + removed; index += 1) {
    inversePatches.push({
      op: Operation.Add,
      path: escapePath(basePath.concat([index]), pathAsArray),
      value: cloneIfNeeded(original[index]),
    });
  }
  return true;
}

function generateArrayPatches(
  proxyState: ProxyDraft<Array<any>>,
  basePath: any[],
  patches: Patches,
  inversePatches: Patches,
  pathAsArray: boolean
) {
  if (
    tryGenerateCompactArrayPatches(
      proxyState,
      basePath,
      patches,
      inversePatches,
      pathAsArray
    )
  )
    return;
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
  // The first index at which each direction turns an own index into a hole.
  let forward = -1;
  let inverse = -1;
  for (let position = 0; position < indices.length; position += 1) {
    const index = indices[position];
    if (index >= original.length) break;
    const value = copy[index];
    const previous = original[index];
    // A hole reads as `undefined`.
    let inCopy = true;
    let inOriginal = true;
    if (value === undefined || previous === undefined) {
      inCopy = hasOwn.call(copy, index);
      inOriginal = hasOwn.call(original, index);
    }
    // As the set trap compares, so 0 and -0 differ and NaN equals itself.
    if (inCopy !== inOriginal || !isEqual(value, previous)) {
      const _path = basePath.concat([index]);
      const path = escapePath(_path, pathAsArray);
      if (forward === -1) {
        if (inCopy) {
          patches.push({
            op: Operation.Replace,
            path,
            value: cloneIfNeeded(value),
          });
        } else {
          forward = index;
        }
      }
      if (inverse === -1) {
        if (inOriginal) {
          inversePatches.push({
            op: Operation.Replace,
            path,
            value: cloneIfNeeded(previous),
          });
        } else {
          inverse = index;
        }
      }
      if (forward !== -1 && inverse !== -1) break;
    }
  }
  if (forward === -1) {
    for (let index = original.length; index < copy.length; index += 1) {
      const value = copy[index];
      if (value === undefined && !hasOwn.call(copy, index)) {
        forward = index;
        break;
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
  }
  if (forward !== -1) {
    // Every index that the copy has past the end of the original was set by
    // the recipe, so `indices` holds it. A shorter copy was swapped, which
    // makes `copy` the original array.
    rebuildSuffix(
      original,
      copy,
      forward,
      shorter || forward < original.length ? null : indices,
      basePath,
      patches,
      pathAsArray,
      arrayLengthAssignment
    );
  }
  if (inverse !== -1) {
    rebuildSuffix(
      copy,
      original,
      inverse,
      null,
      basePath,
      inversePatches,
      pathAsArray,
      arrayLengthAssignment
    );
  } else if (original.length < copy.length) {
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
