import type { Patches, ProxyDraft } from './interface';
import { DraftType, Operation } from './constant';
import { cloneIfNeeded, get, getPath, getValue, has, isEqual } from './utils';

export function finalizePatches(
  target: ProxyDraft,
  patches?: Patches,
  inversePatches?: Patches
) {
  if (target.type === DraftType.Set && target.copy) {
    target.copy.clear();
    target.setMap?.forEach((value) => {
      target.copy?.add(getValue(value));
    });
  }
  const shouldFinalize =
    target.operated && target.assignedMap.size > 0 && !target.finalized;
  if (shouldFinalize) {
    const basePath = getPath(target);
    if (patches && inversePatches) {
      generatePatches(target, basePath, patches, inversePatches);
    }
    target.finalized = true;
  }
}

function generateArrayPatches(
  proxyState: ProxyDraft<Array<any>>,
  basePath: any[],
  patches: Patches,
  inversePatches: Patches
) {
  let { original, assignedMap } = proxyState;
  let copy = proxyState.copy!;
  // TODO: refactor algorithm
  if (copy.length < original.length) {
    [original, copy] = [copy, original];
    [patches, inversePatches] = [inversePatches, patches];
  }
  for (let index = 0; index < original.length; index++) {
    if (assignedMap.get(index.toString()) && copy[index] !== original[index]) {
      const path = basePath.concat([index]);
      patches.push({
        op: Operation.Replace,
        path,
        // If it is a draft, it needs to be deep cloned, and it may also be non-draft.
        value: cloneIfNeeded(copy[index]),
      });
      inversePatches.push({
        op: Operation.Replace,
        path,
        // If it is a draft, it needs to be deep cloned, and it may also be non-draft.
        value: cloneIfNeeded(original[index]),
      });
    }
  }
  for (let index = original.length; index < copy.length; index++) {
    const path = basePath.concat([index]);
    patches.push({
      op: Operation.Add,
      path,
      // If it is a draft, it needs to be deep cloned, and it may also be non-draft.
      value: cloneIfNeeded(copy[index]),
    });
  }
  if (original.length < copy.length) {
    inversePatches.push({
      op: Operation.Replace,
      path: basePath.concat(['length']),
      value: original.length,
    });
  }
}

function generatePatchesFromAssigned(
  { original, copy, assignedMap }: ProxyDraft<Record<string, any>>,
  basePath: any[],
  patches: Patches,
  inversePatches: Patches
) {
  assignedMap.forEach((assignedValue, key) => {
    const originalValue = get(original, key);
    const value = cloneIfNeeded(get(copy, key));
    const op = !assignedValue
      ? Operation.Remove
      : has(original, key)
      ? Operation.Replace
      : Operation.Add;
    if (isEqual(originalValue, value) && op === Operation.Replace) return;
    const path = basePath.concat(key);
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
  inversePatches: Patches
) {
  let i = 0;
  original.forEach((value: any) => {
    if (!copy!.has(value)) {
      const path = basePath.concat([i]);
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
    i++;
  });
  i = 0;
  copy!.forEach((value: any) => {
    if (!original.has(value)) {
      const path = basePath.concat([i]);
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
    i++;
  });
}

export function generatePatches(
  proxyState: ProxyDraft,
  basePath: any[],
  patches: Patches,
  inversePatches: Patches
) {
  switch (proxyState.type) {
    case DraftType.Object:
    case DraftType.Map:
      return generatePatchesFromAssigned(
        proxyState,
        basePath,
        patches,
        inversePatches
      );
    case DraftType.Array:
      return generateArrayPatches(
        proxyState,
        basePath,
        patches,
        inversePatches
      );
    case DraftType.Set:
      return generateSetPatches(proxyState, basePath, patches, inversePatches);
  }
}
