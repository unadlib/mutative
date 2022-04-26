import {
  ArrayOperation,
  DraftType,
  MapOperation,
  ObjectOperation,
  SetOperation,
} from './constant';
import { create } from './create';
import type { Patches } from './interface';

/**
 * apply patches
 */
export function apply<T extends object>(baseState: T, patches: Patches): T {
  return create(
    baseState,
    (draft) => {
      let current: any = draft;
      patches.forEach(([[type, operation], path, args]) => {
        const [key] = path.slice(-1);
        for (let i = 0; i < path.length - 1; i++) {
          const key = `${path[i]}`;
          if (current instanceof Map) {
            current = current.get(key);
          } else if (current instanceof Set) {
            current = Array.from(current.values())[key as any];
          } else {
            current = current[key];
          }
        }
        if (type === DraftType.Object) {
          switch (operation) {
            case ObjectOperation.Delete:
              delete current[key];
              return;
            case ObjectOperation.Set:
              current[key] = args[0];
              return;
          }
        } else if (type === DraftType.Array) {
          switch (operation) {
            case ArrayOperation.Pop:
            case ArrayOperation.Push:
            case ArrayOperation.Shift:
            case ArrayOperation.Splice:
            case ArrayOperation.Unshift:
              current[operation](...args);
              return;
            case ArrayOperation.Delete:
              delete current[key];
              return;
            case ArrayOperation.Set:
              current[key] = args[0];
              return;
          }
        } else if (type === DraftType.Map) {
          switch (operation) {
            case MapOperation.Delete:
              current.delete(Array.from(current.keys())[key as any]);
              return;
            case MapOperation.Set:
              current.set(...args);
              return;
            case MapOperation.Clear:
              current.clear();
              return;
            case MapOperation.Construct:
              current.clear();
              args.forEach(([key, value]) => current.set(key, value));
              return;
          }
        } else if (type === DraftType.Set) {
          switch (operation) {
            case SetOperation.Delete:
              current.delete(Array.from(current.values())[key as any]);
              return;
            case SetOperation.Add:
              if ((key as any) - 1 !== current.size) {
                throw new Error(``);
              }
              current.add(args[0]);
              return;
            case SetOperation.Clear:
              current.clear();
              return;
            case SetOperation.Construct:
              current.clear();
              args.forEach((value) => current.add(value));
              return;
          }
        }
      });
    },
    {
      enableFreeze: false,
      enablePatches: false,
    }
  );
}
