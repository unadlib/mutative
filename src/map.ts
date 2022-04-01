import type { Patches, ProxyDraft } from './interface';
import { Operation } from './constant';
import {
  ensureShallowCopy,
  getProxyDraft,
  getValue,
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
];

export function createMapHandler({
  target,
  key,
  state,
  finalities,
  proxiesMap,
  patches,
  inversePatches,
}: {
  target: ProxyDraft;
  key: string;
  state: any;
  finalities: (() => void)[];
  proxiesMap: WeakMap<object, ProxyDraft>;
  patches?: Patches;
  inversePatches?: Patches;
}) {
  if (key === 'size') {
    return latest(target).size;
  }
  const obj = {
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
    get(_key: any): any {
      if (!target.updated) {
        target.assigned = {};
      }
      ensureShallowCopy(target);
      const currentDraft = createDraft({
        original: target.original.get(_key),
        parentDraft: target,
        key: _key,
        patches,
        inversePatches,
        finalities,
        proxiesMap,
      });
      target.copy!.set(_key, currentDraft);
      finalities.unshift(() => {
        const proxyDraft = getProxyDraft(target.copy!.get(_key));
        if (proxyDraft) {
          const value =
            proxyDraft.updated &&
            Object.keys(proxyDraft.assigned ?? {}).length > 0
              ? getValue(target.copy!.get(_key))
              : proxyDraft.original;
          target.copy!.set(_key, value);
        }
      });
      return currentDraft;
    },
    has(key: any): boolean {
      return latest(target).has(key);
    },
    forEach(
      this: Map<any, any>,
      callback: (value: any, key: any, self: Map<any, any>) => void,
      thisArg?: any
    ) {
      latest(target).forEach((_: any, key: any) => {
        callback.call(thisArg, this.get(key), key, this);
      });
    },
    keys(): IterableIterator<any> {
      return latest(target).keys();
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
  // @ts-ignore
  return obj[key].bind(obj);
}
