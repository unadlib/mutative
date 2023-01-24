'use strict';
import { create } from '../../src';

describe('null functionality', () => {
  const baseState = null;

  it('should return the original without modifications', () => {
    const nextState = create(baseState, () => {});
    expect(nextState).toBe(baseState);
  });
});
