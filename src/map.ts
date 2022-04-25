import type { Patches, ProxyDraft } from './interface';
import { CLEAR, dataTypes, Operation } from './constant';
import {
  ensureDraftValue,
  ensureShallowCopy,
  getProxyDraft,
  getValue,
  isDraftable,
  latest,
  makeChange,
} from './utils';
import { createDraft } from './draft';

export const mutableMapMethods = [
  'get',
  'set',
  'has',
  'delete',
  'clear',
  'entries',
  'forEach',
  'keys',
  'size',
  'values',
  Symbol.iterator,
];

export function createMapHandler({
  target,
  key,
  state,
  proxiesMap,
  assignedSet,
  patches,
  inversePatches,
}: {
  target: ProxyDraft;
  key: string | symbol;
  state: Map<any, any>;
  proxiesMap: WeakMap<object, ProxyDraft>;
  assignedSet: WeakSet<any>;
  patches?: Patches;
  inversePatches?: Patches;
}) {
  if (key === 'size') {
    return latest<Map<any, any>>(target).size;
  }
  const proxyProto = {
    set(_key: any, _value: any) {
      const result = Map.prototype.set.call(state, _key, _value);
      if (target.original.has(_key) && target.original.get(_key) === _value) {
        target.operated.delete(_key);
      } else {
        target.operated.add(_key);
      }
      if (isDraftable(_value, target)) {
        assignedSet.add(_value);
      }
      ensureDraftValue(target, _key, _value);
      const index = Array.from(result.keys()).indexOf(_key);
      patches?.push([Operation.Set, [index], [_key, _value]]);
      inversePatches?.unshift([Operation.Delete, [index], [_key]]);
      makeChange(target, patches, inversePatches);
      return result;
    },
    clear() {
      const result = Map.prototype.clear.call(state);
      if (!target.original.size) {
        target.operated.delete(CLEAR);
      } else {
        target.operated.add(CLEAR);
      }
      patches?.push([Operation.Clear, [], []]);
      inversePatches?.unshift([Operation.Construct, [], [state.entries()]]);
      makeChange(target, patches, inversePatches);
      return result;
    },
    delete(_key: any) {
      const result = Map.prototype.delete.call(state, _key);
      if (!target.original.has(_key)) {
        target.operated.delete(_key);
      } else {
        target.operated.add(_key);
      }
      patches?.push([Operation.Delete, [], [_key]]);
      const _value = state.get(_key);
      inversePatches?.unshift([Operation.Set, [], [_key, _value]]);
      makeChange(target, patches, inversePatches);
      return result;
    },
    get(_key: any): any {
      ensureShallowCopy(target);
      const value = target.copy!.get(_key);
      if (
        assignedSet.has(value) ||
        target.marker?.(value, dataTypes) === dataTypes.mutable
      ) {
        return value;
      }
      if (isDraftable(value, target) && !getProxyDraft(value)) {
        const currentDraft = createDraft({
          original: target.original.get(_key),
          parentDraft: target,
          key: _key,
          patches,
          inversePatches,
          finalities: target.finalities,
          proxiesMap,
          marker: target.marker,
          assignedSet,
        });
        target.copy!.set(_key, currentDraft);
        target.finalities.draft.unshift(() => {
          const proxyDraft = getProxyDraft(target.copy!.get(_key));
          if (proxyDraft) {
            const value =
              proxyDraft.operated.size > 0
                ? getValue(target.copy!.get(_key))
                : proxyDraft.original;
            target.copy!.set(_key, value);
          }
        });
        return currentDraft;
      }
      return value;
    },
    has(key: any): boolean {
      return latest<Map<any, any>>(target).has(key);
    },
    forEach(
      this: Map<any, any>,
      callback: (value: any, key: any, self: Map<any, any>) => void,
      thisArg?: any
    ) {
      latest<Map<any, any>>(target).forEach((value: any, key: any) => {
        callback.call(thisArg, this.get(key), key, this);
      });
    },
    keys(): IterableIterator<any> {
      return latest<Map<any, any>>(target).keys();
    },
    values(): IterableIterator<any> {
      const iterator = this.keys();
      return {
        [Symbol.iterator]: () => this.values(),
        next: () => {
          const iteratorResult = iterator.next();
          if (iteratorResult.done) return iteratorResult;
          const value = this.get(iteratorResult.value);
          return {
            done: false,
            value,
          };
        },
      };
    },
    entries(): IterableIterator<[any, any]> {
      const iterator = this.keys();
      return {
        [Symbol.iterator]: () => this.entries(),
        next: () => {
          const iteratorResult = iterator.next();
          if (iteratorResult.done) return iteratorResult;
          const value = this.get(iteratorResult.value);
          return {
            done: false,
            value: [iteratorResult.value, value],
          };
        },
      };
    },
    [Symbol.iterator]() {
      return this.entries();
    },
  };
  // TODO: refactor for better performance
  return proxyProto[key as keyof typeof proxyProto].bind(proxyProto);
}
