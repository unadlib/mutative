import { DraftType, dataTypes, Operation } from './constant';

export type DataType = keyof typeof dataTypes;

export interface Finalities {
  draft: ((patches?: Patches, inversePatches?: Patches) => void)[];
  revoke: (() => void)[];
}

export interface ProxyDraft<T = any> {
  type: DraftType;
  operated?: boolean;
  finalized: boolean;
  original: T;
  copy: T | null;
  proxy: T | null;
  finalities: Finalities;
  parent?: ProxyDraft | null;
  key?: string | number | symbol;
  setMap?: Map<object, ProxyDraft>;
  enableAutoFreeze?: boolean;
  marker?: Marker;
  assignedMap: Map<any, boolean>;
  callbacks?: ((patches?: Patches, inversePatches?: Patches) => void)[];
}

export type Patches = {
  op: Lowercase<keyof typeof Operation>;
  path: (string | number)[];
  value?: any;
}[];

export type Result<
  T extends object,
  O extends boolean,
  F extends boolean
> = O extends true
  ? [
      state: F extends true ? Immutable<T> : T,
      patches: Patches,
      inversePatches: Patches
    ]
  : F extends true
  ? Immutable<T>
  : T;

export type CreateResult<
  T extends object,
  O extends boolean,
  F extends boolean,
  R extends void | Promise<void>
> = R extends Promise<void> ? Promise<Result<T, O, F>> : Result<T, O, F>;

export type Marker = (
  target: any,
  types: typeof dataTypes
) => null | undefined | DataType;

export interface Options<O extends boolean, F extends boolean> {
  enablePatches?: O;
  enableAutoFreeze?: F;
  mark?: Marker;
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
type DraftedObject<T> = {
  -readonly [K in keyof T]: T[K] extends object ? Draft<T[K]> : T[K];
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
