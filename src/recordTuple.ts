declare global {
  var Record: RecordConstructor;
  interface RecordConstructor {
    new (value: Record<string, any>): Readonly<Record<string, any>>;
    fromEntries<T = any>(
      entries: Iterable<readonly [PropertyKey, T]>
    ): Readonly<{ [k: string]: T }>;
  }
  var Tuple: TupleConstructor;
  interface TupleConstructor {
    new (value?: any): ReadonlyArray<any>;
    from(value: any[]): ReadonlyArray<any>;
  }
}

export function convertToImmutable<T extends Record<string, any> | any[]>(
  target: T,
  refs = new WeakSet()
): Readonly<T> {
  const type = typeof target;
  if (
    type === 'string' ||
    type === 'number' ||
    type === 'boolean' ||
    type === 'undefined' ||
    type === 'bigint' ||
    target === null ||
    target instanceof Record ||
    target instanceof Tuple
  ) {
    return target;
  }

  if (refs.has(target)) {
    throw new TypeError(
      `Can't convert circular object structure to immutable structure`
    );
  }

  if (Array.isArray(target)) {
    refs.add(target);
    return Tuple.from(
      target.map((item) => convertToImmutable(item, refs))
    ) as Readonly<any>;
  } else if (
    typeof target === 'object' &&
    Object.getPrototypeOf(target) === Object.prototype
  ) {
    refs.add(target);
    return Record.fromEntries(
      Object.keys(target).map((key) => [
        key,
        convertToImmutable(target[key], refs),
      ])
    ) as Readonly<any>;
  } else {
    throw new TypeError(
      `Can't convert an unexpected type data ${target} to immutable structure, only support regular objects and arrays.`
    );
  }
}
