// import type { ProxyDraft } from './interface';
// import { CLEAR, dataTypes, DraftType, SetOperation } from './constant';
// import {
//   getProxyDraft,
//   isDraftable,
//   latest,
//   markChanged,
// } from './utils';
// import { createDraft } from './draft';

// export const mutableSetMethods = [
//   'has',
//   'add',
//   'delete',
//   'clear',
//   'entries',
//   'forEach',
//   'size',
//   'values',
//   'keys',
//   Symbol.iterator,
// ];

// export function createSetHandler({
//   target,
//   key,
//   state,
// }: {
//   target: ProxyDraft<Set<any>>;
//   key: string | symbol;
//   state: Set<any>;
// }) {
//   if (key === 'size') {
//     return latest(target).size;
//   }
//   const proxyProto = {
//     add(value: any) {
//       const result = Set.prototype.add.call(state, value);
//       if (
//         target.original.has(value) &&
//         Array.from(target.original.values()).slice(-1)[0] === value
//       ) {
//         target.operated.delete(value);
//       } else {
//         target.operated.add(value);
//       }
//       if (isDraftable(value, target)) {
//         target.assignedMap.set(value, true);
//       }
//       markChanged(target);
//       return result;
//     },
//     clear() {
//       const result = Set.prototype.clear.call(state);
//       if (!target.original.size) {
//         target.operated.delete(CLEAR);
//       } else {
//         target.operated.add(CLEAR);
//       }
//       markChanged(target);
//       return result;
//     },
//     delete(value: any) {
//       const deleteValue = getProxyDraft(value)
//         ? getProxyDraft(value)?.original
//         : value;
//       const result = Set.prototype.delete.call(state, deleteValue);
//       if (target.setMap!.has(value)) target.setMap!.delete(value);
//       if (!target.original.has(value)) {
//         target.operated.delete(value);
//       } else {
//         target.operated.add(value);
//       }
//       markChanged(target);
//       return result;
//     },
//     has(value: any): boolean {
//       if (latest(target).has(value)) return true;
//       for (const item of target.setMap?.values()!) {
//         if (
//           item.copy === value ||
//           item.original === value ||
//           item.proxy === value
//         )
//           return true;
//       }
//       return false;
//     },
//     forEach(
//       this: Set<any>,
//       callback: (value: any, key: any, self: Set<any>) => void,
//       thisArg?: any
//     ) {
//       for (const value of this.values()) {
//         callback.call(thisArg, value, value, this);
//       }
//     },
//     keys(): IterableIterator<any> {
//       return this.values();
//     },
//     values(): IterableIterator<any> {
//       const iterator = target.copy!.values();
//       return {
//         [Symbol.iterator]: () => this.values(),
//         next: () => {
//           const iteratorResult = iterator.next();
//           if (iteratorResult.done) return iteratorResult;
//           const original = iteratorResult.value;
//           if (
//             target.assignedMap.has(original) ||
//             target.marker?.(original, dataTypes) === dataTypes.mutable
//           ) {
//             return {
//               done: false,
//               value: original,
//             };
//           }
//           let proxyDraft = target.setMap!.get(original);
//           if (isDraftable(original, target) && !proxyDraft) {
//             const key = Array.from(target.original.values()).indexOf(original);
//             const proxy = createDraft({
//               original,
//               parentDraft: target,
//               key,
//               finalities: target.finalities,
//               marker: target.marker,
//             });
//             proxyDraft = getProxyDraft(proxy)!;
//             target.setMap!.set(original, proxyDraft);
//           }
//           const value = proxyDraft?.proxy;
//           return {
//             done: false,
//             value,
//           };
//         },
//       };
//     },
//     entries(): IterableIterator<[any, any]> {
//       const iterator = target.copy!.entries();
//       return {
//         [Symbol.iterator]: () => this.entries(),
//         next: () => {
//           const iteratorResult = iterator.next();
//           if (iteratorResult.done) return iteratorResult;
//           const original = iteratorResult.value[0];
//           if (
//             target.assignedMap.has(original) ||
//             target.marker?.(original, dataTypes) === dataTypes.mutable
//           ) {
//             return {
//               done: false,
//               value: [original, original],
//             };
//           }
//           let proxyDraft = target.setMap!.get(original);
//           if (isDraftable(original, target) && !proxyDraft) {
//             const key = Array.from(target.original.values()).indexOf(original);
//             const proxy = createDraft({
//               original,
//               parentDraft: target,
//               key,
//               finalities: target.finalities,
//               marker: target.marker,
//             });
//             proxyDraft = getProxyDraft(proxy)!;
//             target.setMap!.set(original, proxyDraft);
//           }
//           const value = proxyDraft?.proxy;
//           return {
//             done: false,
//             value: [value, value],
//           };
//         },
//       };
//     },
//     [Symbol.iterator]() {
//       return this.values();
//     },
//   };
//   // TODO: refactor for better performance
//   return proxyProto[key as keyof typeof proxyProto].bind(proxyProto);
// }
