import {
  makeCreator as makeFullCreator,
  type MakeCreatorOf,
} from './makeCreator';

// `mutative/lite` drafts objects and arrays like `mutative`, and leaves out Map
// and Set drafts, patches and native array methods: its builds define their
// constants as false. It throws where it would draft a Map or Set or generate
// patches, and runs array methods through the draft proxy.

/**
 * `makeCreator(options)` to make a creator function, without patches.
 */
export const makeCreator = makeFullCreator as MakeCreatorOf<true>;

/**
 * `create(baseState, callback, options)` to create the next state, without
 * Map and Set drafts, patches and native array methods.
 */
export const create = /* @__PURE__ */ makeCreator();

export { original } from './original';
export { current } from './current';
export { unsafe } from './unsafe';
export { rawReturn } from './rawReturn';
export { isDraft } from './utils/draft';
export { isDraftable } from './utils/draft';
export { markSimpleObject } from './utils/marker';

export { castDraft, castImmutable, castMutable } from './utils/cast';
export type {
  Immutable,
  Draft,
  LiteOptions as Options,
  DraftedObject,
} from './interface';
