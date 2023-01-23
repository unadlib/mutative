import { Finalities, Options, Patches, Result } from './interface';
import { createDraft, finalizeDraft } from './draft';

export function draftify<
  T extends object,
  O extends boolean = false,
  F extends boolean = false
>(baseState: T, options: Options<O, F>): [T, (returnedValue?: any) => Result<T, O, F>] {
  const finalities: Finalities = {
    draft: [],
    revoke: [],
    handledSet: new WeakSet<any>(),
  };
  let patches: Patches | undefined;
  let inversePatches: Patches | undefined;
  if (options.enablePatches) {
    patches = [];
    inversePatches = [];
  }
  const draft = createDraft({
    original: baseState,
    parentDraft: null,
    finalities,
    options,
  });
  return [
    draft,
    (returnedValue?: T) => {
      const [finalizedState, finalizedPatches, finalizedInversePatches] =
        finalizeDraft(draft, patches, inversePatches, returnedValue);
      return (
        options.enablePatches
          ? [finalizedState, finalizedPatches, finalizedInversePatches]
          : finalizedState
      ) as Result<T, O, F>;
    },
  ];
}
