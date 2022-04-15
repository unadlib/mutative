import { Operation } from './constant';
import { Patches, ProxyDraft } from './interface';
import { isDraftable, makeChange } from './utils';

export const mutableArrayMethods = [
  // "copyWithin",
  // "fill",
  // "sort",
  'pop',
  'push',
  'reverse',
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
  state: any;
  assignedSet: WeakSet<any>;
  patches?: Patches;
  inversePatches?: Patches;
}) {
  // todo: check for changes
  return {
    pop() {
      const result = Array.prototype.pop.apply(state);
      target.operated.add(key);
      const [last] = state.slice(-1);
      patches?.push([Operation.Pop, [key], []]);
      inversePatches?.push([Operation.Push, [key], [last]]);
      makeChange(target, patches, inversePatches);
      return result;
    },
    push(...args: any[]) {
      const result = Array.prototype.push.apply(state, args);
      target.operated.add(key);
      args.forEach((value) => {
        if (isDraftable(value)) {
          assignedSet.add(value);
        }
      });
      patches?.push([Operation.Push, [key], args]);
      inversePatches?.push([
        Operation.Shift,
        [key],
        [state.length, args.length],
      ]);
      makeChange(target, patches, inversePatches);
      return result;
    },
    reverse() {
      const result = Array.prototype.reverse.apply(state);
      target.operated.add(key);
      patches?.push([Operation.Reverse, [key], []]);
      inversePatches?.push([Operation.Reverse, [key], []]);
      makeChange(target, patches, inversePatches);
      return result;
    },
    shift() {
      const [first] = state;
      const result = Array.prototype.shift.apply(state);
      target.operated.add(key);
      patches?.push([Operation.Shift, [key], []]);
      inversePatches?.push([Operation.Unshift, [key], [first]]);
      makeChange(target, patches, inversePatches);
      return result;
    },
    unshift(...args: any[]) {
      const result = Array.prototype.unshift.apply(state, args);
      target.operated.add(key);
      args.forEach((value) => {
        if (isDraftable(value)) {
          assignedSet.add(value);
        }
      });
      patches?.push([Operation.Unshift, [key], [args]]);
      inversePatches?.push([Operation.Splice, [key], [0, args.length]]);
      makeChange(target, patches, inversePatches);
      return result;
    },
    splice(...args: any) {
      const result = Array.prototype.splice.apply(state, args);
      target.operated.add(key);
      patches?.push([Operation.Splice, [key], [args]]);
      args.slice(2).forEach((value: any) => {
        if (isDraftable(value)) {
          assignedSet.add(value);
        }
      });
      // TODO: inverse patches
      // const [startIndex, deleteCount] = args;
      // const count = args.length - 2 - deleteCount;
      // inversePatches?.push([Operation.Splice, [key], [startIndex, , args]]);
      makeChange(target, patches, inversePatches);
      return result;
    },
  }[key];
}
