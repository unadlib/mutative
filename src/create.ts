import { draftify } from './draftify';
import type { Options, Result } from './interface';

/**
 * something
 */
export function create<T extends object, O extends boolean = false>(
  state: T,
  mutate: (draft: T) => void,
  options?: Options<O>
) {
  if (options?.mutable?.(state)) {
    mutate(state);
    return (options?.enablePatches ? [state, [], []] : state) as Result<T, O>;
  }
  const [draft, finalize] = draftify(state, options);
  mutate(draft);
  return finalize();
}
