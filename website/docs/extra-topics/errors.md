---
title: Production error codes
---

Mutative removes full error messages from production bundles. Use the code in
the production error to find the original message below.

| Code | Source identifier                | Development error                                                                                             |
| ---: | -------------------------------- | ------------------------------------------------------------------------------------------------------------- |
|    0 | `InvalidBaseState`               | Invalid base state: `create()` only supports plain objects, arrays, Set, Map, or a state marked as immutable. |
|    1 | `CannotAssignToMapOrSet`         | Map/Set drafts do not support property assignment.                                                            |
|    2 | `InvalidArrayIndex`              | Arrays only support assigning indices and the `length` property.                                              |
|    3 | `CannotSetPrototypeOfDraft`      | `setPrototypeOf()` cannot be called on drafts.                                                                |
|    4 | `CannotDefinePropertyOnDraft`    | `defineProperty()` cannot be called on drafts.                                                                |
|    5 | `MutateAndReturn`                | A producer cannot both return a new non-draft value and modify its draft.                                     |
|    6 | `CannotReturnModifiedChildDraft` | A modified child draft cannot be returned.                                                                    |
|    7 | `CurrentOnNonDraft`              | `current()` only accepts a draft.                                                                             |
|    8 | `StrictModeAccess`               | Mutable data cannot be accessed directly in strict mode; wrap access in `unsafe(callback)`.                   |
|    9 | `UnsupportedMarkResult`          | The configured `mark()` function returned an unsupported value.                                               |
|   10 | `InvalidMark`                    | The configured `mark()` function is not a stable marker function.                                             |
|   11 | `CannotModifyFrozenObject`       | A frozen object cannot be modified.                                                                           |
|   12 | `InvalidPatchPath`               | A patch path could not be resolved.                                                                           |
