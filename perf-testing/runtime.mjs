import { apply, create, isDraft as isMutativeDraft } from 'mutative';
import { enablePatches, Immer, isDraft as isImmerDraft } from 'immer';
import { createDraftReducer } from './workloads.mjs';

// Replaced by build.mjs with versions, revisions, and hashes of actual inputs.
export const buildInfo = __BENCHMARK_BUILD__;

let immerPatchesEnabled = false;

export function createRuntime(library, autoFreeze, patches = false) {
  if (library === 'mutative') {
    const options = {
      enableAutoFreeze: autoFreeze,
      // Match Immer's index removals instead of Mutative's length assignment.
      enablePatches: patches ? { arrayLengthAssignment: false } : false,
    };
    return {
      reducer: createDraftReducer((base, recipe) =>
        create(base, recipe, options)
      ),
      isDraft: isMutativeDraft,
      applyPatches: (base, operations) =>
        apply(base, operations, { enableAutoFreeze: autoFreeze }),
    };
  }
  if (library === 'immer') {
    if (patches && !immerPatchesEnabled) {
      enablePatches();
      immerPatchesEnabled = true;
    }
    // Isolated instance: no global configuration changes in the timed path.
    const immer = new Immer({ autoFreeze });
    return {
      reducer: createDraftReducer(
        patches ? immer.produceWithPatches : immer.produce
      ),
      isDraft: isImmerDraft,
      applyPatches: immer.applyPatches.bind(immer),
    };
  }
  throw new Error(`Unknown library: ${library}`);
}
