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
}

const PROXY_DRAFT: unique symbol = Symbol("proxyDraft");
const proxiesMap = new WeakMap<object, ProxyDraft>();
let changedSet: WeakSet<object>;

function get(target: ProxyDraft, key: string | symbol, receiver: any) {
  if (key === PROXY_DRAFT) return target;
  const state = target.copy ?? target.current;
  const value = state[key];
  if (typeof value === "object") {
    const proxyDraft = proxiesMap.get(value);
    if (!proxiesMap.get(value)) {
      return createDraft(value, target);
    } else {
      return proxyDraft;
    }
  }
  return value;
}

function set(target: ProxyDraft, key: string | symbol, value: any) {
  if (!target.updated) {
    target.copy = { ...target.current };
    target.assigned = {};
    markChanged(target);
  }
  target.copy![key] = value;
  target.assigned![key] = true;
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
  };
  const { proxy, revoke } = Proxy.revocable<any>(proxyDraft, {
    get,
    set,
  });
  proxyDraft.proxy = proxy;
  proxiesMap.set(current, proxy);
  return proxy;
}

function markChanged(proxyDraft: ProxyDraft) {
  if (!proxyDraft.updated) {
    proxyDraft.updated = true;
    if (proxyDraft.parent) {
      markChanged(proxyDraft.parent);
    }
  }
}

function finalizeDraft<T>(result: T, property?: string | symbol) {
  const proxyDraft: ProxyDraft = (result as any)[PROXY_DRAFT];
  if (proxyDraft.updated && !proxyDraft.copy) {
    proxyDraft.copy = { ...proxyDraft.current };
  }
  Object.keys(proxyDraft.copy ?? {}).forEach((key) => {
    const subProxyDraft = proxiesMap.get(proxyDraft.current![key]);
    if (subProxyDraft) {
      proxyDraft.copy![key] = finalizeDraft(subProxyDraft, key);
    }
  });
  return proxyDraft.copy;
}

export function create<T extends object>(
  initialState: T,
  mutate: (draftState: T) => void
): T {
  changedSet = new WeakSet();
  const draftState = createDraft(initialState);
  mutate(draftState);
  draftState;
  return finalizeDraft(draftState) as T;
}
