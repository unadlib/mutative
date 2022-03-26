const enum DraftType {
  Object = 'object',
  Array = 'array',
  Map = 'map',
  Set = 'set',
}

const mutableArrayMethods: string[] = [
  // "copyWithin",
  // "fill",
  // "sort",
  'pop',
  'push',
  'reverse',
  'shift',
  'unshift',
  'splice',
];
// Exclude `sort` method: Its argument can be a sort callback, so the operation patch cannot be serialized correctly.

const mutableMapMethods: (keyof Map<any, any>)[] = ['clear', 'delete', 'set'];

const mutableSetMethods: (keyof Set<any>)[] = ['clear', 'delete', 'add'];

const mutableObjectMethods = ['delete', 'set'];

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
  Delete,
  Set,
  Clear,
  Add,
  Pop,
  Push,
  Reverse,
  Shift,
  Splice,
  Unshift,
}

type Patches = [Operation, (string | number | symbol)[], any[]][];

const PROXY_DRAFT: unique symbol = Symbol('proxyDraft');

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

function createGetter({
  proxiesMap,
  finalities,
  patches,
  inversePatches,
}: {
  proxiesMap: WeakMap<object, ProxyDraft>;
  finalities: (() => void)[];
  patches?: Patches;
  inversePatches?: Patches;
}) {
  return function get(target: ProxyDraft, key: string | symbol, receiver: any) {
    if (key === PROXY_DRAFT) return target;
    if (Array.isArray(target.original)) {
      target.copy ??= Array.prototype.concat.call(target.original);
    } else {
      target.copy ??= { ...target.original };
    }
    const state = target.copy!;
    const value = state[key];
    if (!has(state, key)) {
      if (
        Array.isArray(state) &&
        typeof key === 'string' &&
        mutableArrayMethods.includes(key)
      ) {
        return {
          pop() {
            if (!target.updated) {
              target.assigned = {};
            }
            const result = Array.prototype.pop.apply(state);
            target.updated = true;
            const [last] = state.slice(-1);
            patches?.push([Operation.Pop, [key], []]);
            inversePatches?.push([Operation.Push, [key], [last]]);
            makeChange(target, patches, inversePatches);
            return result;
          },
          push(...args: any[]) {
            if (!target.updated) {
              target.assigned = {};
            }
            const result = Array.prototype.push.apply(state, args);
            target.assigned![key] = true;
            target.updated = true;
            patches?.push([Operation.Push, [key], args]);
            inversePatches?.push([
              Operation.Shift,
              [key],
              [state.length, args.length],
            ]);
            makeChange(target, patches, inversePatches);
            return result;
          },
          reverse() {
            if (!target.updated) {
              target.assigned = {};
            }
            const result = Array.prototype.reverse.apply(state);
            target.assigned![key] = true;
            target.updated = true;
            patches?.push([Operation.Reverse, [key], []]);
            inversePatches?.push([Operation.Reverse, [key], []]);
            makeChange(target, patches, inversePatches);
            return result;
          },
          shift() {
            if (!target.updated) {
              target.assigned = {};
            }
            const [first] = state;
            const result = Array.prototype.shift.apply(state);
            target.assigned![key] = true;
            target.updated = true;
            patches?.push([Operation.Shift, [key], []]);
            inversePatches?.push([Operation.Unshift, [key], [first]]);
            makeChange(target, patches, inversePatches);
            return result;
          },
          unshift(...args: any[]) {
            if (!target.updated) {
              target.assigned = {};
            }
            const result = Array.prototype.unshift.apply(state, args);
            target.assigned![key] = true;
            target.updated = true;
            patches?.push([Operation.Unshift, [key], [args]]);
            inversePatches?.push([Operation.Splice, [key], [0, args.length]]);
            makeChange(target, patches, inversePatches);
            return result;
          },
          splice(...args: any) {
            if (!target.updated) {
              target.assigned = {};
            }
            const result = Array.prototype.splice.apply(state, args);
            target.assigned![key] = true;
            target.updated = true;
            patches?.push([Operation.Splice, [key], [args]]);
            // TODO: inverse patches
            // const [startIndex, deleteCount] = args;
            // const count = args.length - 2 - deleteCount;
            // inversePatches?.push([Operation.Splice, [key], [startIndex, , args]]);
            makeChange(target, patches, inversePatches);
            return result;
          },
        }[key];
      }
      return getDescriptor(state, key)?.value;
    }
    if (typeof value === 'object' && !isProxyDraft(value)) {
      const proxyDraft = proxiesMap.get(target.original[key]);
      if (!proxyDraft) {
        target.copy![key] = createDraft({
          original: target.original[key],
          parentDraft: target,
          key,
          patches,
          inversePatches,
          finalities,
          proxiesMap,
        });
        finalities.unshift(() => {
          if (isProxyDraft(target.copy![key])) {
            target.copy![key] = getValue(target.copy![key]);
          }
        });
        return target.copy![key];
      } else {
        // TODO: think about set proxy draft parent key for some key
        // @ts-ignore
        // proxyDraft[PROXY_DRAFT].key = key;
        return proxyDraft;
      }
    }
    return value;
  };
}

function isProxyDraft<T extends { [PROXY_DRAFT]: any }>(value: T) {
  return !!(value && value[PROXY_DRAFT]);
}

