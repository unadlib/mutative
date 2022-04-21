import { draftify } from './draftify';
import type { CreateResult, Options, Result } from './interface';

/**
 * something
 */
export function create<
  T extends object,
  O extends boolean = false,
  R extends void | Promise<void> = void
>(state: T, mutate: (draft: T) => R, options?: Options<O>) {
  if (options?.mutable?.(state)) {
    const result = mutate(state);
    const finalization = options?.enablePatches ? [state, [], []] : state;
    if (result instanceof Promise) {
      return result.then(() => finalization) as CreateResult<T, O, R>;
    }
    return finalization as CreateResult<T, O, R>;
  }
  const [draft, finalize] = draftify(state, options);
  const result = mutate(draft);
  if (result instanceof Promise) {
    return result.then(finalize) as CreateResult<T, O, R>;
  }
  return finalize() as CreateResult<T, O, R>;
}
