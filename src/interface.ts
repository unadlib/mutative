import { DraftType, Operation } from './constant';

export interface ProxyDraft {
  type: DraftType;
  updated: boolean;
  finalized: boolean;
  assigned: Record<string | symbol, any> | null;
  original: any;
  copy: Record<string | symbol, any> | null;
  parent?: ProxyDraft | null;
  proxy: ProxyDraft | null;
  key?: string | symbol;
  setMap?: Map<object, ProxyDraft>;
}

export type Patches = [Operation, (string | number | symbol)[], any[]][];

export type Result<T, O extends boolean> = O extends true
  ? { state: T; patches: Patches; inversePatches: Patches }
  : { state: T; patches: undefined; inversePatches: undefined };
