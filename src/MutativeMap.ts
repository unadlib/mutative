const removedValueSymbol = Symbol('MutativeMap-removedValue');

/**
 * More efficient version of Map for use with 'mutative' mutations, especially when a lot of entries exist and only a few are changed at a time. (it already is much faster at just a hundred entries though)
 * WARNING: Iteration order may change between read-only calls and iteration order is not guaranteed to be insertion order like in a normal Map.
 * TODO [bug] I think mutative already violates iteration-order contract anyhow? I think updated entries are treated as if they were inserted? or at least read objects are set with draft value and then set to final value, which might impact order. How does Immer behave? Write test for that
 * TODO [MutativeMap] test/implement patch support
 * TODO [MutativeMap] MutativeMap does not extend Map. Reasons were:
 *  1. reduce the initial complexity/effort of having to implement and test all Map methods - which became obselete because I implemented everything (and additional utilities for better performance for common use-cases) anyhow;
 *  2. prevent external business-logic written to handle Maps to do unsupported or weird stuff with MutativeMap - e.g. serialize MutativeMap to JSON as map, but at deserialization it would be a Map and no MutativeMap, reducing performance again on next mutation;
 *  3. because MutativeMap does not adhere to the contract of insertion-order during iteration, it should not extend Map.
 *  But maybe all this does not matter and MutativeMap should extend Map.
 *
 * Background/Details:
 * Mutative and especially Immer do not work well for scenarios where a lot of entries exist and only a fraction of the data is accessed/changed per mutation. It has to shallow-copy the whole Map on each mutation, which has a significant performance impact compared to directly mutating a Map.
 * Compared to immer, mutative is already much faster/better for such scenarios, but using MutativeMap basically reduces the cost to 0. See performance test in test/performance/mutative-set-map.ts.
 * This class enables mutative from needing to copy the entire map when a single value is changed. Instead, it stores the original entries separately and only copies the changed data during drafting.
 * E.g. if there are 50k entries and only 1 is changed or was recently changed, this class will only copy the map with that 1 changed entry.
 * With N=total_count, M=changed_count, this changes the complexity from O(N) to O(M) for drafting.
 * Other operations will become slightly more expensive due to having to lookup two Maps in many scenarios, but they have the same asymptotic complexity as a regular Map.
 */
export class MutativeMap<K, V> {
  /**
   * The original data that is never changed.
   * This may be replaced by {@link compact}-ing the MutativeMap again.
   * @private
   */
  private immutableData: Map<K, V>;
  /**
   * The difference to {@link immutableData}.
   * If a key was removed, the value is {@link removedValueSymbol}.
   * @private
   */
  private patchData: Map<K, V | typeof removedValueSymbol>;
  private _size: number;

  get size() {
    return this._size;
  }

  constructor(
    data?: Map<K, V> | MutativeMap<K, V> | Iterable<readonly [K, V]>
  ) {
    // TODO [MutativeMap] [unimportant] copy provided data map except in private constructor call to guarantee isolation? but probably unnecessary performance loss. Maybe freeze on auto-freeze mode, just to make sure.
    if (data instanceof MutativeMap) {
      this.immutableData = data.immutableData;
      this.patchData = new Map(data.patchData);
      this._size = data._size;
      // TODO [MutativeMap] [performance] compact here if patchData size threshold reached?
    } else if (data === undefined) {
      this.immutableData = new Map();
      this.patchData = new Map();
      this._size = 0;
    } else if (data instanceof Map) {
      this.immutableData = data;
      this.patchData = new Map();
      this._size = data.size;
    } else {
      this.immutableData = new Map(data);
      this.patchData = new Map();
      this._size = this.immutableData.size;
    }
  }

