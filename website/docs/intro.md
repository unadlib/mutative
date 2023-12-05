---
sidebar_position: 1
---

# Introduction

**Mutative** - A JavaScript library for efficient immutable updates, faster than naive handcrafted reducer, and more than 10x faster than Immer.

## What is Mutative?

Mutative can help simplify the updating of immutable data structures, such as those used in React and Redux. It allows you to write code in a mutable way for the draft object, and ultimately it produces a new immutable data structure (the next state), avoiding unnecessary accidental mutations or complex deep updates with spread operations.

## Motivation

Writing immutable updates by hand is usually difficult, prone to errors, and cumbersome. Immer helps us write simpler immutable updates with `mutative` logic.

But its performance issue causes a runtime performance overhead. Immer must have auto-freeze enabled by default(Performance will be worse if auto-freeze is disabled), such immutable state with Immer is not common. In scenarios such as cross-processing, remote data transfer, etc., we have to constantly freeze these immutable data.

There are more parts that could be improved, such as better type inference, non-intrusive markup, support for more types of immutability, Safer immutability, [more edge cases](test/immer-non-support.test.ts), and so on.

This is why Mutative was created.

## Features and Benefits

- **Mutation makes immutable updates** - Immutable data structures supporting objects, arrays, Sets and Maps.
- **High performance** - 10x faster than immer by default, even faster than naive handcrafted reducer.
- **Optional freezing state** - No freezing of immutable data by default.
- **Support for JSON Patch** - Full compliance with JSON Patch specification.
- **Custom shallow copy** - Support for more types of immutable data.
- **Support mark for immutable and mutable data** - Allows for non-invasive marking.
- **Safer mutable data access in strict mode** - It brings more secure immutable updates.
- **Support for reducer** - Support reducer function and any other immutable state library.
