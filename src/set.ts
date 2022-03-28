import { Operation } from './constant';
import type { Patches, ProxyDraft } from './interface';
import { makeChange } from './utils';

export const mutableSetMethods = ['clear', 'delete', 'add'];

export function createSetHandler({
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
    add(value: any) {
      if (!target.updated) {
        target.assigned = {};
      }
      const result = Set.prototype.add.call(state, value);
      target.assigned![key] = true;
      target.updated = true;
      patches?.push([Operation.Set, [key], [value]]);
      inversePatches?.push([Operation.Delete, [key], [value]]);
      makeChange(target, patches, inversePatches);
      return result;
    },
    clear() {
      if (!target.updated) {
        target.assigned = {};
      }
      const result = Set.prototype.clear.call(state);
      target.assigned![key] = true;
      target.updated = true;
      patches?.push([Operation.Clear, [key], []]);
      inversePatches?.push([Operation.Construct, [key], [state.values()]]);
      makeChange(target, patches, inversePatches);
      return result;
    },
    delete(value: any) {
      if (!target.updated) {
        target.assigned = {};
      }
      const result = Set.prototype.delete.call(state, value);
      target.assigned![key] = true;
      target.updated = true;
      patches?.push([Operation.Delete, [key], [value]]);
      inversePatches?.push([Operation.Set, [key], [value]]);
      makeChange(target, patches, inversePatches);
      return result;
    },
  }[key];
}
