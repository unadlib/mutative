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

// Identity matching alone is not enough: an operated draft can stand for the
// same base element while its final value differs. Only unchanged drafts match.
function sameElement(value: any, original: any) {
  if (isEqual(value, original)) return true;
  const draft = getProxyDraft(value);
  return !!draft && !draft.operated && isEqual(draft.original, original);
}

// Compact array patches keep the common prefix and suffix of one contiguous
// insertion or deletion, and carry only elements, like the default generator.
// Anything with independent nested edits, holes, reordering or an ambiguous
// shape uses the default generator. The final elements decide, so the patches
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
  // Patches that a child already emitted under this path decide the fallback
  // before any element is compared.
  if (oldLength === newLength || proxyState.patched) return false;
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

  let prefix = 0;
  while (prefix < shortest && sameElement(copy[prefix], original[prefix]))
    prefix += 1;
  let suffix = 0;
  while (
    suffix < shortest - prefix &&
    sameElement(copy[newLength - 1 - suffix], original[oldLength - 1 - suffix])
  )
    suffix += 1;

  // A full shorter side proves one contiguous insertion or deletion. Tail
  // changes already use the default generator's efficient append/truncate form.
  if (prefix + suffix !== shortest || prefix === shortest) return false;
  // A hole compares like an undefined element, which the patches would make
  // explicit. Only an array that has the compact shape is searched for holes.
  if (hasHoles(original) || hasHoles(copy)) return false;

  const removed = oldLength - prefix - suffix;
  const added = newLength - prefix - suffix;
  // Inserting a draft from another location introduces alias and finalization
  // dependencies. Leave those to the default value-based patches in this phase.
  for (let index = prefix; index < prefix + added; index += 1) {
    if (getProxyDraft(copy[index])) return false;
  }

  for (let index = prefix + removed - 1; index >= prefix; index -= 1) {
    patches.push(removePatch(basePath.concat([index]), pathAsArray));
  }
  for (let index = prefix; index < prefix + added; index += 1) {
    patches.push({
      op: Operation.Add,
      path: escapePath(basePath.concat([index]), pathAsArray),
      value: cloneIfNeeded(copy[index]),
    });
  }
  for (let index = prefix + added - 1; index >= prefix; index -= 1) {
    inversePatches.push(removePatch(basePath.concat([index]), pathAsArray));
  }
  for (let index = prefix; index < prefix + removed; index += 1) {
    inversePatches.push({
      op: Operation.Add,
      path: escapePath(basePath.concat([index]), pathAsArray),
      value: cloneIfNeeded(original[index]),
    });
  }
  return true;
}

function removePatch(path: any, pathAsArray: boolean): any {
  return {
    op: Operation.Remove,
    path: escapePath(path, pathAsArray),
  };
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
  if (copy.length < original.length) {
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
    // As the set trap compares, so 0 and -0 differ and NaN equals itself.
    if (index < original.length && !isEqual(copy[index], original[index])) {
      const _path = basePath.concat([index]);
      const path = escapePath(_path, pathAsArray);
      patches.push({
        op: Operation.Replace,
        path,
        value: cloneIfNeeded(copy[index]),
      });
      inversePatches.push({
        op: Operation.Replace,
        path,
        value: cloneIfNeeded(original[index]),
      });
    }
  }
  for (let index = original.length; index < copy.length; index += 1) {
    const _path = basePath.concat([index]);
    const path = escapePath(_path, pathAsArray);
    patches.push({
      op: Operation.Add,
      path,
      // If it is a draft, it needs to be deep cloned, and it may also be non-draft.
      value: cloneIfNeeded(copy[index]),
    });
  }
  if (original.length < copy.length) {
    // https://www.rfc-editor.org/rfc/rfc6902#appendix-A.4
    // For performance, here we only generate an operation that replaces the length of the array,
    // which is inconsistent with JSON Patch specification
    const { arrayLengthAssignment = true } = options.enablePatches;
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
