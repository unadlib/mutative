import type { Patches, ProxyDraft } from './interface';
import { CLEAR, dataTypes, DraftType, SetOperation } from './constant';
import {
  adjustParentDraft,
  getProxyDraft,
  getValueOrPath,
  isDraftable,
  latest,
  makeChange,
} from './utils';
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
  assignedSet,
  patches,
  inversePatches,
}: {
  target: ProxyDraft<Set<any>>;
  key: string | symbol;
  state: Set<any>;
  assignedSet: WeakSet<any>;
  patches?: Patches;
  inversePatches?: Patches;
}) {
  if (key === 'size') {
    return latest(target).size;
  }
  const proxyProto = {
    add(value: any) {
      const oldIndex = inversePatches
        ? Array.from(state.values()).indexOf(value)
        : null;
      const result = Set.prototype.add.call(state, value);
      if (
        target.original.has(value) &&
        Array.from(target.original.values()).slice(-1)[0] === value
      ) {
        target.operated.delete(value);
      } else {
        target.operated.add(value);
      }
      if (isDraftable(value, target)) {
        assignedSet.add(value);
      }
      if (patches && inversePatches) {
        const index = Array.from(result.values()).indexOf(value);
        adjustParentDraft({
          current: value,
          parent: target,
          key: index,
        });
        patches?.push([
          [DraftType.Set, SetOperation.Add],
          [result.size],
          [getValueOrPath(value)],
        ]);
        inversePatches?.unshift([
          [DraftType.Set, SetOperation.Delete],
          [oldIndex!],
          [],
        ]);
      }
      makeChange(target, patches, inversePatches);
      return result;
    },
    clear() {
      const oldValues = inversePatches ? Array.from(state.values()) : null;
      const result = Set.prototype.clear.call(state);
      if (!target.original.size) {
        target.operated.delete(CLEAR);
      } else {
        target.operated.add(CLEAR);
      }
      patches?.push([[DraftType.Set, SetOperation.Clear], [-1], []]);
      inversePatches?.unshift([
        [DraftType.Set, SetOperation.Construct],
        [-1],
        [oldValues],
      ]);
      makeChange(target, patches, inversePatches);
      return result;
    },
    delete(value: any) {
      const deleteValue = getProxyDraft(value)
        ? getProxyDraft(value)?.original
        : value;
      const oldIndex =
        patches && inversePatches
          ? Array.from(state.values()).indexOf(deleteValue)
          : null;
      const result = Set.prototype.delete.call(state, deleteValue);
      if (target.setMap!.has(value)) target.setMap!.delete(value);
      if (!target.original.has(value)) {
        target.operated.delete(value);
      } else {
        target.operated.add(value);
      }
      patches?.push([[DraftType.Set, SetOperation.Delete], [oldIndex!], []]);
      inversePatches?.unshift([
        [DraftType.Set, SetOperation.Add],
        [oldIndex!],
        [value],
      ]);
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
          if (
            assignedSet.has(original) ||
            target.marker?.(original, dataTypes) === dataTypes.mutable
          ) {
            return {
              done: false,
              value: original,
            };
          }
          let proxyDraft = target.setMap!.get(original);
          if (isDraftable(original, target) && !proxyDraft) {
            const key = Array.from(target.original.values()).indexOf(original);
            const proxy = createDraft({
              original,
              parentDraft: target,
              key,
              patches,
              inversePatches,
              finalities: target.finalities,
              marker: target.marker,
              assignedSet,
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
          if (
            assignedSet.has(original) ||
            target.marker?.(original, dataTypes) === dataTypes.mutable
          ) {
            return {
              done: false,
              value: [original, original],
            };
          }
          let proxyDraft = target.setMap!.get(original);
          if (isDraftable(original, target) && !proxyDraft) {
            const key = Array.from(target.original.values()).indexOf(original);
            const proxy = createDraft({
              original,
              parentDraft: target,
              key,
              patches,
              inversePatches,
              finalities: target.finalities,
              marker: target.marker,
              assignedSet,
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
