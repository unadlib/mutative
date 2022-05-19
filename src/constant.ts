// Not using `Symbol()` just for 3rd party access the draft
export const PROXY_DRAFT = Symbol.for('__MUTATIVE_PROXY_DRAFT__');
export const CLEAR = Symbol('__MUTATIVE_CLEAR__');
export const REFERENCE = '__MUTATIVE__';
export const dataTypes = {
  mutable: 'mutable',
  immutable: 'immutable',
} as const;

export const enum DraftType {
  Object = 'object',
  Array = 'array',
  Map = 'map',
  Set = 'set',
}

export const enum ObjectOperation {
  Delete = 'delete',
  Set = 'set',
}

export const enum ArrayOperation {
  Pop = 'pop',
  Push = 'push',
  Shift = 'shift',
  Splice = 'splice',
  Unshift = 'unshift',
  Set = 'set',
}

export const enum MapOperation {
  Delete = 'delete',
  Set = 'set',
  Clear = 'clear',
  Replace = 'replace',
  Construct = 'construct',
}

export const enum SetOperation {
  Delete = 'delete',
  Clear = 'clear',
  Add = 'add',
  Append = 'append',
  Construct = 'construct',
}

