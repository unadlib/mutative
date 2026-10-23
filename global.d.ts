// eslint-disable-next-line no-var
declare var __DEV__: boolean;

// Build-time constants of the features that a build can leave out: Map and Set
// drafts, patch generation and native array methods. A build without one of
// them drops its code.
// eslint-disable-next-line no-var
declare var __MAP_SET__: boolean;
// eslint-disable-next-line no-var
declare var __PATCHES__: boolean;
// eslint-disable-next-line no-var
declare var __ARRAY_METHODS__: boolean;
