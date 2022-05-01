import type { Options, Patches } from './interface';
import {
  ArrayOperation,
  DraftType,
  MapOperation,
  ObjectOperation,
  SetOperation,
} from './constant';
import { create } from './create';
import { deepClone, getProxyDraft, getValueWithPath, isPath } from './utils';

/**
 * apply patches
 */
export function apply<T extends object, F extends boolean = false>(
  baseState: T,
  patches: Patches,
  options?: Pick<
    Options<false, F>,
    Exclude<keyof Options<false, F>, 'enablePatches'>
  >
) {
  return create<T, F>(
    baseState,
    (draft) => {
      patches.forEach(([[type, operation], paths, args]) => {
        const params: any[] = args.map((arg) =>
          isPath(arg)
            ? getValueWithPath(draft, [...arg[0].slice(1), null])
            : deepClone(arg)
        );
        for (const path of paths) {
          const [key] = path.slice(-1);
          const current = getValueWithPath(draft, path);
          if (typeof current === 'undefined') continue;
          if (type === DraftType.Object) {
            switch (operation) {
              case ObjectOperation.Delete:
                delete current[key];
                return;
              case ObjectOperation.Set:
                current[key] = params[0];
                return;
            }
          } else if (type === DraftType.Array) {
            switch (operation) {
              case ArrayOperation.Pop:
              case ArrayOperation.Push:
              case ArrayOperation.Shift:
              case ArrayOperation.Splice:
              case ArrayOperation.Unshift:
                current[key][operation](...params);
                return;
              case ArrayOperation.Delete:
                delete current[key];
                return;
              case ArrayOperation.Set:
                current[key] = params[0];
                return;
            }
          } else if (type === DraftType.Map) {
            switch (operation) {
              case MapOperation.Delete:
                current.delete(Array.from(current.keys())[key as any]);
                return;
              case MapOperation.Set:
                if (current.size > key) {
                  const values: any[][] = Array.from(current.entries());
                  const deleteCount = current.has(params[0]) ? 1 : 0;
                  values.splice(key as number, deleteCount, params);
                  current.clear();
                  for (const value of values) {
                    current.set(...value);
                  }
                } else {
                  current.set(...params);
                }
                return;
              case MapOperation.Clear:
                current.clear();
                return;
              case MapOperation.Construct:
                current.clear();
                params.forEach(([key, value]) => current.set(key, value));
                return;
            }
          } else if (type === DraftType.Set) {
            switch (operation) {
              case SetOperation.Delete:
                current.delete(
                  Array.from(getProxyDraft(current)?.copy ?? current)[
                    key as number
                  ]
                );
                return;
              case SetOperation.Add:
                if (current.size > key) {
                  const values = Array.from(current.values());
                  values.splice(key as number, 0, params[0]);
                  current.clear();
                  for (const value of values) {
                    current.add(value);
                  }
                } else {
                  current.add(params[0]);
                }
                return;
              case SetOperation.Clear:
                current.clear();
                return;
              case SetOperation.Construct:
                current.clear();
                params[0].forEach((value: any) => current.add(value));
                return;
            }
          }
        }
      });
    },
    {
      enablePatches: false,
      ...options,
    }
  );
}
