import {
  type ArrayPatchStrategy,
  DraftType,
  Operation,
  type Patches,
  type ProxyDraft,
} from './interface';
import { escapePath, getProxyDraft, isEqual, isPlainArray } from './utils';
import { cloneIfNeeded } from './patch';
import { hasHoles } from './array';
import { dataTypes } from './constant';

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

// A changed child emits patches under its array only if finalization found it
// at its own index, where they carry its change.
function ownPatches(
  draft: ProxyDraft | undefined,
  parent: ProxyDraft,
  index: number
) {
  return (
    draft !== undefined &&
    draft.finalizedAtKey === true &&
    draft.parent === parent &&
    draft.key === index
  );
}

// Map keys treat 0 and -0 as one value, unlike `retained()`.
const NEGATIVE_ZERO = {};
const toKey = (value: any) =>
  value === 0 && 1 / value < 0 ? NEGATIVE_ZERO : value;

const SAMPLE_SIZE = 64;

// The positions of a longest increasing subsequence of `values`.
function longestIncreasing(values: number[]) {
  // The last position of the best subsequence of each length.
  const tails: number[] = [];
  const previous: number[] = [];
  for (let position = 0; position < values.length; position += 1) {
    // Elements that mostly stay in order extend the longest subsequence.
    const longest = tails.length;
    let low =
      longest > 0 && values[tails[longest - 1]] < values[position]
        ? longest
        : 0;
    let high = longest;
    while (low < high) {
      const middle = Math.floor((low + high) / 2);
      if (values[tails[middle]] < values[position]) low = middle + 1;
      else high = middle;
    }
    previous[position] = low > 0 ? tails[low - 1] : -1;
    tails[low] = position;
  }
  for (let length = tails.length - 1; length > 0; length -= 1) {
    tails[length - 1] = previous[tails[length]];
  }
  return tails;
}

// For each final index from `start` to `endNew`, the base index before
// `endOld` of the element that stays there, or -1. Such elements keep their
// order, so patches need not touch them. A draft stands for its original.
function keptElements(
  original: any[],
  copy: any[],
  start: number,
  endOld: number,
  endNew: number,
  drafts: Map<number, ProxyDraft> | undefined
) {
  const kept = new Int32Array(endNew - start).fill(-1);
  if (start === endOld) return kept;
  const keyAt = (index: number) => {
    const draft = getProxyDraft(copy[index]) ?? drafts?.get(index);
    return toKey(draft ? draft.original : copy[index]);
  };
  // Matching a large range costs far more than the moves of `reverse()`. A
  // sample of its base elements shows whether enough of them stay in order to
  // pay off, as keeping under a third of them saves under a third of the patches.
  const size = endOld - start;
  if (size > SAMPLE_SIZE * 4) {
    const step = Math.floor(size / SAMPLE_SIZE);
    const sample = new Map<any, number>();
    for (let index = start; index < endOld; index += step) {
      sample.set(toKey(original[index]), index);
    }
    const order: number[] = [];
    for (let index = start; index < endNew; index += 1) {
      const position = sample.get(keyAt(index));
      if (position !== undefined) order.push(position);
    }
    if (3 * longestIncreasing(order).length < sample.size) return kept;
  }
  // The first unmatched base index of each element, and the next one of each
  // base index, as an element may appear more than once.
  const firsts = new Map<any, number>();
  const nexts = new Int32Array(endOld - start);
  for (let index = endOld - 1; index >= start; index -= 1) {
    const key = toKey(original[index]);
    const first = firsts.get(key);
    nexts[index - start] = first === undefined ? -1 : first;
    firsts.set(key, index);
  }
  const fromOld: number[] = [];
  const fromNew: number[] = [];
  for (let index = start; index < endNew; index += 1) {
    const key = keyAt(index);
    const first = firsts.get(key);
    if (first !== undefined && first !== -1) {
      firsts.set(key, nexts[first - start]);
      fromOld.push(first);
      fromNew.push(index);
    }
  }
  for (const position of longestIncreasing(fromOld)) {
    kept[fromNew[position] - start] = fromOld[position];
  }
  return kept;
}

