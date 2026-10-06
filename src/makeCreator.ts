import {
  CreateResult,
  Draft,
  Mark,
  Options,
  ExternalOptions,
  PatchesOptions,
  Result,
} from './interface';
import { draftify } from './draftify';
import { releaseArrayMethods } from './array';
import {
  getProxyDraft,
  isDraft,
  isDraftable,
  isEqual,
  revokeProxy,
} from './utils';
import { current, handleReturnValue } from './current';
import { RAW_RETURN_SYMBOL, dataTypes } from './constant';
import { die, ErrorCode } from './error';

type MakeCreator = <
  _F extends boolean = false,
  _O extends PatchesOptions = false,
>(
  options?: ExternalOptions<_O, _F>
) => {
  <
    T extends any,
    F extends boolean = _F,
    O extends PatchesOptions = _O,
    R extends void | Promise<void> | T | Promise<T> = void,
  >(
    base: T,
    mutate: (draft: Draft<T>) => R,
    options?: ExternalOptions<O, F>
  ): CreateResult<T, O, F, R>;
  <
    T extends any,
    F extends boolean = _F,
    O extends PatchesOptions = _O,
    R extends void | Promise<void> = void,
  >(
    base: T,
    mutate: (draft: T) => R,
    options?: ExternalOptions<O, F>
  ): CreateResult<T, O, F, R>;
  <
    T extends any,
    P extends any[] = [],
    F extends boolean = _F,
    O extends PatchesOptions = _O,
    R extends void | Promise<void> = void,
  >(
    mutate: (draft: Draft<T>, ...args: P) => R,
    options?: ExternalOptions<O, F>
  ): (base: T, ...args: P) => CreateResult<T, O, F, R>;
  <T extends any, O extends PatchesOptions = _O, F extends boolean = _F>(
    base: T,
    options?: ExternalOptions<O, F>
  ): [Draft<T>, () => Result<T, O, F>];
};

// Development builds warn once about a draft base, see `makeCreator`.
let draftBaseWarned = false;

/**
 * `makeCreator(options)` to make a creator function.
 *
 * ## Example
 *
 * ```ts
 * import { makeCreator } from '../index';
 *
 * const baseState = { foo: { bar: 'str' }, arr: [] };
 * const create = makeCreator({ enableAutoFreeze: true });
 * const state = create(
 *   baseState,
 *   (draft) => {
 *     draft.foo.bar = 'str2';
 *   },
 * );
 *
 * expect(state).toEqual({ foo: { bar: 'str2' }, arr: [] });
 * expect(state).not.toBe(baseState);
 * expect(state.foo).not.toBe(baseState.foo);
 * expect(state.arr).toBe(baseState.arr);
 * expect(Object.isFrozen(state)).toBeTruthy();
 * ```
 */
export const makeCreator: MakeCreator = (arg) => {
  if (
    __DEV__ &&
    arg !== undefined &&
    Object.prototype.toString.call(arg) !== '[object Object]'
  ) {
    throw new Error(
      `Invalid options: ${String(arg)}, 'options' should be an object.`
    );
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
    let options = arg2;
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
    const draftBase = isDraft(base);
    // A draft base is drafted as `current(draft)`, so the values that the
    // recipe leaves unchanged are objects of the base state.
    if (
      __DEV__ &&
      draftBase &&
      typeof arg1 === 'function' &&
      !draftBaseWarned
    ) {
      draftBaseWarned = true;
      console.warn(
        `create() received a draft as its base and drafts current(draft), unlike Immer's produce: the values that its recipe leaves unchanged are objects of the base state, so changing them after the result is assigned back changes the base state. Make such changes in the recipe or before calling create(); see https://mutative.js.org/docs/api-reference/create#create-on-a-draft`
      );
    }
    const state = draftBase ? current(base) : base;
    const mark = Array.isArray(options.mark)
      ? (((value: unknown, types: typeof dataTypes) => {
          for (const mark of options.mark as Mark<any, any>[]) {
            if (__DEV__ && typeof mark !== 'function') {
              throw new Error(
                `Invalid mark: ${mark}, 'mark' should be a function.`
              );
            }
            const result = mark(value, types);
            if (result) {
              return result;
            }
          }
          return;
        }) as Mark<any, any>)
      : options.mark;
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
      die(ErrorCode.InvalidBaseState);
    }
    const [draft, finalize, finalities] = draftify(state, _options);
    if (typeof arg1 !== 'function') {
      if (!isDraftable(state, _options)) {
        die(ErrorCode.InvalidBaseState);
      }
      finalities.scoped = false;
      return [draft, finalize];
    }
    // A failed producer revokes its drafts, without reading the root draft,
    // which finalization may already have revoked, and releases the array
    // method cache, which must not keep it alive.
    function fail(error: unknown): never {
      revokeProxy(finalities);
      releaseArrayMethods(finalities.revoke);
      throw error;
    }
    let result: any;
    try {
      result = mutate(draft);
    } catch (error) {
      fail(error);
    }
    const returnValue = (value: any) => {
      const proxyDraft = getProxyDraft(draft)!;
      if (!isDraft(value)) {
        if (
          value !== undefined &&
          !isEqual(value, draft) &&
          proxyDraft?.operated
        ) {
          die(ErrorCode.MutateAndReturn);
        }
        const rawReturnValue = value?.[RAW_RETURN_SYMBOL] as [any] | undefined;
        if (rawReturnValue) {
          const _value = rawReturnValue[0];
          if (_options.strict && typeof value === 'object' && value !== null) {
            handleReturnValue(proxyDraft, value, true);
          }
          return finalize([_value]);
        }
        if (value !== undefined) {
          if (typeof value === 'object' && value !== null) {
            handleReturnValue(proxyDraft, value);
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
          die(ErrorCode.CannotReturnModifiedChildDraft);
        }
        return finalize([current(value)]);
      }
      return finalize([value]);
    };
    // Returned values are checked and finalized after the recipe, and a
    // failure there ends the producer like an error in the recipe does.
    const finish = (value: any) => {
      try {
        return returnValue(value);
      } catch (error) {
        return fail(error);
      } finally {
        releaseArrayMethods(finalities.revoke);
      }
    };
    try {
      // Classifying a returned Proxy, or reading/calling an overridden then,
      // can throw before a Promise has registered the failure handler.
      if (result instanceof Promise) return result.then(finish, fail);
    } catch (error) {
      return fail(error);
    }
    return finish(result);
  };
};
