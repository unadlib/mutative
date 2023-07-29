import {
  CreateResult,
  Draft,
  Options,
  PatchesOptions,
  Result,
} from './interface';
import { draftify } from './draftify';
import {
  getProxyDraft,
  isDraft,
  isDraftable,
  isEqual,
  revokeProxy,
} from './utils';
import { current, handleReturnValue } from './current';
import { RAW_RETURN_SYMBOL } from './constant';

type MakeCreator = <
  _F extends boolean = false,
  _O extends PatchesOptions = false
>(
  options?: Options<_O, _F>
) => {
  <
    T extends any,
    F extends boolean = _F,
    O extends PatchesOptions = _O,
    R extends void | Promise<void> | T | Promise<T> = void
  >(
    base: T,
    mutate: (draft: Draft<T>) => R,
    options?: Options<O, F>
  ): CreateResult<T, O, F, R>;
  <
    T extends any,
    F extends boolean = _F,
    O extends PatchesOptions = _O,
    R extends void | Promise<void> = void
  >(
    base: T,
    mutate: (draft: T) => R,
    options?: Options<O, F>
  ): CreateResult<T, O, F, R>;
  <
    T extends any,
    P extends any[] = [],
    F extends boolean = _F,
    O extends PatchesOptions = _O,
    R extends void | Promise<void> = void
  >(
    mutate: (draft: Draft<T>, ...args: P) => R,
    options?: Options<O, F>
  ): (base: T, ...args: P) => CreateResult<T, O, F, R>;
  <T extends any, O extends PatchesOptions = _O, F extends boolean = _F>(
    base: T,
    options?: Options<O, F>
  ): [T, () => Result<T, O, F>];
};

export const makeCreator: MakeCreator = (arg) => {
  if (
    __DEV__ &&
    arg !== undefined &&
    Object.prototype.toString.call(arg) !== '[object Object]'
  ) {
    throw new Error(`Invalid options: ${arg}, 'options' should be an object.`);
  }
  return function create(arg0: any, arg1: any, arg2?: any): any {
    if (typeof arg0 === 'function' && typeof arg1 !== 'function') {
      return function (this: any, base: any, ...args: any[]) {
        return create(
          base,
          (draft: any) => arg0.call(this, draft, ...args),
          arg1
        );
      };
    }
    const base = arg0;
    const mutate = arg1 as (...args: any[]) => any;
    let options = arg2 as Options<any, any>;
    if (typeof arg1 !== 'function') {
      options = arg1;
    }
    if (
      __DEV__ &&
      options !== undefined &&
      Object.prototype.toString.call(options) !== '[object Object]'
    ) {
      throw new Error(
        `Invalid options: ${options}, 'options' should be an object.`
      );
    }
    options = {
      ...arg,
      ...options,
    };
    const state = isDraft(base) ? current(base) : base;
    const mark = options.mark;
    const enablePatches = options.enablePatches ?? false;
    const strict = options.strict ?? false;
    const enableAutoFreeze = options.enableAutoFreeze ?? false;
    const _options: Options<any, any> = {
      enableAutoFreeze,
      mark,
      strict,
      enablePatches,
    };
    if (
      !isDraftable(state, _options) &&
      typeof state === 'object' &&
      state !== null
    ) {
      throw new Error(
        `Invalid base state: create() only supports plain objects, arrays, Set, Map or using mark() to mark the state as immutable.`
      );
    }
    const [draft, finalize] = draftify(state, _options);
    if (typeof arg1 !== 'function') {
      if (!isDraftable(state, _options)) {
        throw new Error(
          `Invalid base state: create() only supports plain objects, arrays, Set, Map or using mark() to mark the state as immutable.`
        );
      }
      return [draft, finalize];
    }
    let result: any;
    try {
      result = mutate(draft);
    } catch (error) {
      revokeProxy(getProxyDraft(draft));
      throw error;
    }
    const returnValue = (value: any) => {
      const proxyDraft = getProxyDraft(draft)!;
      if (!isDraft(value)) {
        if (
          value !== undefined &&
          !isEqual(value, draft) &&
          proxyDraft?.operated
        ) {
          throw new Error(
            `Either the value is returned as a new non-draft value, or only the draft is modified without returning any value.`
          );
        }
        const rawReturnValue = value?.[RAW_RETURN_SYMBOL] as [any] | undefined;
        if (rawReturnValue) {
          const _value = rawReturnValue[0];
          if (_options.strict && typeof value === 'object' && value !== null) {
            handleReturnValue({
              rootDraft: proxyDraft,
              value,
              useRawReturn: true,
            });
          }
          return finalize([_value]);
        }
        if (value !== undefined) {
          if (typeof value === 'object' && value !== null) {
            handleReturnValue({ rootDraft: proxyDraft, value });
          }
          return finalize([value]);
        }
      }
      if (value === draft || value === undefined) {
        return finalize([]);
      }
      const returnedProxyDraft = getProxyDraft(value)!;
      if (_options === returnedProxyDraft.options) {
        if (returnedProxyDraft.operated) {
          throw new Error(`Cannot return a modified child draft.`);
        }
        return finalize([current(value)]);
      }
      return finalize([value]);
    };
    if (result instanceof Promise) {
      return result.then(returnValue, (error) => {
        revokeProxy(getProxyDraft(draft)!);
        throw error;
      });
    }
    return returnValue(result);
  };
};
