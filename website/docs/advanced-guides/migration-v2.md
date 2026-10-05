---
sidebar_position: 8
---

# Migration from Mutative v1 to v2

Mutative v2 keeps the v1 API. The changes below, made since v1.3.0, can affect existing code.

## Build output and package entries

- **ES2018 output.** Every build targets ES2018 instead of ES2015, so object spread stays native. Engines that support Proxy but not ES2018 syntax, such as Chrome 49–59, Firefox 18–54, Safari 10–11.0 and Edge 12–18, need Mutative transpiled by your build.
- **Bundlers.** The ESM entry compares `process.env.NODE_ENV` at each development check instead of always running development code. Production bundles, in which the bundler defines `NODE_ENV` as `production`, drop the development checks and warnings and throw minified errors, as CommonJS consumers already did. Bundles that target Node.js without defining `NODE_ENV`, such as esbuild with `platform: 'node'`, now include both CommonJS builds; define `NODE_ENV` or keep Mutative external.
- **Node.js ESM.** In Node.js, `import` resolves a module that re-exports the CommonJS build, so `import` and `require` share one instance and both follow `NODE_ENV`. Previously, `import` always ran the development ESM build as a separate instance.
- **Browsers without a bundler.** `dist/mutative.esm.mjs` and `dist/mutative.esm.js` read `process.env.NODE_ENV`, so a page that loads them directly, for example from a raw CDN URL, fails with `process is not defined`. Load `dist/mutative.esm.production.min.mjs` instead, or the UMD build that the `unpkg` and `jsdelivr` fields point to.
- **Production errors.** Production builds throw `Minified Mutative error #<code>` with a link to the [errors page](https://mutative.js.org/docs/extra-topics/errors) instead of the full message, also for `apply()`, `original()` and `rawReturn()`. Development builds keep the messages. Code that matches error messages in production must match the codes instead.

## Patches

- **Order.** The patches of a nested draft now come before those of its parents, the order Immer uses. For example, `const item = draft.list[0]; draft.list.length = 0; item.text = 'b'; draft.item = item;` yields the `list` length replace before the `item` add. Applying the patches gives the same state as before, and replace patches that only restated an unchanged draft at its original index are no longer emitted.
- **Values.** A patch value that was a draft is now the object that the next state holds instead of a deep copy, and it is frozen with the state when `enableAutoFreeze` is on. `apply()` still copies patch values before applying them. Copy a patch value before mutating it.
- **Moved drafts.** A changed draft that leaves its key, because `sort()` or an assignment moved it or another value replaced it there, no longer emits patches under its old path; the patches of its parent carry its value. In v1, the patches of such a recipe could fail to apply, for example the inverse patches once a primitive took the old key.

## Arrays

- `shift`, `unshift`, `splice` and `reverse` run natively on the draft's copy of a plain array, and `indexOf`, `lastIndexOf` and `includes` search it natively; see [which array methods run natively](https://github.com/unadlib/mutative#faqs). For data arrays, the results are those of v1 and the patches replay in both directions. An accessor property on an array index is read as a data value, so its getter may run a different number of times.
- `current()` of a changed array copies the current array instead of reading every element through the draft. Base elements that a native method moved and that hold drafts of an outer `create()` call are left as they are, as unmoved elements always were.
- To search a large array without drafting each element it visits, search `current(draft.list)` and change the match through the draft; see [`current()`](/docs/api-reference/current).

## Returned values

- With `enableAutoFreeze`, production builds no longer search frozen objects in a value returned from a recipe, the returned value included, or the values they hold, for drafts, and leave a draft there unresolved. Development builds still search them and throw when they find one, also in an unfrozen object that a frozen one holds, where v1 replaced it. Never put a draft in a frozen object or in a value it holds. Without auto-freeze, returned values are searched as in v1.

## Development builds

- In strict mode, development builds warn once when a recipe leaves 1,000 or more drafts unchanged, as a search through a large draft array does.
- In strict mode, `rawReturn()` of a value without drafts no longer prints contradictory warnings.

## Fixes that change results

- A Set that receives an unchanged draft holds the original object, as the rest of the state does, instead of the draft's shallow copy.
- Assigning `undefined` to a key that `delete`, `shift`, `unshift` or a shrinking `splice` removed from a draft adds the key back; v1 left a hole or kept the shorter length.
- Under a `mark` that returns `mutable`, a value that the recipe assigned or moved is read back as assigned, through the draft and in `current()`; v1 returned the original value.
- `current()` of a draft whose state holds a plain Set with drafts returns a snapshot; v1 threw.
- With `enableAutoFreeze`, Map and Set instances are frozen too, so adding a property or replacing a method fails as on any frozen object; v1 only replaced their mutators. Later producers skip a frozen Map or Set instead of walking its entries again, and a Map or Set that holds itself no longer overflows the stack in production builds.
- The iterators that Map and Set drafts return behave like built-in iterators: iterating one that was partly consumed continues where it stopped, and iterator helpers such as `toArray()` are available where the engine has them. In v1, iterating such an iterator started over, and only a Map's `keys()` had the helpers.
- `apply()` copies the own symbol keys of patch values, and an own `__proto__` key, as `JSON.parse()` creates one, stays a data property. v1 dropped symbol keys there and turned an own `__proto__` key into the prototype of the copy.
- A patch for a Map key that is an array holds the key as one path segment; v1 spread the array into the path, so applying the patch wrote to other keys.
