import { ArrayOperation, DraftType } from './constant';
import { Patches, ProxyDraft } from './interface';
import {
  ensureDraftValue,
  getValueOrPath,
  isDraftable,
  makeChange,
} from './utils';

export const mutableArrayMethods = [
  // "copyWithin",
  // "fill",
  // "sort",
  // 'reverse',
  'pop',
  'push',
  'shift',
  'unshift',
  'splice',
];
// Exclude `sort` method: Its argument can be a sort callback, so the operation patch cannot be serialized correctly.

export function createArrayHandler({
  target,
  key,
  state,
  assignedSet,
  patches,
  inversePatches,
}: {
  target: ProxyDraft;
  key: string;
  state: any[];
  assignedSet: WeakSet<any>;
  patches?: Patches;
  inversePatches?: Patches;
}) {
  return {
    pop() {
      const index = state.length - 1;
      const [last] = state.slice(-1);
      const result = Array.prototype.pop.apply(state);
      if (target.original[index] !== result) {
        target.operated.delete(index);
      } else {
        target.operated.add(index);
      }
      patches?.push([[DraftType.Array, ArrayOperation.Pop], [], []]);
      inversePatches?.unshift([
        [DraftType.Array, ArrayOperation.Push],
        [],
        [last],
      ]);
      makeChange(target, patches, inversePatches);
      return result;
    },
    push(...args: any[]) {
      const originalLength = state.length;
      const result = Array.prototype.push.apply(state, args);
      args.forEach((value, _index) => {
        const index = originalLength + _index;
        if (target.original[index] !== result) {
          target.operated.add(index);
        } else {
          target.operated.delete(index);
        }
        if (isDraftable(value, target)) {
          assignedSet.add(value);
        }
        ensureDraftValue(target, index, value);
      });
      patches?.push([
        [DraftType.Array, ArrayOperation.Push],
        [],
        args.map((value) => getValueOrPath(value)),
      ]);
      inversePatches?.unshift([
        [DraftType.Array, ArrayOperation.Set],
        ['length'],
        [originalLength],
      ]);
      makeChange(target, patches, inversePatches);
      return result;
    },
    shift() {
      const [first] = state;
      const oldState = Array.prototype.concat.call(state);
      const result = Array.prototype.shift.apply(state);
      oldState.forEach((_, index) => {
        if (target.original[index] === state[index]) {
          target.operated.delete(index);
        } else {
          target.operated.add(index);
        }
      });
      patches?.push([[DraftType.Array, ArrayOperation.Shift], [], []]);
      inversePatches?.unshift([
        [DraftType.Array, ArrayOperation.Unshift],
        [],
        [first],
      ]);
      makeChange(target, patches, inversePatches);
      return result;
    },
    unshift(...args: any[]) {
      const result = Array.prototype.unshift.apply(state, args);
      state.forEach((_, index) => {
        if (target.original[index] === state[index]) {
          target.operated.delete(index);
        } else {
          target.operated.add(index);
        }
        ensureDraftValue(target, index, state[index]);
      });
      args.forEach((value) => {
        if (isDraftable(value, target)) {
          assignedSet.add(value);
        }
      });
      patches?.push([
        [DraftType.Array, ArrayOperation.Unshift],
        [],
        args.map((value) => getValueOrPath(value)),
      ]);
      inversePatches?.unshift([
        [DraftType.Array, ArrayOperation.Splice],
        [],
        [0, args.length],
      ]);
      makeChange(target, patches, inversePatches);
      return result;
    },
    splice(...args: any) {
      const oldState = Array.prototype.concat.call(state);
      const result = Array.prototype.splice.apply(state, args);
      const [startIndex, deleteCount, ...items] = args;
      (oldState.length > state.length ? oldState : state)
        .slice(startIndex)
        .forEach((_, _index) => {
          const index = _index + startIndex;
          if (target.original[index] === state[index]) {
            target.operated.delete(index);
          } else {
            target.operated.add(index);
          }
          ensureDraftValue(target, index, state[index]);
        });
      items.slice(2).forEach((value: any) => {
        if (isDraftable(value, target)) {
          assignedSet.add(value);
        }
      });
      patches?.push([
        [DraftType.Array, ArrayOperation.Splice],
        [],
        args.map((value: any) => getValueOrPath(value)),
      ]);
      inversePatches?.unshift([
        [DraftType.Array, ArrayOperation.Splice],
        [],
        [startIndex, items.length, ...result],
      ]);
      makeChange(target, patches, inversePatches);
      return result;
    },
  }[key];
}
