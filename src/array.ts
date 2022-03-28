import { Operation } from './constant';
import { Patches, ProxyDraft } from './interface';
import { makeChange } from './utils';

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
  patches,
  inversePatches,
}: {
  target: ProxyDraft;
  key: string;
  state: any;
  patches?: Patches;
  inversePatches?: Patches;
}) {
  return {
    pop() {
      if (!target.updated) {
        target.assigned = {};
      }
      const result = Array.prototype.pop.apply(state);
      target.updated = true;
      const [last] = state.slice(-1);
      patches?.push([Operation.Pop, [key], []]);
      inversePatches?.push([Operation.Push, [key], [last]]);
      makeChange(target, patches, inversePatches);
      return result;
    },
    push(...args: any[]) {
      if (!target.updated) {
        target.assigned = {};
      }
      const result = Array.prototype.push.apply(state, args);
      target.assigned![key] = true;
      target.updated = true;
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
      if (!target.updated) {
        target.assigned = {};
      }
      const result = Array.prototype.reverse.apply(state);
      target.assigned![key] = true;
      target.updated = true;
      patches?.push([Operation.Reverse, [key], []]);
      inversePatches?.push([Operation.Reverse, [key], []]);
      makeChange(target, patches, inversePatches);
      return result;
    },
    shift() {
      if (!target.updated) {
        target.assigned = {};
      }
      const [first] = state;
      const result = Array.prototype.shift.apply(state);
      target.assigned![key] = true;
      target.updated = true;
      patches?.push([Operation.Shift, [key], []]);
      inversePatches?.push([Operation.Unshift, [key], [first]]);
      makeChange(target, patches, inversePatches);
      return result;
    },
    unshift(...args: any[]) {
      if (!target.updated) {
        target.assigned = {};
      }
      const result = Array.prototype.unshift.apply(state, args);
      target.assigned![key] = true;
      target.updated = true;
      patches?.push([Operation.Unshift, [key], [args]]);
      inversePatches?.push([Operation.Splice, [key], [0, args.length]]);
      makeChange(target, patches, inversePatches);
      return result;
    },
    splice(...args: any) {
      if (!target.updated) {
        target.assigned = {};
      }
      const result = Array.prototype.splice.apply(state, args);
      target.assigned![key] = true;
      target.updated = true;
      patches?.push([Operation.Splice, [key], [args]]);
      // TODO: inverse patches
      // const [startIndex, deleteCount] = args;
      // const count = args.length - 2 - deleteCount;
      // inversePatches?.push([Operation.Splice, [key], [startIndex, , args]]);
      makeChange(target, patches, inversePatches);
      return result;
    },
  }[key];
}

