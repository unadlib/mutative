import { Operation, DraftType } from './interface';
import type {
  Draft,
  Patches,
  ApplyImmutableOptions,
  ApplyMutableOptions,
  ApplyOptions,
  ApplyResult,
} from './interface';
import { deepClone, get, getType, isDraft, unescapePath } from './utils';
import { create } from './create';
import { die, ErrorCode } from './error';

function normalizePatchKey(key: any) {
  // Let JavaScript perform ToPropertyKey once, including a Symbol result.
  // Primitive keys cannot disguise a reserved name and need no conversion here.
  return typeof key === 'object' || typeof key === 'function'
    ? Reflect.ownKeys({ [key]: 0 })[0]
    : key;
}

/**
 * `apply(state, patches)` to apply patches to state
 *
 * ## Example
 *
 * ```ts
 * import { create, apply } from '../index';
 *
 * const baseState = { foo: { bar: 'str' }, arr: [] };
 * const [state, patches] = create(
 *   baseState,
 *   (draft) => {
 *     draft.foo.bar = 'str2';
 *   },
 *   { enablePatches: true }
 * );
 * expect(state).toEqual({ foo: { bar: 'str2' }, arr: [] });
 * expect(patches).toEqual([{ op: 'replace', path: ['foo', 'bar'], value: 'str2' }]);
 * expect(state).toEqual(apply(baseState, patches));
 * ```
 */
export function apply<
  T extends object,
  F extends boolean = false,
  _A extends ApplyOptions<boolean> | undefined = ApplyImmutableOptions<F>,
>(
  state: T,
  patches: Patches,
  applyOptions?: undefined
): ApplyResult<T, F, undefined>;
export function apply<
  T extends object,
  F extends boolean = false,
  A extends ApplyOptions<boolean> | undefined = ApplyImmutableOptions<F>,
>(state: T, patches: Patches, applyOptions: A): ApplyResult<T, F, A>;
// A wrapper may supply A explicitly while forwarding optional options. Keep
// undefined in its result, but prefer the exact overload above when present.
export function apply<
  T extends object,
  F extends boolean = false,
  A extends ApplyOptions<boolean> | undefined = ApplyImmutableOptions<F>,
>(
  state: T,
  patches: Patches,
  applyOptions?: A
): ApplyResult<T, F, A | undefined>;
// With an explicit T, A takes its default instead of being inferred. Keep
// mutable options available without making calls with no options return void.
export function apply<T extends object, F extends boolean = false>(
  state: T,
  patches: Patches,
  applyOptions: { mutable: true }
): ApplyResult<T, F, { mutable: true }>;
export function apply<T extends object, F extends boolean = false>(
  state: T,
  patches: Patches,
  applyOptions: ApplyMutableOptions | undefined
): ApplyResult<T, F, ApplyMutableOptions | undefined>;
export function apply<
  T extends object,
  F extends boolean = false,
  A extends ApplyOptions<boolean> | undefined = ApplyImmutableOptions<F>,
>(state: T, patches: Patches, applyOptions?: A): ApplyResult<T, F, A> {
  let i: number;
  for (i = patches.length - 1; i >= 0; i -= 1) {
    const { value, op, path } = patches[i];
    if (
      (!path.length && op === Operation.Replace) ||
      (path === '' && op === Operation.Add)
    ) {
      state = value;
      break;
    }
  }
  if (i > -1) {
    patches = patches.slice(i + 1);
  }
  const mutate = (draft: Draft<T> | T) => {
    patches.forEach((patch) => {
      const { path: _path, op } = patch;
      const path = unescapePath(_path);
      let base: any = draft;
      for (let index = 0; index < path.length - 1; index += 1) {
        const parentType = getType(base);
        let key = path[index];
        // Map keys and Set positions retain their native identity/semantics.
        if (parentType <= DraftType.Array) {
          key = normalizePatchKey(key);
          if (
            key === '__proto__' ||
            key === 'constructor' ||
            (typeof base === 'function' && key === 'prototype')
          ) {
            die(ErrorCode.ReservedPatchAttribute);
          }
        }
        // use `index` in Set draft
        base = get(parentType === DraftType.Set ? Array.from(base) : base, key);
        if (typeof base !== 'object') {
          die(ErrorCode.CannotApplyPatch, path);
        }
      }

      const type = getType(base);
      // ensure the original patch is not modified.
      const value = deepClone(patch.value);
      let key = path[path.length - 1];
      // The last segment is assigned, and an assignment to `__proto__` sets
      // the prototype of an object or array instead of a property.
      if (type <= DraftType.Array) {
        // Array add/remove use splice indices, which follow ToNumber instead.
        if (type === DraftType.Object || op === Operation.Replace) {
          key = normalizePatchKey(key);
        }
        if (key === '__proto__') die(ErrorCode.ReservedPatchAttribute);
      }
      switch (op) {
        case Operation.Replace:
          switch (type) {
            case DraftType.Map:
              return base.set(key, value);
            case DraftType.Set:
              return die(ErrorCode.ReplacePatchOnSet);
            default:
              return (base[key] = value);
          }
        case Operation.Add:
          switch (type) {
            case DraftType.Array:
              // If the "-" character is used to
              // index the end of the array (see [RFC6901](https://datatracker.ietf.org/doc/html/rfc6902)),
              // this has the effect of appending the value to the array.
              return key === '-'
                ? base.push(value)
                : base.splice(key as number, 0, value);
            case DraftType.Map:
              return base.set(key, value);
            case DraftType.Set:
              return base.add(value);
            default:
              return (base[key] = value);
          }
        case Operation.Remove:
          switch (type) {
            case DraftType.Array:
              return base.splice(key as number, 1);
            case DraftType.Map:
              return base.delete(key);
            case DraftType.Set:
              return base.delete(patch.value);
            default:
              return delete base[key];
          }
        default:
          die(ErrorCode.UnsupportedPatchOperation, op);
      }
    });
  };
  if ((applyOptions as ApplyMutableOptions)?.mutable) {
    if (__DEV__) {
      if (
        Object.keys(applyOptions!).filter((key) => key !== 'mutable').length
      ) {
        console.warn(
          'The "mutable" option is not allowed to be used with other options.'
        );
      }
    }
    mutate(state);
    return undefined as ApplyResult<T, F, A>;
  }
  if (isDraft(state)) {
    if (applyOptions !== undefined) {
      die(ErrorCode.ApplyOptionsToDraft);
    }
    mutate(state as Draft<T>);
    return state as ApplyResult<T, F, A>;
  }
  return create<T, F>(state, mutate, {
    ...(applyOptions as ApplyOptions<F>),
    enablePatches: false,
  }) as T as ApplyResult<T, F, A>;
}
