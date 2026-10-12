# Production error codes (/docs/extra-topics/errors)

Decode minified Mutative production errors, and find the errors and warnings of development builds.

In Mutative's minified production build, full error messages are replaced with numeric codes to reduce the number of bytes sent to users.

When debugging locally, we recommend using the development build. It retains the full error messages, additional validation, and warnings that provide more context about potential problems in your application; see [Development and production builds](/docs/getting-started/installation#development-and-production-builds).

If an exception occurs in production, its message reads `Minified Mutative error #<code>; visit https://mutative.js.org/docs/extra-topics/errors`. Find that code in the table below to recover the message that the development build throws, where `<…>` stands for a value of the call. The source identifier is provided for contributors working on Mutative itself.

Numeric codes remain stable when an error is removed. Retired codes are reserved so that older production logs can still be decoded.

| Code | Source identifier                | Development message                                                                                                          |
| ---: | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
|    0 | `InvalidBaseState`               | `Invalid base state: create() only supports plain objects, arrays, Set, Map or using mark() to mark the state as immutable.` |
|    1 | `CannotAssignToMapOrSet`         | `Map/Set draft does not support any property assignment.`                                                                    |
|    2 | `InvalidArrayIndex`              | `Only supports setting array indices and the 'length' property.`                                                             |
|    3 | `CannotSetPrototypeOfDraft`      | `Cannot call 'setPrototypeOf()' on drafts`                                                                                   |
|    4 | `CannotDefinePropertyOnDraft`    | `Cannot call 'defineProperty()' on drafts`                                                                                   |
|    5 | `MutateAndReturn`                | `Either the value is returned as a new non-draft value, or only the draft is modified without returning any value.`          |
|    6 | `CannotReturnModifiedChildDraft` | `Cannot return a modified child draft.`                                                                                      |
|    7 | `CurrentOnNonDraft`              | `current() is only used for Draft, parameter: <value>`                                                                       |
|    8 | `StrictModeAccess`               | `Strict mode: Mutable data cannot be accessed directly, please use 'unsafe(callback)' wrap.`                                 |
|    9 | `UnsupportedMarkResult`          | `Unsupported mark result: <result>`                                                                                          |
|   10 | `InvalidMark`                    | `Please check mark() to ensure that it is a stable marker draftable function.`                                               |
|   11 | `CannotModifyFrozenObject`       | `Cannot modify frozen object`                                                                                                |
|   12 | `InvalidPatchPath` (retired)     | A generated patch path was invalid. This internal check has been removed; the code is reserved.                              |
|   13 | `ReservedPatchAttribute`         | `Patching reserved attributes like __proto__ and constructor is not allowed.`                                                |
|   14 | `CannotApplyPatch`               | `Cannot apply patch at '<path>'.`                                                                                            |
|   15 | `ReplacePatchOnSet`              | `Cannot apply replace patch to set.`                                                                                         |
|   16 | `UnsupportedPatchOperation`      | `Unsupported patch operation: <op>.`                                                                                         |
|   17 | `ApplyOptionsToDraft`            | `Cannot apply patches with options to a draft.`                                                                              |
|   18 | `OriginalOnNonDraft`             | `original() is only used for a draft, parameter: <value>`                                                                    |
|   19 | `RawReturnWithoutValue`          | `rawReturn() must be called with a value.`                                                                                   |
|   20 | `RawReturnWithExtraArguments`    | `rawReturn() must be called with one argument.`                                                                              |
|   21 | `ReplaceMutableRoot`             | `apply() with the mutable option changes the state in place, so a patch cannot replace the root state with another value.`   |

What the errors mean:

* **0**: the base state of `create()` is not draftable, such as a class instance or a `Date`; see [`isDraftable()`](/docs/api-reference/isdraftable) and [marks](/docs/advanced-guides/mark).
* **1–4**: a recipe assigned a property to a Map or Set draft, assigned a non-index property to an array draft, or called `Object.setPrototypeOf()` or `Object.defineProperty()` on a draft.
* **5** and **6**: a recipe changed its draft and returned another value, or returned a changed child draft; see [Returning a new state](/docs/api-reference/create#returning-a-new-state).
* **7** and **18**: `current()` or `original()` received a value that is not a draft.
* **8**: in [strict mode](/docs/advanced-guides/strict-mode), a recipe read a value that is not drafted outside `unsafe()`.
* **9**: a `mark` returned a value other than `'mutable'`, `'immutable'`, a function or nothing.
* **10**: a `mark` answered differently for the same value, such as `'immutable'` when Mutative drafted it and nothing when Mutative copied it; a mark must give the same answer for a value each time.
* **11**: code called `set()`, `add()`, `delete()` or `clear()` on a Map or Set that [auto-freeze](/docs/advanced-guides/auto-freeze) froze.
* **13–17** and **21**: `apply()` received a patch that it cannot apply; see [Patches that apply() accepts](/docs/api-reference/apply#patches-that-apply-accepts).
* **19** and **20**: `rawReturn()` was called without an argument or with more than one.

## Development-only errors [#development-only-errors]

Development builds also throw these errors, for checks that production builds skip:

| Message                                                                                                                                                                              | Cause                                                                                                                           |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `Invalid options: <options>, 'options' should be an object.`                                                                                                                         | `create()` or `makeCreator()` received options that are not an object.                                                          |
| `Invalid mark: <mark>, 'mark' should be a function.`                                                                                                                                 | An array of marks holds a value that is not a function.                                                                         |
| `You can't use mark and patches or auto freeze together.`                                                                                                                            | A mark returned a copy function while patches or auto-freeze are on.                                                            |
| `Forbids circular reference`                                                                                                                                                         | With auto-freeze, the next state holds an object that holds itself; a longer message names the path of the object that repeats. |
| `Patches with string paths only support string Map keys and no symbol keys, got a key of type '<type>'. Set 'pathAsArray' to true to keep keys of other types.`                      | With `pathAsArray: false`, a patch path would hold a Map key that is not a string, or a symbol key.                             |
| `A draft cannot be a Map key: its producer revokes it when it ends. Use original(key), current(key) or an id as the key; see https://mutative.js.org/docs/extra-topics/faq`          | A recipe passed a draft to the `set()` method of a Map draft as the key.                                                        |
| `The return value holds a draft in a frozen object or in a value it holds. With auto-freeze, production builds do not search frozen objects for drafts, so do not put drafts there.` | With auto-freeze, a value that a recipe returned holds a draft inside a frozen object.                                          |

## Development warnings [#development-warnings]

Development builds print these warnings with `console.warn()`; production builds do not:

| Message                                                                                                                                                               | Cause                                                                                                                                                          |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `The return value does not contain any draft, please use 'rawReturn()' to wrap the return value to improve performance.`                                              | A recipe returned an object that holds no drafts, which [`rawReturn()`](/docs/api-reference/rawreturn) would return without searching it.                      |
| `The return value contains drafts, please don't use 'rawReturn()' to wrap the return value.`                                                                          | In strict mode, a value that `rawReturn()` wraps holds drafts.                                                                                                 |
| ``rawReturn() must be called with an object(including plain object, arrays, Set, Map, etc.) or `undefined`, other types do not need to be returned via rawReturn().`` | `rawReturn()` received a primitive, which a recipe can return as it is.                                                                                        |
| `Strict mode: the recipe left <count> drafts unchanged; …`                                                                                                            | Once, in strict mode, when a recipe leaves 1,000 or more drafts unchanged; see [searching a large array](/docs/api-reference/current#searching-a-large-array). |
| `create() received a draft as its base and drafts current(draft), unlike Immer's produce: …`                                                                          | Once, when `create()` receives a draft with a recipe; see [create() on a draft](/docs/api-reference/create#create-on-a-draft).                                 |
| `The "mutable" option is not allowed to be used with other options.`                                                                                                  | `apply()` received `mutable: true` together with other options.                                                                                                |
