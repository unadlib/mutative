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
  original: any;
  copy: Record<string | symbol, any> | null;
  parent: ProxyDraft;
  proxy: ProxyDraft | null;
  key?: string | symbol;
}

const enum Operation {
  Add,
  Remove,
  Replace,
}

type Patches = [Operation, (string | number | symbol)[], any][];

const PROXY_DRAFT: unique symbol = Symbol("proxyDraft");
const proxiesMap = new WeakMap<object, ProxyDraft>();

function has(thing: any, prop: PropertyKey): boolean {
  return Object.prototype.hasOwnProperty.call(thing, prop);
}

function getDescriptor(
  state: any,
  key: PropertyKey
): PropertyDescriptor | undefined {
  if (key in state) {
    let prototype = Reflect.getPrototypeOf(state);
    while (prototype) {
      const descriptor = Reflect.getOwnPropertyDescriptor(prototype, key);
      if (descriptor) return descriptor;
      prototype = Reflect.getPrototypeOf(prototype);
    }
  }
}

function createGetter(patches?: Patches, inversePatches?: Patches) {
  return function get(target: ProxyDraft, key: string | symbol, receiver: any) {
    if (key === PROXY_DRAFT) return target;
    target.copy ??= { ...target.original };
    const state = target.copy!;
    const value = state[key];
    if (!has(state, key)) {
      return getDescriptor(state, key)?.value;
    }
    if (typeof value === "object" && !isProxyDraft(value)) {
      const proxyDraft = proxiesMap.get(value);
      if (!proxyDraft) {
        target.copy![key] = createDraft({
          original: value,
          parentDraft: target,
          key,
          patches,
          inversePatches,
        });
        return target.copy![key];
      } else {
        return proxyDraft;
      }
    }
    return value;
  };
}

function isProxyDraft<T extends { [PROXY_DRAFT]: any }>(value: {
  [PROXY_DRAFT]: any;
}) {
  return !!(value && value[PROXY_DRAFT]);
}

function getValue<T extends { [PROXY_DRAFT]: any }>(value: {
  [PROXY_DRAFT]: any;
}) {
  const proxyDraft: ProxyDraft = value[PROXY_DRAFT];
  proxyDraft.copy ??= { ...proxyDraft.original };
  return proxyDraft.proxy;
}

function createSetter(patches?: Patches, inversePatches?: Patches) {
  return function set(target: ProxyDraft, key: string, value: any) {
    if (!target.updated) {
      target.copy ??= { ...target.original };
      target.assigned = {};
    }
    const previousState = target.copy![key];
    target.copy![key] = isProxyDraft(value) ? getValue(value) : value;
    target.assigned![key] = true;
    target.updated = true;
    patches?.push([Operation.Add, [key], value]);
    inversePatches?.push([Operation.Add, [key], previousState]);
    makeChange(target, patches, inversePatches);
    return true;
  };
}

function latest(proxyDraft: ProxyDraft): any {
  return proxyDraft.copy || proxyDraft.original;
}

function createDraft<T extends object>({
  original,
  parentDraft,
  key,
  patches,
  inversePatches,
}: {
  original: T;
  parentDraft?: any;
  key?: string | symbol;
  patches?: Patches;
  inversePatches?: Patches;
}): T {
  const proxyDraft: ProxyDraft = {
    type: DraftType.Object,
    finalized: false,
    updated: false,
    assigned: null,
    parent: parentDraft,
    original,
    copy: null,
    proxy: null,
    key,
  };
  const { proxy, revoke } = Proxy.revocable<any>(proxyDraft, {
    get: createGetter(patches, inversePatches),
    set: createSetter(patches, inversePatches),
    has(proxyDraft, prop) {
      return prop in latest(proxyDraft);
    },
    ownKeys(proxyDraft) {
      return Reflect.ownKeys(latest(proxyDraft));
    },
    getOwnPropertyDescriptor(proxyDraft, key) {
      const owner = latest(proxyDraft);
      const desc = Reflect.getOwnPropertyDescriptor(owner, key);
      if (!desc) return desc;
      return {
        writable: true,
        configurable: proxyDraft.type !== DraftType.Array || key !== "length",
        enumerable: desc.enumerable,
        value: owner[key],
      };
    },
    getPrototypeOf(proxyDraft) {
      return Reflect.getPrototypeOf(proxyDraft.original);
    },
  });
  proxyDraft.proxy = proxy;
  proxiesMap.set(original, proxy);
  return proxy;
}

function makeChange(
  proxyDraft: ProxyDraft,
  patches?: Patches,
  inversePatches?: Patches
) {
  if (proxyDraft.parent) {
    proxyDraft.parent.updated = true;
    proxyDraft.parent.copy ??= { ...proxyDraft.parent.original };
    if (proxyDraft.key) {
      if (patches) {
        const [last] = patches.slice(-1);
        last[1].unshift(proxyDraft.key);
      }
      if (inversePatches) {
        const [last] = inversePatches.slice(-1);
        last[1].unshift(proxyDraft.key);
      }
      proxyDraft.parent.copy![proxyDraft.key] = proxyDraft.copy;
    }
    if (proxyDraft.parent.parent) {
      makeChange(proxyDraft.parent.parent);
    }
  }
}

function finalizeDraft<T>(result: T) {
  const proxyDraft: ProxyDraft = (result as any)[PROXY_DRAFT];
  if (!proxyDraft.updated) return proxyDraft.original;
  Object.keys(proxyDraft.copy!).forEach((key) => {
    if (isProxyDraft(proxyDraft.copy![key])) {
      proxyDraft.copy![key] = finalizeDraft(proxyDraft.copy![key]);
    }
  })
  return proxyDraft.copy;
}

type Result<T, O extends boolean> = O extends true
? { state: T; patches: Patches; inversePatches: Patches }
: { state: T; patches: undefined; inversePatches: undefined };

export function create<T extends object, O extends boolean = false>(
  initialState: T,
  mutate: (draftState: T) => void,
  options?: {
    enablePatches?: O;
  }
) {
  let patches: Patches | undefined;
  let inversePatches: Patches | undefined;
  if (options?.enablePatches) {
    patches = [];
    inversePatches = [];
  }
  const draftState = createDraft({
    original: initialState,
    parentDraft: null,
    patches,
    inversePatches,
  });
  mutate(draftState);
  const state = finalizeDraft(draftState) as T;
  return {
    state,
    patches,
    inversePatches,
  } as Result<T, O>;
}
