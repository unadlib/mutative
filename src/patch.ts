import assert from 'assert';
import { diffArrays } from 'diff';
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

function generateArrayPatches(
  proxyState: ProxyDraft<Array<any>>,
  basePath: any[],
  patches: Patches,
  inversePatches: Patches,
  pathAsArray: boolean
) {
  let { original } = proxyState;

  let copy = proxyState.copy!;

  console.log(original, copy.map(getValue));

  const diff = diffArrays(original, copy, {
    comparator: (_o, c) => {
      if (_o === getValue(c)) return true;

      const item = getProxyDraft(c);

      if (item && !item?.operated) {
        return _o === item?.original;
      }

      return false;
    },
  });
  const diff2: Array<{
    op: 'keep' | 'replace' | 'add' | 'remove';
    count: number;
  }> = [];

  for (let i = 0; i < diff.length; i++) {
    const d = diff[i];
    assert(typeof d.count === 'number');
    assert(!(d.removed && d.added));

    const n = diff[i + 1];

    if (d.removed) {
      if (n?.added) {
        assert(typeof n.count === 'number');
        if (d.count === n.count) {
          diff2.push({ op: 'replace', count: d.count });
        } else if (n.count > d.count) {
          diff2.push({ op: 'add', count: n.count - d.count });
          diff2.push({ op: 'replace', count: d.count });
        } else {
          diff2.push({ op: 'remove', count: d.count - n.count });
          diff2.push({ op: 'replace', count: n.count });
        }
        i++;
      } else {
        diff2.push({ op: 'remove', count: d.count });
      }
    } else if (d.added) {
      if (n?.removed) {
        assert.fail('unexpected');
      } else {
        diff2.push({ op: 'add', count: d.count });
      }
    } else {
      diff2.push({ op: 'keep', count: d.count });
    }
  }

  console.log('diff', diff);
  console.log('diff2', diff2);

  let [originalIndex, copyIndex] = [0, 0];
  let [removedOffset, addedOffset] = [0, 0];

  for (let i = 0; i < diff2.length; i++) {
    const d = diff2[i];

    switch (d.op) {
      case 'keep':
        originalIndex += d.count;
        copyIndex += d.count;
        break;
      case 'replace':
        for (let j = 0; j < d.count; j++) {
          const o = original[originalIndex];
          const c = copy[copyIndex];

          patches.push({
            op: Operation.Replace,
            path: escapePath(basePath.concat([copyIndex]), pathAsArray),
            // If it is a draft, it needs to be deep cloned, and it may also be non-draft.
            value: cloneIfNeeded(c),
          });
          inversePatches.push({
            op: Operation.Replace,
            path: escapePath(basePath.concat([originalIndex]), pathAsArray),
            // If it is a draft, it needs to be deep cloned, and it may also be non-draft.
            value: cloneIfNeeded(o),
          });

          originalIndex += 1;
          copyIndex += 1;
        }
        break;
      case 'add':
        for (let j = 0; j < d.count; j++) {
          patches.push({
            op: Operation.Add,
            path: escapePath(basePath.concat([copyIndex + j]), pathAsArray),
            // If it is a draft, it needs to be deep cloned, and it may also be non-draft.
            value: cloneIfNeeded(copy[copyIndex + j]),
          });
          inversePatches.push({
            op: Operation.Remove,
            path: escapePath(
              basePath.concat([copyIndex - addedOffset + removedOffset]),
              pathAsArray
            ),
          });
        }
        copyIndex += d.count;
        addedOffset += d.count;
        break;
      case 'remove':
        for (let j = 0; j < d.count; j++) {
          patches.push({
            op: Operation.Remove,
            path: escapePath(
              basePath.concat([originalIndex - removedOffset + addedOffset]),
              pathAsArray
            ),
          });
          inversePatches.push({
            op: Operation.Add,
            path: escapePath(basePath.concat([originalIndex + j]), pathAsArray),
            // If it is a draft, it needs to be deep cloned, and it may also be non-draft.
            value: cloneIfNeeded(original[originalIndex + j]),
          });
        }
        originalIndex += d.count;
        removedOffset += d.count;
        break;
    }
  }

  console.log('patches', [...patches]);
  console.log('inversePatches', [...inversePatches]);
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