// Compact array patches keep the elements that stay in order out of the patches.
// They trim the common prefix and suffix, then match the elements between them
// by identity. What lies between two kept elements takes a replace patch for as
// many elements as both sides have, and a remove or add patch for the rest. They
// carry only elements, like the default generator. A kept element may also have
// changed in place: where it keeps its index, the patches of its own draft carry
// the change, and a replace patch at its final index does where it moved, or for
// a draft that the array holds from another path or producer. Holes, patches of
// a child that would change another element, and arrays whose index patches
// would be no larger use the default generator. The final elements decide, so
// the patches do not depend on how the recipe changed the array: through native
// methods, the proxy path of strict mode or a mark, index assignments or
// `length`.
//
// With `assignedFrom` and `assigned`, the array that the recipe assigned to a key
// of `proxyState`, as in `draft.list = draft.list.filter(...)`, is compared with
// the one that the key held, and the alternative is one patch for the whole array.
function generateCompactArrayPatches(
  proxyState: ProxyDraft<any>,
  basePath: any[],
  patches: Patches,
  inversePatches: Patches,
  pathAsArray: boolean,
  assignedFrom?: any,
  assigned?: any
) {
  const isAssigned = assigned !== undefined;
  if (
    isAssigned &&
    !(
      Array.isArray(assignedFrom) &&
      isPlainArray(assignedFrom) &&
      isPlainArray(assigned) &&
      // Forward and inverse replay must both be able to draft the array.
      proxyState.options.mark?.(assignedFrom, dataTypes) !==
        dataTypes.mutable &&
      proxyState.options.mark?.(assigned, dataTypes) !== dataTypes.mutable
    )
  )
    return false;
  if (isAssigned && proxyState.type === DraftType.Object) {
    const key = basePath[basePath.length - 1];
    // apply() allows assigning an own constructor, but rejects traversing it.
    if (key === 'constructor') return false;
    const descriptor = Object.getOwnPropertyDescriptor(
      proxyState.original,
      key
    );
    // A getter may return a temporary array on each read during replay.
    if (!descriptor || !('value' in descriptor)) return false;
  }
  const original: any[] = isAssigned ? assignedFrom : proxyState.original;
  const copy: any[] = isAssigned ? assigned : proxyState.copy!;
  const assignedMap = proxyState.assignedMap!;
  const oldLength = original.length;
  const newLength = copy.length;
  const shortest = Math.min(oldLength, newLength);
  const arrayState = proxyState.arrayState;
  const relocated = arrayState !== null && arrayState.relocated;
  if (!isAssigned) {
    // Two assigned indices at the same length take two replace patches at most,
    // which no other patches beat.
    if (oldLength === newLength && !relocated && assignedMap.size < 3)
      return false;
    // Elements change places only at indices that native methods moved or the
    // recipe assigned. When none lies below the shorter length, the change is
    // an append or a truncation, which the default generator patches as such.
    let first = relocated ? arrayState!.diffStart : shortest;
    assignedMap.forEach((_flag: boolean, key: any) => {
      if (key !== 'length') first = Math.min(first, Number(key));
    });
    if (first >= shortest) return false;
  }

  // Holes compare like undefined, which the patches would make explicit. An
  // assigned array is checked before matching, so that a sparse prefix or
  // suffix does not read every absent index of both arrays.
  if (isAssigned && (hasHoles(original) || hasHoles(copy))) return false;

  // Identity alone is not enough: a draft of a base element may have changed,
  // and the indices of the kept elements that only a replace patch can carry
  // are collected.
  const drafts = isAssigned ? undefined : proxyState.writtenDrafts;
  let changed: number[] | undefined;
  const keep = (state: number, index: number) => {
    if (state === 2 && !ownPatches(drafts?.get(index), proxyState, index)) {
      (changed ??= []).push(index);
    }
  };
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
    keep(state, prefix);
    prefix += 1;
  }
  // Index patches replace these elements too, so they do not count against
  // compact patches.
  const changedInPrefix = changed ? changed.length : 0;
  let suffix = 0;
  while (
    suffix < shortest - prefix &&
    (state = retained(
      copy[newLength - 1 - suffix],
      original[oldLength - 1 - suffix],
      drafts,
      newLength - 1 - suffix,
      proxyState
    ))
  ) {
    keep(state, newLength - 1 - suffix);
    suffix += 1;
  }
  const endOld = oldLength - suffix;
  const endNew = newLength - suffix;
  if (!isAssigned) {
    // Tail changes already use the default generator's efficient append/truncate
    // form, and elements that all stay in place need no structural patches.
    if (prefix === shortest || (prefix === endOld && prefix === endNew))
      return false;
    // Without native moves, only assigned indices can differ, so far fewer of
    // them than the range has elements leave few index patches and nothing to
    // search.
    if (!relocated && 2 * assignedMap.size < endNew - prefix) return false;
    // Checked only now, as the exits above leave most changes in place
    // without reading both arrays to their ends.
    if (hasHoles(original) || hasHoles(copy)) return false;
  }

  const kept = keptElements(original, copy, prefix, endOld, endNew, drafts);
  const baseIndex = (index: number) =>
    index < prefix
      ? index
      : index >= endNew
        ? index - newLength + oldLength
        : kept[index - prefix];
  // The patches of a child are valid where its element keeps its index; anywhere
  // else, they would change another element.
  if (proxyState.patchedIndices) {
    for (const index of proxyState.patchedIndices) {
      if (baseIndex(index) !== index) return false;
    }
  }

  const removes: number[] = [];
  const adds: number[] = [];
  // Pairs of a base index and a final index.
  const replaces: number[] = [];
  let oldIndex = prefix;
  let newIndex = prefix;
  const fillGap = (stopOld: number, stopNew: number) => {
    while (oldIndex < stopOld && newIndex < stopNew) {
      replaces.push(oldIndex, newIndex);
      oldIndex += 1;
      newIndex += 1;
    }
    for (; oldIndex < stopOld; oldIndex += 1) removes.push(oldIndex);
    for (; newIndex < stopNew; newIndex += 1) adds.push(newIndex);
  };
  for (let index = prefix; index < endNew; index += 1) {
    const base = kept[index - prefix];
    if (base !== -1) {
      fillGap(base, index);
      keep(
        retained(copy[index], original[base], drafts, index, proxyState),
        index
      );
      oldIndex = base + 1;
      newIndex = index + 1;
    }
  }
  fillGap(endOld, endNew);

  // Counting a patch with a value as two and one without as one, in both
  // directions: `splice(0, 999)` of 1,000 elements takes 999 remove patches, but
  // one replace patch and one of the `length`, and reversing an array would
  // remove and add nearly all of its elements. A moved element rarely equals what
  // its new index held, so counting those is left out if it could not matter.
  const changedElsewhere = changed ? changed.length - changedInPrefix : 0;
  const cost =
    3 * (removes.length + adds.length) +
    4 * (replaces.length / 2 + changedElsewhere);
  if (isAssigned) {
    // One patch in each direction holds a whole array, so its elements need no
    // paths of their own.
    if (10 * cost >= 9 * (2 + oldLength + newLength)) return false;
  } else if (cost >= shortest - prefix) {
    let slots = 0;
    for (let index = prefix; index < shortest; index += 1) {
      if (
        retained(copy[index], original[index], drafts, index, proxyState) !== 1
      ) {
        slots += 1;
      }
    }
    const lengthChange = Math.abs(newLength - oldLength);
    // The count ignores the size of each value, as when an element that stays
    // at its index is not among those kept, and index patches would not carry
    // it. They win a close count: requiring a tenth less changes the total size
    // of random patches by under 0.5%, but makes them larger far less often.
    if (
      10 * cost >=
      9 * (4 * slots + 2 * lengthChange + (lengthChange > 0 ? 1 : 0))
    )
      return false;
  }

  const pathOf = (index: number | string) =>
    escapePath(basePath.concat([index]), pathAsArray);
  // An assigned array that ends where the old one went on is one patch of its
  // length, as the default generator would give.
  if (
    isAssigned &&
    prefix === newLength &&
    proxyState.options.enablePatches.arrayLengthAssignment !== false &&
    removes.length > 0
  ) {
    patches.push({
      op: Operation.Replace,
      path: pathOf('length'),
      value: newLength,
    });
  } else {
    // Removing from the end and adding from the start, both index lists hold for
    // the array as those patches find it.
    for (let position = removes.length - 1; position >= 0; position -= 1) {
      patches.push({ op: Operation.Remove, path: pathOf(removes[position]) });
    }
  }
  // An inserted draft that is finalized after this array, because the recipe
  // read it first or another producer owns it, is still a draft here. It is
  // represented as in the default generator's patches.
  for (const index of adds) {
    patches.push({
      op: Operation.Add,
      path: pathOf(index),
      value: cloneIfNeeded(copy[index]),
    });
  }
  const replace = (from: number, to: number) => {
    const path = pathOf(to);
    patches.push({
      op: Operation.Replace,
      path,
      value: cloneIfNeeded(copy[to]),
    });
    inversePatches.push({
      op: Operation.Replace,
      path,
      value: cloneIfNeeded(original[from]),
    });
  };
  for (let position = 0; position < replaces.length; position += 2) {
    const from = replaces[position];
    const to = replaces[position + 1];
    if (retained(copy[to], original[from], drafts, to, proxyState) !== 1) {
      replace(from, to);
    }
  }
  // A changed element that its own patches do not carry is replaced at its
  // final index once the change is done, and restored before it is undone.
  changed?.forEach((index) => replace(baseIndex(index), index));
  for (let position = adds.length - 1; position >= 0; position -= 1) {
    inversePatches.push({ op: Operation.Remove, path: pathOf(adds[position]) });
  }
  for (const index of removes) {
    inversePatches.push({
      op: Operation.Add,
      path: pathOf(index),
      value: cloneIfNeeded(original[index]),
    });
  }
  return true;
}

/**
 * The value of the `arrayPatchStrategy` option that keeps array elements which
 * stay in order out of patches: removing the first of 10,000 elements takes one
 * patch instead of 10,000, and `draft.list = draft.list.filter(...)` a patch per
 * removed element instead of the whole array. An array is left to the default
 * patches where those are about as small. Bundlers drop this value unless it is
 * imported.
 *
 * @example
 * ```ts
 * import { compactArrayPatches, create } from 'mutative';
 *
 * const [state, patches, inversePatches] = create(
 *   { list: [1, 2, 3, 4] },
 *   (draft) => {
 *     draft.list.splice(1, 1);
 *   },
 *   { enablePatches: { arrayPatchStrategy: compactArrayPatches } }
 * );
 *
 * expect(patches).toEqual([{ op: 'remove', path: ['list', 1] }]);
 * expect(inversePatches).toEqual([{ op: 'add', path: ['list', 1], value: 2 }]);
 * ```
 */
export const compactArrayPatches =
  generateCompactArrayPatches as unknown as ArrayPatchStrategy;