  set(key: K, value: V) {
    // const immutableMap = getImmutableData<K, V>(this.mutableData.immutableDataKey);
    // const isInImmutable = immutableMap.has(key);
    // let isInPatch = this.patchData.has(key);
    // if (isInPatch) {
    //   if (this.patchData.get(key) === removedValueSymbol) {
    //     isInPatch = false;
    //   }
    // }
    // if (!isInImmutable && !isInPatch) {
    //   this._size++;
    // }

    // TODO [MutativeMap] [performance] [unimportant] could slightly optimize to minimize lookups / changes (i.e. not calling immutableData#has twice and not calling this.patchData.delete(key) if patchData#has is false)
    if (!this.has(key)) {
      this._size++;
    }
    if (this.immutableData.has(key) && this.immutableData.get(key) === value) {
      // re-use immutableData value if it's the same as the new value to minimize size of patchData
      // TODO [MutativeMap] [performance] could store drafts somewhere else to avoid setting drafts as values in patchData and then removing them again if they did not change?
      this.patchData.delete(key);
    } else {
      this.patchData.set(key, value as any);
    }
  }

  delete(key: K) {
    if (this.patchData.has(key)) {
      if (this.patchData.get(key) !== removedValueSymbol) {
        this.patchData.set(key, removedValueSymbol);
        this._size--;
      }
    } else {
      const immutableMap = this.immutableData;
      if (immutableMap.has(key)) {
        this.patchData.set(key, removedValueSymbol);
        this._size--;
      }
    }
  }

  get(key: K): V | undefined {
    if (this.patchData.has(key)) {
      const value = this.patchData.get(key);
      if (value === removedValueSymbol) {
        return undefined;
      }
      return value as V;
    }
    return this.immutableData.get(key);
  }

  has(key: K) {
    if (this.patchData.has(key)) {
      return this.patchData.get(key) !== removedValueSymbol;
    }
    const immutableMap = this.immutableData;
    return immutableMap.has(key);
  }

  /**
   * WARNING: order may change between calls during mutation (drafting influences entry order).
   */
  forEach(
    callbackfn: (value: V, key: K, map: MutativeMap<K, V>) => void,
    thisArg?: any
  ): void {
    for (const [key, value] of this.entries()) {
      callbackfn.call(thisArg, value, key, this);
    }
  }

  /**
   * WARNING: order may change between calls during mutation (drafting influences entry order).
   */
  entriesArray(): [K, V][] {
    // TODO [MutativeMap] [bug] if modified during iteration, new AND old entry for same key may be emitted
    // TODO [MutativeMap] [bug] what about modification during iteration generally?
    // NOTE: returning patchData values first to have better behavior in some cases when modifying during iteration (e.g. during drafting)
    const entries: [K, V][] = Array.from({ length: this._size });
    let currentEntryIndex = 0;
    for (const [key, value] of this.patchData.entries()) {
      if (value !== removedValueSymbol) {
        entries[currentEntryIndex++] = [key, value as V];
      }
    }
    for (const [key, value] of this.immutableData.entries()) {
      if (!this.patchData.has(key)) {
        entries[currentEntryIndex++] = [key, value];
      }
    }
    return entries;
  }

  /**
   * WARNING: order may change between calls during mutation (drafting influences entry order).
   */
  *entries(): IterableIterator<[K, V]> {
    // TODO [MutativeMap] [bug] if modified during iteration, new AND old entry for same key may be emitted
    // NOTE: returning patchData values first to have better behavior in some cases when modifying during iteration (e.g. during drafting)
    for (const [key, value] of this.patchData.entries()) {
      if (value !== removedValueSymbol) {
        yield [key, value as V];
      }
    }
    for (const [key, value] of this.immutableData.entries()) {
      if (!this.patchData.has(key)) {
        yield [key, value];
      }
    }
  }

  /**
   * WARNING: order may change between calls during mutation (drafting influences entry order).
   */
  valuesArray(): V[] {
    // TODO [MutativeMap] [bug] if modified during iteration, old AND new value for same key may be emitted
    // NOTE: returning patchData values first to have better behavior in some cases when modifying during iteration (e.g. during drafting)
    const values: V[] = Array.from({ length: this._size });
    let currentValueIndex = 0;
    for (const value of this.patchData.values()) {
      if (value !== removedValueSymbol) {
        values[currentValueIndex++] = value as V;
      }
    }
    for (const [key, value] of this.immutableData.entries()) {
      if (!this.patchData.has(key)) {
        values[currentValueIndex++] = value;
      }
    }
    return values;
  }

