// import type { ProxyDraft } from './interface';
// import { CLEAR, dataTypes } from './constant';
// import {
//   ensureDraftValue,
//   ensureShallowCopy,
//   getProxyDraft,
//   getValue,
//   isDraftable,
//   latest,
//   makeChange,
// } from './utils';
// import { createDraft } from './draft';

// export const mutableMapMethods = [
//   'get',
//   'set',
//   'has',
//   'delete',
//   'clear',
//   'entries',
//   'forEach',
//   'keys',
//   'size',
//   'values',
//   Symbol.iterator,
// ];

// export function createMapHandler({
//   target,
//   key,
//   state,
// }: {
//   target: ProxyDraft<Map<any, any>>;
//   key: string | symbol;
//   state: Map<any, any>;
// }) {
//   if (key === 'size') {
//     return latest<Map<any, any>>(target).size;
//   }
//   const proxyProto = {
//     set(_key: any, _value: any) {
//       const result = Map.prototype.set.call(state, _key, _value);
//       if (target.original.has(_key) && target.original.get(_key) === _value) {
//         target.operated.delete(_key);
//       } else {
//         target.operated.add(_key);
//       }
//       if (isDraftable(_value, target)) {
//         target.assignedMap.set(_value, true);
//       }
//       ensureDraftValue(target, _key, _value);
//       makeChange(target);
//       return result;
//     },
//     clear() {
//       const result = Map.prototype.clear.call(state);
//       if (!target.original.size) {
//         target.operated.delete(CLEAR);
//       } else {
//         target.operated.add(CLEAR);
//       }
//       makeChange(target);
//       return result;
//     },
//     delete(_key: any) {
//       const result = Map.prototype.delete.call(state, _key);
//       if (!target.original.has(_key)) {
//         target.operated.delete(_key);
//       } else {
//         target.operated.add(_key);
//       }
//       makeChange(target);
//       return result;
//     },
//     get(_key: any): any {
//       ensureShallowCopy(target);
//       const value = target.copy!.get(_key);
//       if (
//         target.assignedMap.has(value) ||
//         target.marker?.(value, dataTypes) === dataTypes.mutable
//       ) {
//         return value;
//       }
//       if (isDraftable(value, target) && !getProxyDraft(value)) {
//         const currentDraft = createDraft({
//           original: target.original.get(_key),
//           parentDraft: target,
//           key: Array.from(target.copy!.keys()).indexOf(_key),
//           finalities: target.finalities,
//           marker: target.marker,
//         });
//         target.copy!.set(_key, currentDraft);
//         target.finalities.draft.unshift(() => {
//           const proxyDraft = getProxyDraft(target.copy!.get(_key));
//           if (proxyDraft) {
//             const value =
//               proxyDraft.operated.size > 0
//                 ? getValue(target.copy!.get(_key))
//                 : proxyDraft.original;
//             target.copy!.set(_key, value);
//           }
//         });
//         return currentDraft;
//       }
//       return value;
//     },
//     has(key: any): boolean {
//       return latest<Map<any, any>>(target).has(key);
//     },
//     forEach(
//       this: Map<any, any>,
//       callback: (value: any, key: any, self: Map<any, any>) => void,
//       thisArg?: any
//     ) {
//       latest<Map<any, any>>(target).forEach((value: any, key: any) => {
//         callback.call(thisArg, this.get(key), key, this);
//       });
//     },
//     keys(): IterableIterator<any> {
//       return latest<Map<any, any>>(target).keys();
//     },
//     values(): IterableIterator<any> {
//       const iterator = this.keys();
//       return {
//         [Symbol.iterator]: () => this.values(),
//         next: () => {
//           const iteratorResult = iterator.next();
//           if (iteratorResult.done) return iteratorResult;
//           const value = this.get(iteratorResult.value);
//           return {
//             done: false,
//             value,
//           };
//         },
//       };
//     },
//     entries(): IterableIterator<[any, any]> {
//       const iterator = this.keys();
//       return {
//         [Symbol.iterator]: () => this.entries(),
//         next: () => {
//           const iteratorResult = iterator.next();
//           if (iteratorResult.done) return iteratorResult;
//           const value = this.get(iteratorResult.value);
//           return {
//             done: false,
//             value: [iteratorResult.value, value],
//           };
//         },
//       };
//     },
//     [Symbol.iterator]() {
//       return this.entries();
//     },
//   };
//   // TODO: refactor for better performance
//   return proxyProto[key as keyof typeof proxyProto].bind(proxyProto);
// }
