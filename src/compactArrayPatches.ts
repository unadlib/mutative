import {
  type ArrayPatchStrategy,
  Operation,
  type Patches,
  type ProxyDraft,
} from './interface';
import { escapePath, getProxyDraft, isEqual } from './utils';
import { cloneIfNeeded } from './patch';
import { hasHoles } from './array';

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

// A changed child emits patches under its array only at its own index, where
// its own patches carry its change.
function ownPatches(
  draft: ProxyDraft | undefined,
  parent: ProxyDraft,
  index: number
) {
  return draft !== undefined && draft.parent === parent && draft.key === index;
}

// Compact array patches keep the common prefix and suffix of an array whose
// length changed, and turn what lies between them into `replace` patches for as
// many elements as both sides have, then `remove` or `add` patches for the
// rest. They carry only elements, like the default generator. A retained element
// may also have changed in place: where it keeps its index, the patches of its
// own draft carry the change, and a replace patch at its final index does where
// the change moved it, or for a draft that the array holds from another path or
// producer. Holes and arrays that keep their length use the default generator.
// The final elements decide, so the patches do not depend on how the recipe
// changed the array: through native methods, the proxy path of strict mode or a
// mark, index assignments or `length`.
function generateCompactArrayPatches(
  proxyState: ProxyDraft<Array<any>>,
  basePath: any[],
  patches: Patches,
  inversePatches: Patches,
  pathAsArray: boolean
) {
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
  const drafts = proxyState.writtenDrafts;
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

  // Tail changes already use the default generator's efficient append/truncate
  // form.
  if (prefix === shortest) return false;
  // Counting a patch with a value as two and one without as one, in both
  // directions, index patches are smaller once the length changes by more than
  // four times the suffix they would have to move: `splice(0, 999)` of 1,000
  // elements takes 999 `remove` patches, but one `replace` patch and one of
  // the `length`; inserting that many takes as many `remove` patches to undo.
  if (Math.abs(newLength - oldLength) > 4 * suffix) return false;
  // Before the change, an element keeps its index, and the patches of its own
  // child carry its change; anywhere else, they would change another element.
  let moved = false;
  drafts?.forEach((draft, index) => {
    if (index >= prefix && ownPatches(draft, proxyState, index)) moved = true;
  });
  if (moved) return false;
  // A hole compares like an undefined element, which the patches would make
  // explicit. Only an array that has the compact shape is searched for holes.
  if (hasHoles(original) || hasHoles(copy)) return false;

  const removed = oldLength - prefix - suffix;
  const added = newLength - prefix - suffix;
  // The elements that both sides have take a replace patch each, in the place
  // of a remove patch and an add patch.
  const paired = Math.min(removed, added);
  for (index = prefix + removed - 1; index >= prefix + paired; index -= 1) {
    patches.push({
      op: Operation.Remove,
      path: escapePath(basePath.concat([index]), pathAsArray),
    });
  }
  // An inserted draft that is finalized after this array, because the recipe
  // read it first or another producer owns it, is still a draft here. It is
  // represented as in the default generator's patches.
  for (index = prefix + paired; index < prefix + added; index += 1) {
    patches.push({
      op: Operation.Add,
      path: escapePath(basePath.concat([index]), pathAsArray),
      value: cloneIfNeeded(copy[index]),
    });
  }
  for (index = prefix; index < prefix + paired; index += 1) {
    if (
      retained(copy[index], original[index], drafts, index, proxyState) !== 1
    ) {
      const path = escapePath(basePath.concat([index]), pathAsArray);
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
  // A changed element that its own patches do not carry is replaced at its
  // final index once the change is done, and restored before it is undone.
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
  for (index = prefix + added - 1; index >= prefix + paired; index -= 1) {
    inversePatches.push({
      op: Operation.Remove,
      path: escapePath(basePath.concat([index]), pathAsArray),
    });
  }
  for (index = prefix + paired; index < prefix + removed; index += 1) {
    inversePatches.push({
      op: Operation.Add,
      path: escapePath(basePath.concat([index]), pathAsArray),
      value: cloneIfNeeded(original[index]),
    });
  }
  return true;
}

/**
 * The value of the `arrayPatchStrategy` option that keeps elements which a
 * change only moved out of the patches, so that a recipe which inserts or
 * removes elements before the end of an array gets patches for what it changed
 * rather than for every index after it. Bundlers drop it unless it is imported.
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
