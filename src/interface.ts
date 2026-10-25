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

/**
 * The `enablePatches` option: `true` or an object generates patches, `false`
 * does not.
 */
export type PatchesOptions =
  | boolean
  | {
      /**
       * Whether a patch path is an array of keys, as by default, or a JSON
       * Pointer string, such as `/list/0`.
       */
      pathAsArray?: boolean;
      /**
       * Under the default `'index'` strategy, whether an array that gets shorter
       * gets a `replace` patch of its `length`, as by default, or a `remove`
       * patch for each index that it loses, as JSON Patch requires. Structural
       * patches emitted by the `'compact'` strategy are not affected.
       */
      arrayLengthAssignment?: boolean;
      /**
       * How to represent array changes. The default `'index'` compares the
       * values at each index. `'compact'` expresses one contiguous, non-tail
       * insertion or deletion as `add` or `remove` patches when all retained
       * elements are unchanged, and otherwise falls back to `'index'`.
       *
       * Both strategies generate value-based patches. Compact patches do not
       * record the recipe's operations or preserve JavaScript object aliases.
       *
       * @default 'index'
       */
      arrayPatchStrategy?: 'index' | 'compact';
    };

export type FinalizeCallback = (
  patches?: Patches,
  inversePatches?: Patches
) => void;

export interface Finalities {
  // Draft nodes and deferred callbacks, finalized in reverse order.
  draft: (ProxyDraft | FinalizeCallback)[];
  revoke: (() => void)[];
  handledSet: WeakSet<any>;
  // Whether the producer runs a recipe inside `create`, which then sees it end
  // and releases module-level references to its drafts. False for drafts
  // returned by `create(base)` without a recipe.
  scoped: boolean;
}

export interface ProxyDraft<T = any> {
  type: DraftType;
  operated: boolean;
  finalized: boolean;
  // Whether this node or a finalized descendant emitted patches.
  patched: boolean;
  original: T;
  copy: T | null;
  proxy: T | null;
  finalities: Finalities;
  options: Options<any, any>;
  parent: ProxyDraft | null;
  key: string | number | symbol | undefined;
  // The drafts of a Set draft's items and the objects it added, with its items
  // in order once finalization rebuilt it.
  setMap: (Map<any, any> & { items?: any[] }) | undefined;
  assignedMap: Map<any, boolean> | undefined;
  callbacks: FinalizeCallback[] | undefined;
  // Child drafts created by this draft, by key.
  children: any;
  child: any;
  childKey: any;
  // Bookkeeping of array methods that ran natively, created on demand.
  arrayState: ArrayState | null;
}

export interface ArrayState {
  // Elements may have moved away from their original index.
  relocated: boolean;
  // Index range whose contents may have changed; patch generation compares
  // it in full.
  diffStart: number;
  diffEnd: number;
  // Original index by element of the original array, built lazily.
  baseRefs: Map<any, number> | null;
  // How far the last native move shifted the elements it moved, when it
  // shifted all of them alike.
  delta: number | undefined;
  // Original indices looked up by searching before `baseRefs` is built.
  lookups: number;
  // Whether no element can be drafted; null until checked.
  inert: boolean | null;
  // Whether the array has no holes; null until checked.
  dense: boolean | null;
}

export interface IPatch {
  op: (typeof Operation)[keyof typeof Operation];
  value?: any;
}

/**
 * An `add`, `remove` or `replace` operation at a path, as `create()` generates
 * it with `enablePatches` and `apply()` applies it. The path is an array of
 * keys, or a JSON Pointer string with `pathAsArray: false`.
 */
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

