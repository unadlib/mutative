import type { Patches, ProxyDraft } from './interface';
import { CLEAR, dataTypes, DraftType, MapOperation } from './constant';
import {
  appendParentDraft,
  appendPaths,
  ensureDraftValue,
  ensureShallowCopy,
  getProxyDraft,
  getValue,
  getValueOrPath,
  isDraftable,
  latest,
  makeChange,
} from './utils';
import { createDraft } from './draft';
import { current } from './current';

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
  assignedSet,
  patches,
  inversePatches,
}: {
  target: ProxyDraft<Map<any, any>>;
  key: string | symbol;
  state: Map<any, any>;
  assignedSet: WeakSet<any>;
  patches?: Patches;
  inversePatches?: Patches;
}) {
  if (key === 'size') {
    return latest<Map<any, any>>(target).size;
  }
  const proxyProto = {
    set(_key: any, _value: any) {
      const hasKey = inversePatches ? state.has(_key) : null;
      const oldValue = inversePatches ? state.get(_key) : null;
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
      if (patches && inversePatches) {
        const index = Array.from(result.keys()).indexOf(_key);
        appendParentDraft({
          current: _value,
          parent: target,
          key: index,
        });
        patches?.push([
          [DraftType.Map, MapOperation.Set],
          [[index]],
          [_key, getValueOrPath(_value)],
        ]);
        inversePatches?.unshift([
          [DraftType.Map, hasKey ? MapOperation.Set : MapOperation.Delete],
          [[index]],
          hasKey ? [_key, oldValue] : [],
        ]);
      }
      const paths = makeChange(target, patches && inversePatches && [[]]);
      if (patches && inversePatches) {
        appendPaths(paths!, patches, inversePatches);
      }
      return result;
    },
    clear() {
      const oldState = inversePatches ? Array.from(state) : null;
      const result = Map.prototype.clear.call(state);
      if (!target.original.size) {
        target.operated.delete(CLEAR);
      } else {
        target.operated.add(CLEAR);
      }
      patches?.push([[DraftType.Map, MapOperation.Clear], [[-1]], []]);
      inversePatches?.unshift([
        [DraftType.Map, MapOperation.Construct],
        [[-1]],
        oldState!,
      ]);
      const paths = makeChange(target, patches && inversePatches && [[]]);
      if (patches && inversePatches) {
        appendPaths(paths!, patches, inversePatches);
      }
      return result;
    },
    delete(_key: any) {
      const index = patches ? Array.from(state.keys()).indexOf(_key) : null;
      const _value = inversePatches ? state.get(_key) : null;
      const result = Map.prototype.delete.call(state, _key);
      if (!target.original.has(_key)) {
        target.operated.delete(_key);
      } else {
        target.operated.add(_key);
      }
      patches?.push([[DraftType.Map, MapOperation.Delete], [[index!]], []]);
      inversePatches?.unshift([
        [DraftType.Map, MapOperation.Set],
        [[index!]],
        [_key, current(_value)],
      ]);
      const paths = makeChange(target, patches && inversePatches && [[]]);
      if (patches && inversePatches) {
        appendPaths(paths!, patches, inversePatches);
      }
      return result;
    },
    get(_key: any): any {
      ensureShallowCopy(target);
      const value = target.copy!.get(_key);
      if (
        assignedSet.has(value) ||
        target.hook?.(value, dataTypes) === dataTypes.mutable
      ) {
        return value;
      }
      if (isDraftable(value, target) && !getProxyDraft(value)) {
        const currentDraft = createDraft({
          original: target.original.get(_key),
          parentDraft: target,
          key: Array.from(target.copy!.keys()).indexOf(_key),
          patches,
          inversePatches,
          finalities: target.finalities,
          hook: target.hook,
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
