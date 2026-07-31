---
title: Production error codes
---

Mutative removes full error messages from production bundles. Use the code in
the production error to find the original message below.

| Code | Development error                                                                                             |
| ---: | ------------------------------------------------------------------------------------------------------------- |
|    0 | Invalid base state: `create()` only supports plain objects, arrays, Set, Map, or a state marked as immutable. |
|    1 | Map/Set drafts do not support property assignment.                                                            |
|    2 | Arrays only support assigning indices and the `length` property.                                              |
|    3 | `setPrototypeOf()` cannot be called on drafts.                                                                |
|    4 | `defineProperty()` cannot be called on drafts.                                                                |
|    5 | A producer cannot both return a new non-draft value and modify its draft.                                     |
|    6 | A modified child draft cannot be returned.                                                                    |
|    7 | `current()` only accepts a draft.                                                                             |
|    8 | Mutable data cannot be accessed directly in strict mode; wrap access in `unsafe(callback)`.                   |
|    9 | The configured `mark()` function returned an unsupported value.                                               |
|   10 | The configured `mark()` function is not a stable marker function.                                             |
|   11 | A frozen object cannot be modified.                                                                           |
|   12 | A patch path could not be resolved.                                                                           |
