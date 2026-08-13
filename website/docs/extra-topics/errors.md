---
title: Production error codes
description: Decode minified Mutative production errors and find their full development messages.
---

In Mutative's minified production build, full error messages are replaced with
numeric codes to reduce the number of bytes sent to users.

When debugging locally, we recommend using the development build. It retains
the full error messages, additional validation, and warnings that provide more
context about potential problems in your application.

If an exception occurs in production, its message includes an error code and a
link to this page. Find that code in the table below to recover the full
development message. The source identifier is provided for contributors
working on Mutative itself.

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
