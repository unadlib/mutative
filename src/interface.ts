import { dataTypes } from './constant';

export const enum DraftType {
  Object,
  Array,
  Map,
  Set,
}

export const Operation = {
  Remove: 'remove',
  Replace: 'replace',
  Add: 'add',
} as const;

export type DataType = keyof typeof dataTypes;

export type PatchesOptions =
  | boolean
  | {
      /**
       * The default value is `true`. If it's `true`, the path will be an array, otherwise it is a string.
       */
      pathAsArray?: boolean;
      /**
       * The default value is `true`. If it's `true`, the array length will be included in the patches, otherwise no include array length.
       */
      arrayLengthAssignment?: boolean;
    };

export interface Finalities {
  draft: ((patches?: Patches, inversePatches?: Patches) => void)[];
  revoke: (() => void)[];
  handledSet: WeakSet<any>;
  draftsCache: WeakSet<object>;
}

export interface ProxyDraft<T = any> {
  type: DraftType;
  operated?: boolean;
  finalized: boolean;
  original: T;
  copy: T | null;
  proxy: T | null;
  finalities: Finalities;
  options: Options<any, any> & { updatedValues?: WeakMap<any, any> };
  parent?: ProxyDraft | null;
  key?: string | number | symbol;
  setMap?: Map<any, ProxyDraft>;
  assignedMap?: Map<any, boolean>;
  callbacks?: ((patches?: Patches, inversePatches?: Patches) => void)[];
}

export interface IPatch {
  op: (typeof Operation)[keyof typeof Operation];
  value?: any;
}

export type Patch<P extends PatchesOptions = any> = P extends {
  pathAsArray: false;
}
  ? IPatch & {
      path: string;
    }
  : P extends true | object
    ? IPatch & {
        path: (string | number)[];
      }
    : IPatch & {
        path: string | (string | number)[];
      };

export type Patches<P extends PatchesOptions = any> = Patch<P>[];

export type Result<
  T extends any,
  O extends PatchesOptions,
  F extends boolean,
> = O extends true | object
  ? [F extends true ? Immutable<T> : T, Patches<O>, Patches<O>]
  : F extends true
    ? Immutable<T>
    : T;

export type CreateResult<
  T extends any,
  O extends PatchesOptions,
  F extends boolean,
  R extends void | Promise<void> | T | Promise<T>,
> = R extends Promise<void> | Promise<T>
  ? Promise<Result<T, O, F>>
  : Result<T, O, F>;

type BaseMark = null | undefined | DataType;
type MarkWithCopy = BaseMark | (() => any);

export type Mark<O extends PatchesOptions, F extends boolean> = (
  target: any,
  types: typeof dataTypes
) => O extends true | object
  ? BaseMark
  : F extends true
    ? BaseMark
    : MarkWithCopy;

export interface ApplyMutableOptions {
  /**
   * If it's `true`, the state will be mutated directly.
   */
  mutable?: boolean;
}

export interface Options<O extends PatchesOptions, F extends boolean> {
  /**
   * In strict mode, Forbid accessing non-draftable values and forbid returning a non-draft value.
   */
  strict?: boolean;
  /**
   * Enable patch, and return the patches and inversePatches.
   */
  enablePatches?: O;
  /**
   * Enable autoFreeze, and return frozen state.
   */
  enableAutoFreeze?: F;
  /**
   * Set a mark to determine if the object is mutable or if an instance is an immutable.
   * And it can also return a shallow copy function(AutoFreeze and Patches should both be disabled).
   */
  mark?: Mark<O, F>;
}

export interface ExternalOptions<O extends PatchesOptions, F extends boolean> {
  /**
   * In strict mode, Forbid accessing non-draftable values and forbid returning a non-draft value.
   */
  strict?: boolean;
  /**
   * Enable patch, and return the patches and inversePatches.
   */
  enablePatches?: O;
  /**
   * Enable autoFreeze, and return frozen state.
   */
  enableAutoFreeze?: F;
  /**
   * Set a mark to determine if the object is mutable or if an instance is an immutable.
   * And it can also return a shallow copy function(AutoFreeze and Patches should both be disabled).
   */
  mark?: Mark<O, F>[] | Mark<O, F>;
}

// Exclude `symbol`
type Primitive = string | number | bigint | boolean | null | undefined;

type ImmutableMap<K, V> = ReadonlyMap<Immutable<K>, Immutable<V>>;
type ImmutableSet<T> = ReadonlySet<Immutable<T>>;
type ImmutableObject<T> = { readonly [K in keyof T]: Immutable<T[K]> };

export type IfAvailable<T, Fallback = void> = true | false extends (
  T extends never ? true : false
)
  ? Fallback
  : keyof T extends never
    ? Fallback
    : T;
type WeakReferences =
  | IfAvailable<WeakMap<any, any>>
  | IfAvailable<WeakSet<any>>;
type AtomicObject = Function | Promise<any> | Date | RegExp;

export type Immutable<T> = T extends Primitive | AtomicObject
  ? T
  : T extends IfAvailable<ReadonlyMap<infer K, infer V>>
    ? ImmutableMap<K, V>
    : T extends IfAvailable<ReadonlySet<infer V>>
      ? ImmutableSet<V>
      : T extends WeakReferences
        ? T
        : T extends object
          ? ImmutableObject<T>
          : T;

type DraftedMap<K, V> = Map<K, Draft<V>>;
type DraftedSet<T> = Set<Draft<T>>;
export type DraftedObject<T> = {
  -readonly [K in keyof T]: Draft<T[K]>;
};

export type Draft<T> = T extends Primitive | AtomicObject
  ? T
  : T extends IfAvailable<ReadonlyMap<infer K, infer V>>
    ? DraftedMap<K, V>
    : T extends IfAvailable<ReadonlySet<infer V>>
      ? DraftedSet<V>
      : T extends WeakReferences
        ? T
        : T extends object
          ? DraftedObject<T>
          : T;

export type ApplyOptions<F extends boolean> =
  | Pick<
      Options<boolean, F>,
      Exclude<keyof Options<boolean, F>, 'enablePatches'>
    >
  | ApplyMutableOptions;

export type ApplyResult<
  T extends object,
  F extends boolean = false,
  A extends ApplyOptions<F> = ApplyOptions<F>,
> = A extends { mutable: true } ? void : T;
