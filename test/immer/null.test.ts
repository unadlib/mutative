'use strict';
import { create } from '../../src';

describe('null functionality', () => {
  const baseState: any = null;

  it('should throw error for the original without modifications', () => {
    expect(() => create(baseState, () => {})).toThrowError();
  });
});
