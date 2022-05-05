import type { ProxyDraft, Patches } from '../interface';
import { ensureShallowCopy } from './copy';

export function makeChange(proxyDraft: ProxyDraft, path?: any[]) {
  const paths: any[][] | null = path ? [] : null;
  proxyDraft.parents.forEach((parent, key) => {
    const currentKey =
      parent.copy instanceof Map || parent.copy instanceof Set
        ? Array.from(parent.copy.keys())[key as number]
        : key;
    // for set a diff draft
    const currentValue =
      parent.copy instanceof Map
        ? parent.copy.get(currentKey)
        : parent.copy instanceof Set
        ? parent.setMap!.get(currentKey)?.proxy ?? currentKey
        : parent.copy[key];
    if (currentValue !== proxyDraft.proxy) {
      return;
    }
    if (!proxyDraft.operated.size) {
      parent.operated.delete(currentKey);
    } else if (typeof key !== 'undefined' && key !== null) {
      parent.operated.add(currentKey);
    } else {
      //
    }
    ensureShallowCopy(parent);
    if (parent.parents.size > 0) {
      const _paths = makeChange(
        parent,
        path?.map((i) => [key, ...i])
      );
      paths?.push(..._paths!);
    } else {
      paths?.push(...path!.map((i) => [key, ...i]));
    }
  });
  if (!proxyDraft.parents.size) {
    return [[]];
  }
  return paths;
}
