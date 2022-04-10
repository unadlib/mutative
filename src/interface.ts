import { DraftType, Operation } from './constant';

declare global {
  var Record: new (...args: any[]) => Readonly<Record<string, any>>;
  var Tuple: new (...args: any[]) => ReadonlyArray<any>;
}
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

export type Result<T, O extends boolean> = O extends true
  ? { state: T; patches: Patches; inversePatches: Patches }
  : { state: T; patches: undefined; inversePatches: undefined };
