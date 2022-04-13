import type { Patches, ProxyDraft } from './interface';
import { Operation } from './constant';
import { getProxyDraft, isDraftable, latest, makeChange } from './utils';
import { createDraft } from './draft';

export const mutableSetMethods = [
  'has',
  'add',
  'delete',
  'clear',
  'entries',
  'forEach',
  'size',
  'values',
  'keys',
  Symbol.iterator,
];

export function createSetHandler({
  target,
  key,
  state,
  finalities,
  proxiesMap,
  patches,
  inversePatches,
  mutableFilter,
}: {
  target: ProxyDraft;
  key: string | symbol;
  state: any;
  finalities: (() => void)[];
  proxiesMap: WeakMap<object, ProxyDraft>;
  patches?: Patches;
  inversePatches?: Patches;
  mutableFilter?: (target: any) => boolean;
}) {
  if (key === 'size') {
    return latest(target).size;
  }
  const proxyProto = {
    add(value: any) {
      const result = Set.prototype.add.call(state, value);
      target.operated.add(key);
      patches?.push([Operation.Set, [key], [value]]);
      inversePatches?.push([Operation.Delete, [key], [value]]);
      makeChange(target, patches, inversePatches);
      return result;
    },
    clear() {
      const result = Set.prototype.clear.call(state);
      target.operated.add(key);
      patches?.push([Operation.Clear, [key], []]);
      inversePatches?.push([Operation.Construct, [key], [state.values()]]);
      makeChange(target, patches, inversePatches);
      return result;
    },
    delete(value: any) {
      const result = Set.prototype.delete.call(state, value);
      target.operated.add(key);
      patches?.push([Operation.Delete, [key], [value]]);
      inversePatches?.push([Operation.Set, [key], [value]]);
      makeChange(target, patches, inversePatches);
      return result;
    },
    has(value: any): boolean {
      if (latest(target).has(value)) return true;
      for (const item of target.setMap?.values()!) {
        if (
          item.copy === value ||
          item.original === value ||
          item.proxy === value
        )
          return true;
      }
      return false;
    },
    forEach(
      this: Set<any>,
      callback: (value: any, key: any, self: Set<any>) => void,
      thisArg?: any
    ) {
      for (const value of this.values()) {
        callback.call(thisArg, value, value, this);
      }
    },
    keys(): IterableIterator<any> {
      return this.values();
    },
    values(): IterableIterator<any> {
      const iterator = target.copy!.values();
      return {
        [Symbol.iterator]: () => this.values(),
        next: () => {
          const iteratorResult = iterator.next();
          if (iteratorResult.done) return iteratorResult;
          const original = iteratorResult.value;
          if (mutableFilter?.(original)) {
            return {
              done: false,
              value: original,
            };
          }
          let proxyDraft = target.setMap!.get(original);
          if (isDraftable(original) && !proxyDraft) {
            const key = Array.from(target.original.values())
              .indexOf(original)
              .toString();
            const proxy = createDraft({
              original,
              parentDraft: target,
              key,
              patches,
              inversePatches,
              finalities,
              proxiesMap,
              mutableFilter,
            });
            proxyDraft = getProxyDraft(proxy)!;
            target.setMap!.set(original, proxyDraft);
          }
          const value = proxyDraft?.proxy;
          return {
            done: false,
            value,
          };
        },
      };
    },
    entries(): IterableIterator<[any, any]> {
      const iterator = target.copy!.entries();
      return {
        [Symbol.iterator]: () => this.entries(),
        next: () => {
          const iteratorResult = iterator.next();
          if (iteratorResult.done) return iteratorResult;
          const original = iteratorResult.value[0];
          if (mutableFilter?.(original)) {
            return {
              done: false,
              value: [original, original],
            };
          }
          let proxyDraft = target.setMap!.get(original);
          if (isDraftable(original) && !proxyDraft) {
            const key = Array.from(target.original.values())
              .indexOf(original)
              .toString();
            const proxy = createDraft({
              original,
              parentDraft: target,
              key,
              patches,
              inversePatches,
              finalities,
              proxiesMap,
              mutableFilter,
            });
            proxyDraft = getProxyDraft(proxy)!;
            target.setMap!.set(original, proxyDraft);
          }
          const value = proxyDraft?.proxy;
          return {
            done: false,
            value: [value, value],
          };
        },
      };
    },
    [Symbol.iterator]() {
      return this.values();
    },
  };
  // TODO: refactor for better performance
  return proxyProto[key as keyof typeof proxyProto].bind(proxyProto);
}
