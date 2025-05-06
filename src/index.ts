export { makeCreator } from './makeCreator';
export { create } from './create';
export { apply } from './apply';
export { original } from './original';
export { current } from './current';
export { unsafe } from './unsafe';
export { rawReturn } from './rawReturn';
export { isDraft } from './utils/draft';
export { isDraftable } from './utils/draft';
export { markSimpleObject } from './utils/marker';
export { MutativeMap } from './MutativeMap';

export { castDraft, castImmutable, castMutable } from './utils/cast';
export type {
  Immutable,
  Draft,
  Patches,
  Patch,
  ExternalOptions as Options,
  PatchesOptions,
  Mark, // TODO [review] allowed to expose this? I wanted it in my own project for proper typing and originally used patch-package. But I'll try to sneak it in with this feature if it's fine.
} from './interface';
