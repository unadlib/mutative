import type { ProxyDraft, Patches } from '../interface';
import { ensureShallowCopy } from './copy';

export function makeChange(proxyDraft: ProxyDraft, path: any[]) {
  const paths: any[][] = [];
  proxyDraft.parents.forEach((parent, key) => {
    if (!proxyDraft.operated.size) {
      parent.operated.delete(key);
    } else if (typeof key !== 'undefined' && key !== null) {
      parent.operated.add(
        parent.copy instanceof Map || parent.copy instanceof Set
          ? Array.from(parent.copy.keys())[key as any]
          : key
      );
    } else {
      //
    }
    ensureShallowCopy(parent);
    if (parent.parents.size > 0) {
      paths.push(
        ...makeChange(
          parent,
          path.map((i) => [key, ...i])
        )
      );
    } else {
      paths.push(...path.map((i) => [key, ...i]));
    }
  });
  if (!proxyDraft.parents.size) {
    return [[]];
  }
  return paths;
}
