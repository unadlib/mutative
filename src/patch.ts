import { DraftType, Operation, Patches, ProxyDraft } from './interface';
import {
  cloneIfNeeded,
  escapePath,
  get,
  getProxyDraft,
  getValue,
  has,
  isEqual,
} from './utils';

const REMOVED = Symbol('REMOVED');
const ADDED = Symbol('ADDED');

function generateArrayPatches(
  proxyState: ProxyDraft<Array<any>>,
  basePath: any[],
  patches: Patches,
  inversePatches: Patches,
  pathAsArray: boolean
) {
  let { original, arrayChanges } = proxyState;

  // console.log('generateArrayPatches', proxyState.key);

  let copy = proxyState.copy!;

  if (arrayChanges) {
    const changedOriginal = original.slice();
    const changedCopy = copy.slice();

    arrayChanges.sort(([, a], [, b]) => a - b);
    // console.log('arrayChanges', arrayChanges);

    let removedOffset = 0;
    let addedOffset = 0;

    for (const [op, index] of arrayChanges) {
      switch (op) {
        case 'removed':
          changedCopy.splice(index + addedOffset, 0, REMOVED);
          removedOffset += 1;
          break;
        case 'added':
          changedOriginal.splice(index + removedOffset, 0, ADDED);
          addedOffset += 1;
          break;
      }
    }

    original = changedOriginal;
    copy = changedCopy;
  }

  // console.log('original', original);
  // console.log('copy', copy);

  let removedOffset = 0;
  let addedOffset = 0;
  for (let index = 0; index < original.length; index += 1) {
    if (getValue(copy[index]) !== original[index]) {
      // console.log('index', index);
      // console.log('removedOffset', removedOffset);
      if (copy[index] === REMOVED && original[index] === ADDED) {
        removedOffset += 1;
        addedOffset += 1;
      } else if (copy[index] === REMOVED) {
        patches.push({
          op: Operation.Remove,
          path: escapePath(
            basePath.concat([index - removedOffset]),
            pathAsArray
          ),
        });
        inversePatches.push({
          op: Operation.Add,
          path: escapePath(basePath.concat([index - addedOffset]), pathAsArray),
          // If it is a draft, it needs to be deep cloned, and it may also be non-draft.
          value: cloneIfNeeded(original[index]),
        });
        removedOffset += 1;
      } else if (original[index] === ADDED) {
        patches.push({
          op: Operation.Add,
          path: escapePath(
            basePath.concat([index - removedOffset]),
            pathAsArray
          ),
          // If it is a draft, it needs to be deep cloned, and it may also be non-draft.
          value: cloneIfNeeded(copy[index]),
        });
        inversePatches.push({
          op: Operation.Remove,
          path: escapePath(basePath.concat([index - addedOffset]), pathAsArray),
        });
        addedOffset += 1;
      } else {
        const item = getProxyDraft(copy[index]);

        if (item && !item.operated) {
          // eslint-disable-next-line no-continue
          continue;
        }

        patches.push({
          op: Operation.Replace,
          path: escapePath(
            basePath.concat([index - removedOffset]),
            pathAsArray
          ),
          // If it is a draft, it needs to be deep cloned, and it may also be non-draft.
          value: cloneIfNeeded(copy[index]),
        });
        inversePatches.push({
          op: Operation.Replace,
          path: escapePath(basePath.concat([index - addedOffset]), pathAsArray),
          // If it is a draft, it needs to be deep cloned, and it may also be non-draft.
          value: cloneIfNeeded(original[index]),
        });
      }
    }
  }

  for (let index = original.length; index < copy.length; index += 1) {
    patches.push({
      op: Operation.Add,
      path: escapePath(basePath.concat([index]), pathAsArray),
      // If it is a draft, it needs to be deep cloned, and it may also be non-draft.
      value: cloneIfNeeded(copy[index]),
    });
    inversePatches.push({
      op: Operation.Remove,
      path: escapePath(basePath.concat([original.length]), pathAsArray),
    });
  }

  // console.log('patches', [...patches]);
  // console.log('inversePatches', [...inversePatches]);
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
    const _path = basePath.concat(key);
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
