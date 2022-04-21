import { DraftType, Operation } from './constant';

export interface ProxyDraft {
  type: DraftType;
  operated: Set<any>;
  finalized: boolean;
  original: any;
  copy: Record<string | symbol, any> | null;
  proxy: ProxyDraft | null;
  finalities: (() => void)[];
  parent?: ProxyDraft | null;
  key?: string | symbol;
  setMap?: Map<object, ProxyDraft>;
  enableFreeze?: boolean;
}

export type Patches = [Operation, (string | number | symbol)[], any[]][];

export type Result<T extends object, O extends boolean> = O extends true
  ? [state: T, patches: Patches, inversePatches: Patches]
  : T;

export type CreateResult<
  T extends object,
  O extends boolean,
  R extends void | Promise<void>
> = R extends Promise<void> ? Promise<Result<T, O>> : Result<T, O>;

export interface Options<O extends boolean> {
  enablePatches?: O;
  enableFreeze?: boolean;
  mutable?: (target: any) => boolean;
}
