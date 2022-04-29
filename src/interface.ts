import {
  DraftType,
  dataTypes,
  ObjectOperation,
  ArrayOperation,
  SetOperation,
  MapOperation,
} from './constant';

export type DataType = keyof typeof dataTypes;

export interface Finalities {
  draft: (() => void)[];
  revoke: (() => void)[];
}

export interface ProxyDraft<T = any> {
  type: DraftType;
  operated: Set<any>;
  finalized: boolean;
  original: T;
  copy: T | null;
  proxy: T | null;
  finalities: Finalities;
  parent?: ProxyDraft | null;
  key?: string | number;
  setMap?: Map<object, ProxyDraft>;
  enableAutoFreeze?: boolean;
  marker?: Marker;
}

export type Patches = [
  (
    | [DraftType.Object, ObjectOperation]
    | [DraftType.Array, ArrayOperation]
    | [DraftType.Set, SetOperation]
    | [DraftType.Map, MapOperation]
  ),
  (string | number)[],
  any[]
][];

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

type ImmutableMap<K, V> = ReadonlyMap<K, Immutable<V>>;
type ImmutableSet<T> = ReadonlySet<Immutable<T>>;
type ImmutableObject<T> = { readonly [K in keyof T]: Immutable<T[K]> };

export type Immutable<T> = T extends Primitive | ((...args: any) => any)
  ? T
  : T extends Map<infer K, infer V>
  ? ImmutableMap<K, V>
  : T extends Set<infer M>
  ? ImmutableSet<M>
  : ImmutableObject<T>;

type MutableMap<K, V> = Map<K, Mutable<V>>;
type MutableSet<T> = Set<Mutable<T>>;
type MutableObject<T> = { -readonly [K in keyof T]: Mutable<T[K]> };

export type Mutable<T> = T extends Primitive | ((...args: any) => any)
  ? T
  : T extends Map<infer K, infer V>
  ? MutableMap<K, V>
  : T extends Set<infer M>
  ? MutableSet<M>
  : MutableObject<T>;
