// Not using `Symbol()` just for 3rd party access the draft
export const PROXY_DRAFT = Symbol.for('__MUTATIVE_PROXY_DRAFT__');

export const enum DraftType {
  Object = 'object',
  Array = 'array',
  Map = 'map',
  Set = 'set',
  Record = 'record',
  Tuple = 'Tuple',
}

export const enum Operation {
  Delete,
  Set,
  Clear,
  Add,
  Pop,
  Push,
  Reverse,
  Shift,
  Splice,
  Unshift,
  Construct,
}
