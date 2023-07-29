import { DraftType } from '../interface';
import { getType } from './draft';

export function forEach<T extends object>(
  target: T,
  iter: (key: string | number | symbol, value: any, source: T) => void
) {
  const type = getType(target);
  if (type === DraftType.Object) {
    Reflect.ownKeys(target).forEach((key) => {
      iter(key, (target as any)[key], target);
    });
  } else if (type === DraftType.Array) {
    let index = 0;
    for (const entry of target as any[]) {
      iter(index, entry, target);
      index += 1;
    }
  } else {
    (target as Map<any, any> | Set<any>).forEach((entry: any, index: any) =>
      iter(index, entry, target)
    );
  }
}
