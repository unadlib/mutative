import { Operation } from './constant';
import type { Patches, ProxyDraft } from './interface';
import { makeChange } from './utils';

export const mutableMapMethods = ['clear', 'delete', 'set'];

export function createMapHandler({
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
    set(_key: any, _value: any) {
      if (!target.updated) {
        target.assigned = {};
      }
      const result = Map.prototype.set.call(state, _key, _value);
      target.assigned![key] = true;
      target.updated = true;
      patches?.push([Operation.Set, [key], [_key, _value]]);
      inversePatches?.push([Operation.Delete, [key], [_key]]);
      makeChange(target, patches, inversePatches);
      return result;
    },
    clear() {
      if (!target.updated) {
        target.assigned = {};
      }
      const result = Map.prototype.clear.call(state);
      target.assigned![key] = true;
      target.updated = true;
      patches?.push([Operation.Clear, [key], []]);
      inversePatches?.push([Operation.Construct, [key], [state.entries()]]);
      makeChange(target, patches, inversePatches);
      return result;
    },
    delete(_key: any) {
      if (!target.updated) {
        target.assigned = {};
      }
      const result = Map.prototype.delete.call(state, _key);
      target.assigned![key] = true;
      target.updated = true;
      patches?.push([Operation.Delete, [key], [_key]]);
      const _value = state.get(_key);
      inversePatches?.push([Operation.Set, [key], [_key, _value]]);
      makeChange(target, patches, inversePatches);
      return result;
    },
  }[key];
}