  /**
   * WARNING: order may change between calls during mutation (drafting influences entry order).
   */
  *values(): IterableIterator<V> {
    // TODO [MutativeMap] [bug] if modified during iteration, old AND new value for same key may be emitted
    // NOTE: returning patchData values first to have better behavior in some cases when modifying during iteration (e.g. during drafting)
    for (const value of this.patchData.values()) {
      if (value !== removedValueSymbol) {
        yield value as V;
      }
    }
    for (const [key, value] of this.immutableData.entries()) {
      if (!this.patchData.has(key)) {
        yield value;
      }
    }
  }

  /**
   * WARNING: order may change between calls during mutation (drafting influences entry order).
   */
  keysArray(): K[] {
    // TODO [MutativeMap] [bug] if modified during iteration, key may be emitted twice in some special cases like setting key to original value
    // NOTE: returning patchData values first to have better behavior in some cases when modifying during iteration (e.g. during drafting)
    const keys: K[] = Array.from({ length: this._size });
    let currentKeyIndex = 0;
    for (const [key, value] of this.patchData.entries()) {
      if (value !== removedValueSymbol) {
        keys[currentKeyIndex++] = key;
      }
    }
    for (const key of this.immutableData.keys()) {
      if (!this.patchData.has(key)) {
        keys[currentKeyIndex++] = key;
      }
    }
    return keys;
  }

  /**
   * WARNING: order may change between calls during mutation (drafting influences entry order).
   */
  *keys(): IterableIterator<K> {
    // TODO [MutativeMap] [bug] if modified during iteration, key may be emitted twice in some special cases like setting key to original value
    // NOTE: returning patchData values first to have better behavior in some cases when modifying during iteration (e.g. during drafting)
    for (const [key, value] of this.patchData.entries()) {
      if (value !== removedValueSymbol) {
        yield key;
      }
    }
    for (const key of this.immutableData.keys()) {
      if (!this.patchData.has(key)) {
        yield key;
      }
    }
  }

  clear() {
    this.immutableData = new Map();
    this.patchData = new Map();
    this._size = 0;
  }

  /**
   * WARNING: order may change between calls during mutation (drafting influences entry order).
   * @param fn
   */
  mapValues<ResultValue>(fn: (value: V, key: K) => ResultValue): ResultValue[] {
    const result: ResultValue[] = Array.from({ length: this._size });
    let currentIndex = 0;
    for (const [key, value] of this.entries()) {
      result[currentIndex++] = fn(value, key);
    }
    return result;
  }

  /**
   * Call this to improve the performance after a series of set/delete operations to minimize the data needed to be copied when drafting.
   * This is especially useful when a lot of entries were changed recently.
   * @return The number of entries that were in the patch data. If this was high, compacting was very useful.
   */
  compact<K, V>(mutativeMap: MutativeMap<K, V>): number {
    let patchDataSize = mutativeMap.patchData.size;
    if (patchDataSize === 0) {
      return 0;
    }
    // TODO [MutativeMap] test compacting MutativeMap (especially during mutation. Should that even be allowed? May hurt performance by compacting before unchanged draft values were finalized, which will make patchData grow unnecessarily)
    const mapWithAllData = new Map(mutativeMap.entries());
    const allData = new Map<K, V>(mapWithAllData);
    // for (const [key, value] of mutativeMap.patchData) {
    //   assertAlways(!isDraft(value), () => `Draft value for key=${key} found in patch data while compacting`);
    //   if (value === removedValueSymbol) {
    //     allData.delete(key);
    //   } else {
    //     allData.set(key, value as V);
    //   }
    // }
    mutativeMap.patchData = new Map();
    mutativeMap.immutableData = allData;
    return patchDataSize;
  }
}
