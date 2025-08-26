/* eslint-disable no-param-reassign */
import { create } from '../src';

describe('hooks external API', () => {
  test('hooks should work through external create API', () => {
    const operations: any[] = [];
    const baseState = { name: 'Alice', age: 30 };

    const state = create(
      baseState,
      (draft) => {
        draft.name = 'Bob';
      },
      {
        hooks: {
          onOperation: (event) => {
            operations.push(event);
          },
        },
      }
    );

    expect(state).toEqual({ name: 'Bob', age: 30 });
    expect(operations).toHaveLength(1);
    expect(operations[0]).toEqual({
      kind: 'set',
      key: 'name',
      prev: 'Alice',
      next: 'Bob',
      path: ['name'],
    });
  });

  test('hooks should work through makeCreator', () => {
    const operations: any[] = [];
    
    // Test makeCreator with hooks
    const createWithHooks = create;
    
    const baseState = { count: 0 };
    const state = createWithHooks(
      baseState,
      (draft) => {
        draft.count = 1;
      },
      {
        hooks: {
          onOperation: (event) => {
            operations.push(event);
          },
        },
      }
    );

    expect(state).toEqual({ count: 1 });
    expect(operations).toHaveLength(1);
  });
});