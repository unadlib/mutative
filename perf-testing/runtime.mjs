import { create, isDraft as isMutativeDraft } from 'mutative';
import { Immer, isDraft as isImmerDraft } from 'immer';
import { createDraftReducer } from './workloads.mjs';

// Replaced by build.mjs with versions, revisions, and hashes of actual inputs.
export const buildInfo = __BENCHMARK_BUILD__;

export function createRuntime(library, autoFreeze) {
  if (library === 'mutative') {
    const options = { enableAutoFreeze: autoFreeze };
    return {
      reducer: createDraftReducer((base, recipe) =>
        create(base, recipe, options)
      ),
      isDraft: isMutativeDraft,
    };
  }
  if (library === 'immer') {
    // Isolated instance: no global configuration changes in the timed path.
    const immer = new Immer({ autoFreeze });
    return {
      reducer: createDraftReducer(immer.produce),
      isDraft: isImmerDraft,
    };
  }
  throw new Error(`Unknown library: ${library}`);
}
