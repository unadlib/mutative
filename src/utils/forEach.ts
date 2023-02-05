import { DraftType } from '../interface';
import { getType } from './draft';

export function forEach<T extends object>(
  target: T,
  iter: (key: string | number | symbol, value: any, source: T) => void,
  enumerableOnly = false
) {
  if (getType(target) === DraftType.Object) {
    const getKeys = enumerableOnly ? Object.keys : Reflect.ownKeys;
    getKeys(target).forEach((key) => {
      if (!enumerableOnly || typeof key !== 'symbol')
        iter(key, (target as any)[key], target);
    });
    return;
  }
  if (getType(target) === DraftType.Array) {
    let index = 0;
    for (const entry of target as any[]) {
      iter(index, entry, target);
      index += 1;
    }
    return;
  }
  (target as Map<any, any> | Set<any>).forEach((entry: any, index: any) =>
    iter(index, entry, target)
  );
}
