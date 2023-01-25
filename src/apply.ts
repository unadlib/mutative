import { Draft, Options, Patches, DraftType, Operation } from './interface';
import { deepClone, get, getType, isDraft } from './utils';
import { create } from './create';

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
export function apply<T extends object, F extends boolean = false>(
  state: T,
  patches: Patches,
  applyOptions?: Pick<
    Options<boolean, F>,
    Exclude<keyof Options<boolean, F>, 'enablePatches'>
  >
) {
  let i: number;
  for (i = patches.length - 1; i >= 0; i -= 1) {
    const { value, op, path } = patches[i];
    if (!path.length && op === Operation.Replace) {
      state = value;
      break;
    }
  }
  if (i > -1) {
    patches = patches.slice(i + 1);
  }
  const mutate = (draft: Draft<T>) => {
    patches.forEach((patch) => {
      const { path, op } = patch;
      let base: any = draft;
      for (let index = 0; index < path.length - 1; index += 1) {
        const parentType = getType(base);
        const key = String(path[index]);
        if (
          ((parentType === DraftType.Object ||
            parentType === DraftType.Array) &&
            (key === '__proto__' || key === 'constructor')) ||
          (typeof base === 'function' && key === 'prototype')
        ) {
          throw new Error(
            `Patching reserved attributes like __proto__ and constructor is not allowed.`
          );
        }
        // use `index` in Set draft
        base = get(
          getType(base) === DraftType.Set ? Array.from(base) : base,
          key
        );
        if (typeof base !== 'object') {
          throw new Error(`Cannot apply patch at '${path.join('/')}'.`);
        }
      }

      const type = getType(base);
      // ensure the original patch is not modified.
      const value = deepClone(patch.value);
      const key = path[path.length - 1];
      switch (op) {
        case Operation.Replace:
          switch (type) {
            case DraftType.Map:
              return base.set(key, value);
            case DraftType.Set:
              throw new Error(`Cannot apply replace patch to set.`);
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
          throw new Error(`Unsupported patch operation: ${op}.`);
      }
    });
  };
  if (isDraft(state)) {
    if (applyOptions !== undefined) {
      throw new Error(`Cannot apply patches with options to a draft.`);
    }
    mutate(state as Draft<T>);
    return state;
  }
  return create<T, F>(state, mutate, {
    enablePatches: false,
    ...applyOptions,
  });
}