function getValue<T extends { [PROXY_DRAFT]: any }>(value: T) {
  const proxyDraft: ProxyDraft = value[PROXY_DRAFT];
  if (!proxyDraft) {
    return value;
  }
  proxyDraft.copy ??= { ...proxyDraft.original };
  return proxyDraft.copy;
}

function createSetter({
  patches,
  inversePatches,
}: {
  patches?: Patches;
  inversePatches?: Patches;
}) {
  return function set(target: ProxyDraft, key: string, value: any) {
    if (!target.updated) {
      if (Array.isArray(target.original)) {
        target.copy ??= Array.prototype.concat.call(target.original);
      } else {
        target.copy ??= { ...target.original };
      }
    }
    const previousState = target.copy![key];
    // TODO: think about set proxy draft parent key for some key
    target.copy![key] = isProxyDraft(value) ? getValue(value) : value;
    target.assigned ??= {};
    target.assigned![key] = true;
    target.updated = true;
    patches?.push([Operation.Set, [key], [value]]);
    if (Array.isArray(target.original)) {
      const numberKey = Number(key);
      if (!isNaN(numberKey) && numberKey >= target.original.length) {
        inversePatches?.push([
          Operation.Set,
          ['length'],
          [target.original.length],
        ]);
      } else {
        inversePatches?.push([Operation.Set, [key], [previousState]]);
      }
    } else {
      inversePatches?.push([Operation.Set, [key], [previousState]]);
    }
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
  finalities,
  proxiesMap,
}: {
  original: T;
  finalities: (() => void)[];
  proxiesMap: WeakMap<object, ProxyDraft>;
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
    get: createGetter({ patches, inversePatches, finalities, proxiesMap }),
    set: createSetter({ patches, inversePatches }),
    has(target: ProxyDraft, key: string | symbol) {
      return key in latest(target);
    },
    ownKeys(target: ProxyDraft) {
      return Reflect.ownKeys(latest(target));
    },
    getOwnPropertyDescriptor(target: ProxyDraft, key: string | symbol) {
      const owner = latest(target);
      const descriptor = Reflect.getOwnPropertyDescriptor(owner, key);
      if (!descriptor) return descriptor;
      return {
        writable: true,
        configurable: target.type !== DraftType.Array || key !== 'length',
        enumerable: descriptor.enumerable,
        value: owner[key],
      };
    },
    getPrototypeOf(target: ProxyDraft) {
      return Reflect.getPrototypeOf(target.original);
    },
    setPrototypeOf(target: ProxyDraft, value: object | null) {
      throw new Error('Cannot set prototype on draft');
    },
    defineProperty(
      target: ProxyDraft,
      key: string | symbol,
      descriptor: PropertyDescriptor
    ) {
      throw new Error('Cannot define property on draft');
    },
    deleteProperty(target: ProxyDraft, key: string | symbol) {
      if (!target.updated) {
        target.copy ??= { ...target.original };
        target.assigned = {};
      }
      const previousState = target.copy![key];
      delete target.copy![key];
      if (target.assigned) {
        delete target.assigned![key];
      }
      target.updated = true;
      patches?.push([Operation.Delete, [key], []]);
      inversePatches?.push([Operation.Set, [key], [previousState]]);
      makeChange(target, patches, inversePatches);
      return true;
    },
  });
  finalities.unshift(revoke);
  proxyDraft.proxy = proxy;
  if (original) {
    proxiesMap.set(original, proxy);
  }
  return proxy;
}

function makeChange(
  proxyDraft: ProxyDraft,
  patches?: Patches,
  inversePatches?: Patches
) {
  if (proxyDraft.parent) {
    proxyDraft.parent.updated = true;
    if (Array.isArray(proxyDraft.parent.original)) {
      proxyDraft.parent.copy ??= Array.prototype.concat.call(
        proxyDraft.parent.original
      );
    } else {
      proxyDraft.parent.copy ??= { ...proxyDraft.parent.original };
    }
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
  } else {
    proxyDraft.updated = true;
  }
}

function finalizeDraft<T>(result: T, finalities: (() => void)[]) {
  const proxyDraft: ProxyDraft = (result as any)[PROXY_DRAFT];
  for (const finalize of finalities) {
    finalize();
  }
  if (!proxyDraft.updated) return proxyDraft.original;
  return proxyDraft.copy;
}

type Result<T, O extends boolean> = O extends true
  ? { state: T; patches: Patches; inversePatches: Patches }
  : { state: T; patches: undefined; inversePatches: undefined };

/**
 * something
 */
export function create<T extends object, O extends boolean = false>(
  initialState: T,
  mutate: (draftState: T) => void,
  options?: {
    enablePatches?: O;
  }
) {
  const proxiesMap = new WeakMap<object, ProxyDraft>();
  const finalities: (() => void)[] = [];
  let patches: Patches | undefined;
  let inversePatches: Patches | undefined;
  if (options?.enablePatches) {
    patches = [];
    inversePatches = [];
  }
  const draftState = createDraft({
    original: initialState,
    proxiesMap,
    parentDraft: null,
    patches,
    inversePatches,
    finalities,
  });
  mutate(draftState);
  const state = finalizeDraft(draftState, finalities) as T;
  return {
    state,
    patches,
    inversePatches,
  } as Result<T, O>;
}
