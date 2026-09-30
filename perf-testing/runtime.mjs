import { apply, create, isDraft as isMutativeDraft } from 'mutative';
import {
  apply as applyV1,
  create as createV1,
  isDraft as isV1Draft,
} from 'mutative-v1';
import { enablePatches, Immer, isDraft as isImmerDraft } from 'immer';
import { do_not_optimize } from 'mitata';
import { createDraftReducer } from './workloads.mjs';

// Replaced by build.mjs with versions, revisions, and hashes of actual inputs.
export const buildInfo = __BENCHMARK_BUILD__;

let immerPatchesEnabled = false;

export function createRuntime(
  library,
  autoFreeze,
  patches = false,
  consumeRead = do_not_optimize
) {
  if (library === 'mutative' || library === 'mutative-v1') {
    const implementation =
      library === 'mutative-v1'
        ? { create: createV1, apply: applyV1, isDraft: isV1Draft }
        : { create, apply, isDraft: isMutativeDraft };
    const options = {
      enableAutoFreeze: autoFreeze,
      // Match Immer's index removals instead of Mutative's length assignment.
      enablePatches: patches ? { arrayLengthAssignment: false } : false,
    };
    return {
      reducer: createDraftReducer(
        (base, recipe) => implementation.create(base, recipe, options),
        consumeRead
      ),
      isDraft: implementation.isDraft,
      applyPatches: (base, operations) =>
        implementation.apply(base, operations, {
          enableAutoFreeze: autoFreeze,
        }),
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
        patches ? immer.produceWithPatches : immer.produce,
        consumeRead
      ),
      isDraft: isImmerDraft,
      applyPatches: immer.applyPatches.bind(immer),
    };
  }
  throw new Error(`Unknown library: ${library}`);
}
