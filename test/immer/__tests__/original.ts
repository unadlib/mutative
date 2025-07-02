// @ts-nocheck
import { produce, original } from '../src/immer';

const isProd = process.env.NODE_ENV === 'production';

describe('original', () => {
  const baseState = {
    a: [],
    b: {},
  };

  it('should return the original from the draft', () => {
    produce(baseState, (draftState) => {
      expect(original(draftState)).toBe(baseState);
      expect(original(draftState.a)).toBe(baseState.a);
      expect(original(draftState.b)).toBe(baseState.b);
    });
  });

  it('should return the original from the proxy', () => {
    produce(baseState, (draftState) => {
      expect(original(draftState)).toBe(baseState);
      expect(original(draftState.a)).toBe(baseState.a);
      expect(original(draftState.b)).toBe(baseState.b);
    });
  });

  it('should throw undefined for new values on the draft', () => {
    produce(baseState, (draftState) => {
      draftState.c = {};
      draftState.d = 3;
      expect(() => original(draftState.c)).toThrow(
        isProd
          ? `[Immer] minified error nr: 15. Full error at: https://bit.ly/3cXEKWf`
          : `original() is only used for a draft, parameter: [object Object]`
      );
      expect(() => original(draftState.d)).toThrow(
        isProd
          ? `[Immer] minified error nr: 15. Full error at: https://bit.ly/3cXEKWf`
          : `original() is only used for a draft, parameter: 3`
      );
    });
  });

  it('should return undefined for an object that is not proxied', () => {
    expect(() => original({})).toThrow(
      isProd
        ? `[Immer] minified error nr: 15. Full error at: https://bit.ly/3cXEKWf`
        : `original() is only used for a draft, parameter: [object Object]`
    );
    expect(() => original(3)).toThrow(
      isProd
        ? `[Immer] minified error nr: 15. Full error at: https://bit.ly/3cXEKWf`
        : `original() is only used for a draft, parameter: 3`
    );
  });
});
