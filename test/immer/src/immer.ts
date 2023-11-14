import { rawReturn, create, isDraft, isDraftable, apply } from '../../../src';
import { getType as getArchtype, forEach as each } from '../../../src/utils';

export { forEach as each } from '../../../src/utils';

let enableAutoFreeze = true;

let strict = false;

export const setUseStrictShallowCopy = (value: boolean) => {
  strict = value;
};

export const assert = () => {};

export const produce = (base: any, recipe: any, patchListener: any) => {
  if (patchListener) {
    const [state, patches, inversePatches] = create(base, recipe, {
      enableAutoFreeze,
      enablePatches: true,
      mark: (target) => {
        if (
          target &&
          (target[immerable] ||
            Object.getPrototypeOf(target)?.constructor[immerable])
        ) {
          return 'immutable';
        }
        if (strict) {
          return 'immutable';
        }
      },
    });
    patchListener(patches, inversePatches);
    return state;
  }
  return create(base, recipe, {
    enableAutoFreeze,
    mark: (target) => {
      if (
        target &&
        (target[immerable] ||
          Object.getPrototypeOf(target)?.constructor[immerable])
      ) {
        return 'immutable';
      }
      if (strict) {
        return 'immutable';
      }
    },
  });
};

export class Immer {
  constructor(config: any) {
    setUseStrictShallowCopy(config?.useStrictShallowCopy ?? false);
    setAutoFreeze(config?.autoFreeze ?? true);
  }

  produce(base: any, recipe: any, patchListener: any) {
    return produce(base, recipe, patchListener);
  }

  produceWithPatches(base: any, recipe: any) {
    return produceWithPatches(base, recipe);
  }
}

export const immerable = Symbol.for('immerable');

export const nothing = rawReturn(undefined);

export {
  original,
  isDraft,
  type Draft,
  isDraftable,
  type Immutable,
  castImmutable,
  current,
  castDraft,
} from '../../../src';

export const applyPatches = (base: any, patches: any) =>
  apply(base, patches);

export const enablePatches = () => {};

export const enableMapSet = () => {};

export const setAutoFreeze = (value: boolean) => {
  enableAutoFreeze = value;
};

export const produceWithPatches = (base: any, recipe: any) => {
  if (recipe === undefined) {
    return create(base, {
      enablePatches: true,
      enableAutoFreeze,
      mark: (target) => {
        if (
          target &&
          (target[immerable] ||
            Object.getPrototypeOf(target)?.constructor[immerable])
        ) {
          return 'immutable';
        }
        if (strict) {
          return 'immutable';
        }
      },
    });
  }
  return create(base, recipe, {
    enablePatches: true,
    enableAutoFreeze,
    mark: (target) => {
      if (
        target &&
        (target[immerable] ||
          Object.getPrototypeOf(target)?.constructor[immerable])
      ) {
        return 'immutable';
      }
      if (strict) {
        return 'immutable';
      }
    },
  });
};

export function freeze<T>(obj: any, deep: boolean = false): T {
  if (isFrozen(obj) || isDraft(obj) || !isDraftable(obj)) return obj;
  if (getArchtype(obj) > 1 /* Map or Set */) {
    obj.set =
      obj.add =
      obj.clear =
      obj.delete =
        dontMutateFrozenCollections as any;
  }
  Object.freeze(obj);
  if (deep) each(obj, (_key, value) => freeze(value, true));
  return obj;
}

function dontMutateFrozenCollections() {
  throw new Error('This object has been frozen and should not be mutated');
}

function isFrozen(obj: any): boolean {
  return Object.isFrozen(obj);
}

export const DRAFT_STATE = Symbol.for('immer-state');

export function isMap(target: any) {
  return target instanceof Map;
}

export function isSet(target: any) {
  return target instanceof Set;
}

const objectCtorString = Object.prototype.constructor.toString();

export function isPlainObject(value: any): boolean {
  if (!value || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  if (proto === null) {
    return true;
  }
  const Ctor =
    Object.hasOwnProperty.call(proto, 'constructor') && proto.constructor;

  if (Ctor === Object) return true;

  return (
    typeof Ctor === 'function' &&
    Function.toString.call(Ctor) === objectCtorString
  );
}

export function shallowCopy(base: any, strict: boolean) {
  if (isMap(base)) {
    return new Map(base);
  }
  if (isSet(base)) {
    return new Set(base);
  }
  if (Array.isArray(base)) return Array.prototype.slice.call(base);

  if (!strict && isPlainObject(base)) {
    if (!Object.getPrototypeOf(base)) {
      const obj = Object.create(null);
      return Object.assign(obj, base);
    }
    return { ...base };
  }

  const descriptors = Object.getOwnPropertyDescriptors(base);
  delete descriptors[DRAFT_STATE as any];
  let keys = Reflect.ownKeys(descriptors);
  for (let i = 0; i < keys.length; i++) {
    const key: any = keys[i];
    const desc = descriptors[key];
    if (desc.writable === false) {
      desc.writable = true;
      desc.configurable = true;
    }
    // like object.assign, we will read any _own_, get/set accessors. This helps in dealing
    // with libraries that trap values, like mobx or vue
    // unlike object.assign, non-enumerables will be copied as well
    if (desc.get || desc.set)
      descriptors[key] = {
        configurable: true,
        writable: true, // could live with !!desc.set as well here...
        enumerable: desc.enumerable,
        value: base[key],
      };
  }
  return Object.create(Object.getPrototypeOf(base), descriptors);
}

export const createDraft = (state: any) => {
  const [draft, finishDraft] = create(state, {
    enablePatches: true,
    enableAutoFreeze,
    mark: (target) => {
      if (
        target &&
        (target[immerable] ||
          Object.getPrototypeOf(target)?.constructor[immerable])
      ) {
        return 'immutable';
      }
      if (strict) {
        return 'immutable';
      }
    },
  });
  return [
    draft,
    (a: any, b: any) => {
      const state = finishDraft();
      if (b) {
        b(state[1], state[2]);
      }
      return state[0];
    },
  ];
};
