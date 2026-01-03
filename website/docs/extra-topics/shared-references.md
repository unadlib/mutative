---
sidebar_position: 4
title: Shared References
---

# Shared References Behavior

Mutative supports non-unidirectional trees (DAGs with shared nodes) where there is more than one path from the root to the same node, **as long as there are no cycles**. However, there is an important behavior to understand regarding how drafts handle these shared references.

## Independent Drafts for Multiple Paths

When the same object is referenced from multiple paths in the base state, Mutative creates **independent drafts for each path**. This means modifications to one path will **not** automatically reflect in the other paths.

```javascript
import { create } from 'mutative';

const obj = {};
// Same object referenced by two keys
obj.color1 = obj.color2 = { name: 'Red' };

const result = create(obj, (draft) => {
  // ⚠️ Different drafts created for each path!
  console.log(draft.color1 === draft.color2); // false

  draft.color1.name = 'Blue';
  
  // color2 remains unchanged because it has a separate draft
  console.log(draft.color2.name); // 'Red'
});

console.log(result.color1 === result.color2); // false
// Result: { color1: { name: 'Blue' }, color2: { name: 'Red' } }
```

This behavior is **by design** and matches Immer's behavior. Each path through the state tree gets its own independent draft proxy.

## Creating Shared References

If you need to **preserve or create shared references** in the result state, you must do so explicitly within your recipe function by assigning one draft to another.

```javascript
const result = create(obj, (draft) => {
  draft.color1.name = 'Blue';
  
  // ✅ Explicitly share the reference
  draft.color2 = draft.color1;
});

// Now they share the same reference in the result
console.log(result.color1 === result.color2); // true
// Result: { color1: { name: 'Blue' }, color2: { name: 'Blue' } }
```

## Summary

| Scenario | Behavior |
|----------|----------|
| **Shared nodes in base state** | Each path gets its own **independent draft**. Mutations through one path do **not** reflect in other paths. |
| **Manually assigned references** | ✅ **Supported**. Assigning `draft.x = draft.y` creates shared references in the final state. |
| **Real cycles** | ❌ **Not supported**. Cycles are actively detected in development mode when auto-freeze is enabled. |
