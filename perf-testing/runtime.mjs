import { apply, create, isDraft as isMutativeDraft, rawReturn } from 'mutative';
import {
  apply as applyV1,
  create as createV1,
  isDraft as isV1Draft,
  rawReturn as rawReturnV1,
} from 'mutative-v1';
import {
  enableArrayMethods,
  enableMapSet,
  enablePatches,
  Immer,
  isDraft as isImmerDraft,
} from 'immer';
import { do_not_optimize } from 'mitata';
import { createDraftReducer, vanillaReducer } from './workloads.mjs';
import { expectedReads } from './additional-workloads.mjs';

// Replaced by build.mjs with versions, revisions, and hashes of actual inputs.
export const buildInfo = __BENCHMARK_BUILD__;

let immerPatchesEnabled = false;
let immerArrayMethodsEnabled = false;
let immerMapSetEnabled = false;

// Immer calls the MapSet plugin while finalizing every draft once it is
// loaded, so it is enabled only in processes that run Map or Set scenarios.
export const isImmerMapSetEnabled = () => immerMapSetEnabled;

const isReadAction = (action) => action.type.startsWith('bench/read-');

export function createRuntime(
  library,
  autoFreeze,
  patches = false,
  consumeRead = do_not_optimize,
  immerArrayMethods = false,
  scenario = { kind: 'producer', steps: [] }
) {
  const applyScenario = scenario.kind === 'apply';
  if (applyScenario && patches)
    throw new Error('Patch application scenarios run with patches off');
  if (library === 'vanilla') {
    if (autoFreeze || patches || applyScenario)
      throw new Error(
        'The hand-written reducer runs producer scenarios with freeze and patches off'
      );
    // Plain reads of the same values the recipes read through drafts.
    const reducer = scenario.steps.some(isReadAction)
      ? (state, action) => {
          const values = expectedReads(state, action);
          for (let i = 0; i < values.length; i++) consumeRead(values[i]);
          return vanillaReducer(state, action);
        }
      : vanillaReducer;
    return { reducer, isDraft: () => false };
  }
  if (library === 'mutative' || library === 'mutative-v1') {
    const implementation =
      library === 'mutative-v1'
        ? {
            create: createV1,
            apply: applyV1,
            isDraft: isV1Draft,
            rawReturn: rawReturnV1,
          }
        : { create, apply, isDraft: isMutativeDraft, rawReturn };
    const mark = scenario.mark ? { mark: scenario.mark } : {};
    const options = {
      enableAutoFreeze: autoFreeze,
      // Match Immer's index removals instead of Mutative's length assignment.
      enablePatches: patches ? { arrayLengthAssignment: false } : false,
      ...mark,
    };
    const applyOptions = { enableAutoFreeze: autoFreeze, ...mark };
    return {
      reducer: applyScenario
        ? (state, action) =>
            implementation.apply(state, action.patches, applyOptions)
        : createDraftReducer(
            (base, recipe) => implementation.create(base, recipe, options),
            consumeRead,
            implementation.rawReturn
          ),
      isDraft: implementation.isDraft,
      applyPatches: (base, operations) =>
        implementation.apply(base, operations, applyOptions),
    };
  }
  if (library === 'immer') {
    if (patches && !immerPatchesEnabled) {
      enablePatches();
      immerPatchesEnabled = true;
    }
    // Opt-in plugin; its global registration also stays out of the timed path.
    if (immerArrayMethods && !immerArrayMethodsEnabled) {
      enableArrayMethods();
      immerArrayMethodsEnabled = true;
    }
    if (scenario.mapSet && !immerMapSetEnabled) {
      enableMapSet();
      immerMapSetEnabled = true;
    }
    // Isolated instance: no global configuration changes in the timed path.
    const immer = new Immer({ autoFreeze });
    const applyPatches = immer.applyPatches.bind(immer);
    return {
      reducer: applyScenario
        ? (state, action) => applyPatches(state, action.patches)
        : createDraftReducer(
            patches ? immer.produceWithPatches : immer.produce,
            consumeRead
          ),
      isDraft: isImmerDraft,
      applyPatches,
    };
  }
  throw new Error(`Unknown library: ${library}`);
}
