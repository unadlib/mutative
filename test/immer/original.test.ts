'use strict';
import { create, original } from '../../src';

const isProd = process.env.NODE_ENV === 'production';

describe('original', () => {
  const baseState = {
    a: [],
    b: {},
  };

  it('should return the original from the draft', () => {
    create(baseState, (draftState) => {
      expect(original(draftState)).toBe(baseState);
      expect(original(draftState.a)).toBe(baseState.a);
      expect(original(draftState.b)).toBe(baseState.b);
    });

    create(baseState, (draftState) => {
      expect(original(draftState)).toBe(baseState);
      expect(original(draftState.a)).toBe(baseState.a);
      expect(original(draftState.b)).toBe(baseState.b);
    });
  });

  it('should return the original from the proxy', () => {
    create(baseState, (draftState) => {
      expect(original(draftState)).toBe(baseState);
      expect(original(draftState.a)).toBe(baseState.a);
      expect(original(draftState.b)).toBe(baseState.b);
    });
  });

  it('should throw undefined for new values on the draft', () => {
    create(baseState, (draftState) => {
      // @ts-ignore
      draftState.c = {};
      // @ts-ignore
      draftState.d = 3;
      // @ts-ignore
      expect(() => original(draftState.c)).toThrowError(
        `original() is only used for a draft, parameter: [object Object]`
      );
      // @ts-ignore
      expect(() => original(draftState.d)).toThrowError(
        `original() is only used for a draft, parameter: 3`
      );
    });
  });

  it('should return undefined for an object that is not proxied', () => {
    expect(() => original({})).toThrowError(
      `original() is only used for a draft, parameter: [object Object]`
    );
    expect(() => original(3)).toThrowError(
      `original() is only used for a draft, parameter: 3`
    );
  });
});
