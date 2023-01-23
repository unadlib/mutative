import { DraftType, ProxyDraft } from '../interface';
import { ensureShallowCopy } from './copy';
import { get, getProxyDraft, isDraft, isDraftable, set } from './draft';
import { forEach } from './forEach';

export function handleValue(target: any, handledSet: WeakSet<any>) {
  if (
    isDraft(target) ||
    !isDraftable(target) ||
    handledSet.has(target) ||
    Object.isFrozen(target)
  )
    return;
  const isSet = target instanceof Set;
  const setMap: Map<any, any> | undefined = isSet ? new Map() : undefined;
  handledSet.add(target);
  forEach(target, (key, value) => {
    if (isDraft(value)) {
      const proxyDraft = getProxyDraft(value)!;
      ensureShallowCopy(proxyDraft);
      const updatedValue = proxyDraft.assignedMap!.size
        ? proxyDraft.copy
        : proxyDraft.original;
      if (isSet) {
        setMap!.set(key, updatedValue);
      } else {
        set(target, key, updatedValue);
      }
    } else {
      handleValue(value, handledSet);
    }
  });
  if (setMap) {
    const set = target as Set<any>;
    const values = Array.from(set);
    set.clear();
    values.forEach((value) => {
      set.add(setMap!.has(value) ? setMap!.get(value) : value);
    });
  }
}

export function finalizeAssigned(proxyDraft: ProxyDraft, key: PropertyKey) {
  // handle the draftable assigned values， and the value is not a draft
  const copy =
    proxyDraft.type === DraftType.Set ? proxyDraft.setMap : proxyDraft.copy;
  if (
    proxyDraft.finalities.revoke.length > 1 &&
    proxyDraft.assignedMap!.get(key) &&
    copy
  ) {
    handleValue(get(copy, key), proxyDraft.finalities.handledSet);
  }
}
