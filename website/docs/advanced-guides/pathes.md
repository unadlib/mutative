---
sidebar_position: 1
---

# Patches

Enable patch, and return the patches/inversePatches.


## Enable patches

`boolean | { pathAsArray?: boolean; arrayLengthAssignment?: boolean; }`, the default is false.

If you need to set the shape of the generated patch in more detail, then you can set `pathAsArray` and `arrayLengthAssignment`。`pathAsArray` default value is `true`, if it's `true`, the path will be an array, otherwise it is a string; `arrayLengthAssignment` default value is `true`, if it's `true`, the array length will be included in the patches, otherwise no include array length(**NOTE**: If `arrayLengthAssignment` is `false`, it is fully compatible with JSON Patch spec, but it may have additional performance loss), [view related discussions](https://github.com/unadlib/mutative/issues/6).

## JSON patches

Mutative integrates JSON Patch functionality to enhance its state management capabilities. This integration allows Mutative to generate and apply a sequence of operations (patches) that describe changes made to a JSON object. JSON Patch is particularly useful in scenarios where tracking changes to state in a detailed and structured manner is important, such as in synchronization tasks or when maintaining historical records of state changes.

Key features of JSON Patch in Mutative include:

- **Efficient Change Tracking**: JSON Patch provides a way to represent changes in a compact, easy-to-understand format. This is crucial for applications that need to track state changes over time or communicate these changes across different parts of an application or network.
- **Reversibility**: With JSON Patch, you can generate inverse patches, allowing you to revert to previous states if needed. This can be invaluable for undo/redo functionality or for correcting erroneous state changes.
- **Interoperability**: JSON Patch is a standard format, making it compatible with a wide range of tools and libraries that also use or understand JSON Patch. This enhances Mutative's ability to integrate with other systems and technologies.
- **Precise State Modifications**: Mutative's implementation of JSON Patch can handle complex changes, including modifications to nested structures and arrays, ensuring that even detailed and nuanced state changes are accurately captured and can be reproduced. 

In summary, the integration of JSON Patch into Mutative adds a layer of precision and clarity to state management, allowing developers to have a clear and structured record of how the state evolves over time. This makes it an invaluable tool for complex applications that require meticulous state tracking and manipulation.
