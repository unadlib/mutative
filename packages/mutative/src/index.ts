const enum DraftType {
  Object = "object",
  Array = "array",
  Map = "map",
  Set = "set",
}

interface ProxyDraft {
  type: DraftType;
  updated: boolean;
  assigned: boolean;
  parent: any;
}

const proxiesMap = new WeakMap<object, object>();
let changedSet: WeakSet<object>;

function get(target: object, key: string | symbol, receiver: any) {
  return Reflect.get(target, key, receiver);
}

function set(target: object, key: string | symbol, value: any) {
  return true;
}

function ownKeys(target: object) {
  return Reflect.ownKeys(target);
}

function has(target: object, key: string | symbol) {
  return Reflect.has(target, key);
}

function createDraft<T>(current: T, parent?: any): T {
  const { proxy, revoke } = Proxy.revocable<any>(current, {
    get,
    set,
  });
  return proxy;
}

function finalizeDraft<T>(result: T) {
  return result;
}

export function create<T extends object>(
  initialState: T,
  mutate: (draftState: T) => void
): T {
  changedSet = new WeakSet();
  const draftState = createDraft(initialState);
  proxiesMap.set(initialState, draftState);
  const result = mutate(draftState) as any;
  return finalizeDraft(result);
}