/**
 * Patches in the order in which `apply()` applies them.
 */
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
   * In strict mode, reading an object that cannot be drafted from a draft,
   * such as a class instance that no mark makes draftable, or a value that
   * `mark` makes mutable, throws unless the read happens inside `unsafe()`.
   * A value returned with `rawReturn()` is still searched for drafts, which
   * development builds report with a warning. Development builds also warn
   * once when a recipe leaves 1,000 or more drafts unchanged.
   */
  strict?: boolean;
  /**
   * Generate patches: the result is then
   * `[state, patches, inversePatches]`.
   */
  enablePatches?: O;
  /**
   * Freeze the next state deeply, also the parts that it shares with the base
   * state. Development builds also throw for an object that holds itself.
   */
  enableAutoFreeze?: F;
  /**
   * Decide how values are drafted: a mark returns `immutable` to make a value
   * draftable, such as a class instance, `mutable` to keep it out of drafts so
   * that the recipe changes it in place, or a function that returns a shallow
   * copy of the value, which needs patches and auto-freeze off. With several
   * marks, the first one that returns a value decides.
   */
  mark?: Mark<O, F>;
}

export interface ExternalOptions<O extends PatchesOptions, F extends boolean> {
  /**
   * In strict mode, reading an object that cannot be drafted from a draft,
   * such as a class instance that no mark makes draftable, or a value that
   * `mark` makes mutable, throws unless the read happens inside `unsafe()`.
   * A value returned with `rawReturn()` is still searched for drafts, which
   * development builds report with a warning. Development builds also warn
   * once when a recipe leaves 1,000 or more drafts unchanged.
   */
  strict?: boolean;
  /**
   * Generate patches: the result is then
   * `[state, patches, inversePatches]`.
   */
  enablePatches?: O;
  /**
   * Freeze the next state deeply, also the parts that it shares with the base
   * state. Development builds also throw for an object that holds itself.
   */
  enableAutoFreeze?: F;
  /**
   * Decide how values are drafted: a mark returns `immutable` to make a value
   * draftable, such as a class instance, `mutable` to keep it out of drafts so
   * that the recipe changes it in place, or a function that returns a shallow
   * copy of the value, which needs patches and auto-freeze off. With several
   * marks, the first one that returns a value decides.
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

/**
 * A deeply readonly `T`, the type of a state that `enableAutoFreeze` freezes:
 * Maps and Sets become `ReadonlyMap` and `ReadonlySet`, and functions,
 * Promises, dates and regular expressions keep their types.
 */
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
/**
 * The draft of an object type: writable properties whose values are drafts.
 */
export type DraftedObject<T> = {
  -readonly [K in keyof T]: Draft<T[K]>;
};

/**
 * The type of a draft of `T`: its objects, arrays, Maps and Sets without
 * `readonly`, deeply, so that a recipe can change them. Functions, Promises,
 * dates and regular expressions keep their types.
 */
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

export type ApplyImmutableOptions<F extends boolean> = Pick<
  Options<boolean, F>,
  Exclude<keyof Options<boolean, F>, 'enablePatches'>
> & { mutable?: false };

export type ApplyOptions<F extends boolean> =
  | ApplyImmutableOptions<F>
  | ApplyMutableOptions;

// Distribute over boolean and undefined so optional or widened freeze flags
// keep both possible states instead of silently promising a writable result.
type ApplyFrozenState<T, F> = F extends true ? Immutable<T> : T;

type ApplyState<T, F extends boolean, A> = F extends true
  ? Immutable<T>
  : 'enableAutoFreeze' extends keyof A
    ? ApplyFrozenState<T, A['enableAutoFreeze']>
    : T;

// `apply()` changes the state in place and returns nothing with `mutable`,
// and returns a frozen state with `enableAutoFreeze`, as `create()` does.
// A boolean or optional `mutable` flag can also select the void result.
export type ApplyResult<
  T extends object,
  F extends boolean = false,
  A extends ApplyOptions<boolean> | undefined = ApplyImmutableOptions<F>,
> = A extends { mutable: true }
  ? void
  : 'mutable' extends keyof A
    ? true extends A['mutable']
      ? ApplyState<T, F, A> | void
      : ApplyState<T, F, A>
    : ApplyState<T, F, A>;
