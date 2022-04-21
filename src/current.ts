import { getProxyDraft } from './utils';

export function current<T extends object>(target: T): T {
  const proxyDraft = getProxyDraft(target);
  if (proxyDraft) {
    // TODO: implement
    // copy value and finalize draft
    // const copy = shallowCopy(proxyDraft);
    // set value and current();
    // return copy;
  }
  return target;
}
