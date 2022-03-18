const enum DraftType {
  Object = "object",
  Array = "array",
  Map = "map",
  Set = "set",
}

interface ProxyDraft {
  type: DraftType;
  updated: boolean;
  finalized: boolean;
  assigned: Record<string | symbol, any> | null;
  current: any;
  copy: Record<string | symbol, any> | null;
  parent: ProxyDraft;
  proxy: ProxyDraft | null;
  key: string | symbol | null;
}

const PROXY_DRAFT: unique symbol = Symbol("proxyDraft");
const proxiesMap = new WeakMap<object, ProxyDraft>();
let patches: [1 | 2 | 3, (string | number | symbol)[], any][];

function get(target: ProxyDraft, key: string | symbol, receiver: any) {
  if (key === PROXY_DRAFT) return target;
  target.copy ??= { ...target.current };
  const state = target.copy!;
  const value = state[key];
  if (typeof value === "object") {
    const proxyDraft = proxiesMap.get(value);
    if (!proxyDraft) {
      target.key = key;
      target.copy![key] = createDraft(value, target);
      return target.copy![key];
    } else {
      return proxyDraft;
    }
  }
  return value;
}

function isProxyDraft<T extends { [PROXY_DRAFT]: any }>(value: {
  [PROXY_DRAFT]: any;
}) {
  return value && value[PROXY_DRAFT];
}

function getCopyValue<T extends { [PROXY_DRAFT]: any }>(value: {
  [PROXY_DRAFT]: any;
}) {
  const proxyDraft: ProxyDraft = value[PROXY_DRAFT];
  proxyDraft.copy ??= { ...proxyDraft.current };
  return proxyDraft.copy;
}

function set(target: ProxyDraft, key: string, value: any) {
  if (!target.updated) {
    target.copy ??= { ...target.current };
    target.assigned = {};
  }
  target.key = key;
  target.copy![key] = isProxyDraft(value) ? getCopyValue(value) : value;
  target.assigned![key] = true;
  patches ??= []; 
  patches.push([1, [key], value]);
  makeChange(target.parent, target.copy);
  return true;
}

function ownKeys(target: object) {
  return Reflect.ownKeys(target);
}

function has(target: object, key: string | symbol) {
  return Reflect.has(target, key);
}

function createDraft<T extends object>(current: T, parentDraft?: any): T {
  const proxyDraft: ProxyDraft = {
    type: DraftType.Object,
    finalized: false,
    updated: false,
    assigned: null,
    parent: parentDraft,
    current,
    copy: null,
    proxy: null,
    key: null,
  };
  const { proxy, revoke } = Proxy.revocable<any>(proxyDraft, {
    get,
    set,
  });
  proxyDraft.proxy = proxy;
  proxiesMap.set(current, proxy);
  return proxy;
}

function makeChange(proxyDraftParent: ProxyDraft, copy?: any) {
  if (proxyDraftParent) {
    proxyDraftParent.copy ??= { ...proxyDraftParent.current };
    if (proxyDraftParent.key) {
      patches.slice(-1)[0][1].unshift(proxyDraftParent.key);
      proxyDraftParent.copy![proxyDraftParent.key] = copy;
    }
    if (proxyDraftParent.parent) {
      makeChange(proxyDraftParent.parent, proxyDraftParent.copy);
    }
  }
}

function finalizeDraft<T>(result: T) {
  const proxyDraft: ProxyDraft = (result as any)[PROXY_DRAFT];
  return proxyDraft.copy;
}

export function create<T extends object>(
  initialState: T,
  mutate: (draftState: T) => void
): T {
  const draftState = createDraft(initialState);
  mutate(draftState);
  return finalizeDraft(draftState) as T;
}
