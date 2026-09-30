# Immer array methods and patch correctness

This audit reproduces failures in the published **Immer 11.1.18** package, the
npm `latest` version verified on 2026-09-30. It replaces the exploratory
`check-immer` branch's Immer 11.1.3 dependency with the current package on a fresh
branch based on Mutative `main` at `af06787b798c43db5e5d7ed9f7f4f64fa58e4dbe`.
The dependency is pinned so a future Immer fix produces a visible test change.

Sources: [11.1.18 release](https://github.com/immerjs/immer/releases/tag/v11.1.18),
[array methods API](https://immerjs.github.io/immer/api/), and the source shipped
in the npm tarball. The separate vendored `test/immer` tree is not the package
under investigation.

## Reproduce

```sh
pnpm install --frozen-lockfile
pnpm test test/immer-array-methods.test.ts

# Run correctness assertions as ordinary tests; a nonzero exit is expected.
IMMER_ARRAY_METHODS_REPRO=1 pnpm test test/immer-array-methods.test.ts

# Minimal root-array patch ordering example, with the plugin-off control.
IMMER_ARRAY_METHODS_REPRO=1 pnpm test test/immer-array-methods.test.ts \
  -t 'root array: forward patches'

# Reproduce the exhaustive 17 x 17 x 17 operation audit.
IMMER_ARRAY_METHODS_REPRO=1 pnpm test test/immer-array-methods.test.ts \
  -t 'all 4913'
```

The normal suite uses `test.fails` only for known broken correctness assertions.
Those tests fail if Immer starts satisfying the contract, prompting an update
to this report and the expectations. Positive assertions separately check
production, native results, each replay direction, and the specific observed
error. The environment flag removes expected-failure handling without changing
the recipes or assertions.

The suite contains **18 failing nested-array recipes, one failing root-array
recipe, and five passing controls**. Each nested-array recipe runs with array
methods enabled and disabled, auto-freeze on and off, and initially frozen and
unfrozen input. Each also compares Mutative against the same native mutation
oracle. Plugin configuration is isolated by re-importing Immer after
`vi.resetModules()`; constructing another `Immer` instance does not disable a
module-global plugin.

The exhaustive test composes 17 operations three times against a three-item
array with auto-freeze disabled. It covers insertion, removal, reordering,
direct and nested edits, drafting reads, and replacement. **All 4,913 sequences
pass with the plugin disabled; 123 sequences violate at least one contract
with the plugin enabled.** This count describes this deterministic matrix,
not all possible JavaScript array operations.

## What fails

| Trigger | State production | Forward patches | Inverse patches |
| --- | --- | --- | --- |
| Insert before existing items, then edit the shifted tail | Correct; base preserved | Nested edit precedes creation of its path and replay throws | Restores the original input |
| Edit an object returned by `shift`, `pop`, or `splice`, then reinsert it | Mutates an unfrozen base; throws for a frozen base | Replays the intended state when production succeeds | Restores already modified values instead of the original input |
| Insert and reorder, then edit an original object at an inserted index | Mutates an unfrozen base; throws for a frozen base | Replays the intended state when production succeeds | Restores already modified values instead of the original input |
| Insert a wrapper containing a moved draft, then reorder; or use a negative splice index while changing length | Returns a revoked nested draft | Patch values also retain the revoked draft, making replay throw | The tested inverse patches restore the original input |

Turning auto-freeze on does not repair these failures. It freezes the result
after the recipe runs. A base received from an earlier frozen result can instead
make the same recipe throw during its attempted raw-object write.

The ordinary `produce` checks demonstrate that base corruption and incomplete
finalization also happen without requesting patches. Patch ordering is the
separate case where production is correct and only the emitted patch stream
fails.

## Root causes in 11.1.18

### 1. Child patches precede array additions

```ts
import {
  applyPatches,
  enableArrayMethods,
  enablePatches,
  produceWithPatches,
} from 'immer';

enableArrayMethods();
enablePatches();
const base = [{ value: 0 }, { value: 1 }];
const [next, patches] = produceWithPatches(base, (draft) => {
  draft.unshift({ value: 9 });
  draft[2].value++;
});
applyPatches(base, patches); // Throws: path doesn't resolve: 2/value
```

The generated stream is:

```json
[
  { "op": "replace", "path": [2, "value"], "value": 2 },
  { "op": "replace", "path": [0], "value": { "value": 9 } },
  { "op": "replace", "path": [1], "value": { "value": 0 } },
  { "op": "add", "path": [2], "value": { "value": 2 } }
]
```

The optimized insertion shifts raw base references. Reading the shifted tail
creates a child draft with its **new** index as its key. Its finalization callback
emits the nested patch before the parent emits array patches. Path validation
uses the final copy, where that new index exists, although it does not exist
in the replay input. The later `add` already contains the edited object.

See [`registerChildFinalizationCallback` and `generatePatchesAndFinalize`](https://github.com/immerjs/immer/blob/v11.1.18/src/core/finalize.ts#L169),
[`getPath`](https://github.com/immerjs/immer/blob/v11.1.18/src/plugins/patches.ts#L50),
and [`generateArrayPatches`](https://github.com/immerjs/immer/blob/v11.1.18/src/plugins/patches.ts#L171).
The independent `fast-json-patch` replay also rejects the stream after converting
array paths to JSON Pointers. This establishes a generation defect.

### 2. Removal methods return raw base objects

The plugin invokes mutating methods directly on the shallow copy and returns
their native results. An object that was not drafted before removal remains a
reference into the original base. Editing the removed object consequently
changes the base before finalization and inverse patch generation. Drafting the
object before removing it is included as a passing control.

See [`handleSimpleOperation` and the splice handler](https://github.com/immerjs/immer/blob/v11.1.18/src/plugins/arrayMethods.ts#L244).
This explains the original `check-immer` shift/splice failures and additionally
covers `pop`. The problem occurs with either auto-freeze setting.

### 3. Assignment indices survive reordering

Inserted values are marked in `assigned_` by their insertion indices. Optimized
`reverse` and `sort` rearrange the copy without relocating those assignments.
`isRelocatedBaseRef` refuses to draft a value at an assigned index, so an original
object moved into such an index can be exposed as a raw value. Editing it changes
the base and makes inverse patch values incorrect.

See [`handleInsertedValues` and `markAllIndicesReassigned`](https://github.com/immerjs/immer/blob/v11.1.18/src/plugins/arrayMethods.ts#L194)
and [`isRelocatedBaseRef`](https://github.com/immerjs/immer/blob/v11.1.18/src/core/proxy.ts#L301).
Sorting back to the original indices is a passing control because the positional
base check can draft those objects again.

### 4. Nested finalization callbacks use stale insertion indices

The plugin registers nested cleanup for the index at which a wrapper was
inserted. Subsequent reordering moves that wrapper. `handleCrossReference` checks
the old position against the wrapper, then skips cleanup when it no longer
matches. The nested draft remains in both the state and patch value after scope
revocation.

Negative `splice` indices produce the same failure without a subsequent reorder:
the handler normalizes the insertion index against the **post-splice length**,
although native `splice` resolves it against the original length. For example,
inserting at `-1` into a three-item array inserts at index 2, but cleanup is
registered at index 3 after the array grows to four items.

See [the splice insertion bookkeeping](https://github.com/immerjs/immer/blob/v11.1.18/src/plugins/arrayMethods.ts#L380)
and [`handleCrossReference`](https://github.com/immerjs/immer/blob/v11.1.18/src/core/finalize.ts#L217).
The fixtures delete the moved draft's original property before inserting the
wrapper, preserving a tree-shaped final result without shared references.

## Qualification and upgrade changes

The original `check-immer` array file at `720c26ff6029139a3336437dba6796a10a291a9a`
has 15 recipes. Executing their state and replay assertions without comparing
historical snapshots yields 15 passes with optimization disabled and five
failures with optimization enabled, for both 11.1.3 and 11.1.18. The old helper
computes its native expectation **after** production and compares inverse replay
to the same potentially mutated base. The new suite saves both oracles before
production, checks base preservation explicitly, and uses independent JSON
patch replay. It adds no snapshot files.

Comparator and predicate callbacks are read-only in the new fixtures. The plugin
documents that callbacks receive raw values. The report's failures do not depend
on mutating callback arguments, cyclic input, duplicate output references, or
other unsupported graph shapes.

Upgrading from main's 10.1.3 also changes five historical assertions in
`immer-non-support.test.ts`: unrelated getters are no longer visited with
auto-freeze disabled, two reference-array patch cases now replay correctly,
symbol handling no longer throws, and assigning inherited `undefined` creates
an own property with an `add` patch. These now assert the corrected behavior.
The historical performance figures on the comparison page retain their original
10.1.3 label; they were not remeasured by this correctness audit.

Local validation on Node.js 24.16.0:

- The new suite: 1,572 passing assertions and 234 expected failures. With
  `IMMER_ARRAY_METHODS_REPRO=1`, those same 234 assertions fail as ordinary tests;
  every failure is in the plugin-enabled configuration.
- The complete suite: 4,235 passing assertions, 234 expected failures, and the
  existing eight skipped tests, across 40 test files.
- The new suite also has the same results with `NODE_ENV=production`.
- Type checking, lint, formatting, build, size, and packed-consumer checks pass.
  Watch checks pass on rerun after one local error-recovery timeout.
