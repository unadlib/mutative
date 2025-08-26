/* eslint-disable no-param-reassign */
import { create } from '../src';

describe('hooks', () => {
  test('object operations with hooks', () => {
    const operations: any[] = [];
    const baseState: {
      name: string;
      age?: number;
    } = {
      name: 'Alice',
      age: 30,
    };

    const state = create(
      baseState,
      (draft) => {
        draft.name = 'Bob';
        draft.age = 31;
        delete draft.age;
      },
      {
        hooks: {
          onChange: (event) => {
            operations.push(event);
          },
        },
      }
    );

    expect(state).toEqual({ name: 'Bob' });
    expect(operations).toHaveLength(3);
    
    // Check set operation
    expect(operations[0]).toEqual({
      kind: 'set',
      key: 'name',
      prev: 'Alice',
      next: 'Bob',
      path: ['name'],
    });
    
    // Check set operation for age
    expect(operations[1]).toEqual({
      kind: 'set',
      key: 'age',
      prev: 30,
      next: 31,
      path: ['age'],
    });
    
    // Check delete operation
    expect(operations[2]).toEqual({
      kind: 'delete',
      key: 'age',
      prev: 30, // This captures the original value, not the modified value
      path: ['age'],
    });
  });

  test('map operations with hooks', () => {
    const operations: any[] = [];
    const baseState = {
      map: new Map([['key1', 'value1'], ['key2', 'value2']]),
    };

    const state = create(
      baseState,
      (draft) => {
        draft.map.set('key3', 'value3');
        draft.map.set('key1', 'newValue1');
        draft.map.delete('key2');
        draft.map.clear();
      },
      {
        hooks: {
          onChange: (event) => {
            operations.push(event);
          },
        },
      }
    );

    expect(state.map.size).toBe(0);
    expect(operations).toHaveLength(4);
    
    // Check map.set operation (new key)
    expect(operations[0]).toEqual({
      kind: 'map.set',
      key: 'key3',
      prev: undefined,
      next: 'value3',
      path: ['map', 'key3'],
    });
    
    // Check map.set operation (existing key)
    expect(operations[1]).toEqual({
      kind: 'map.set',
      key: 'key1',
      prev: 'value1',
      next: 'newValue1',
      path: ['map', 'key1'],
    });
    
    // Check map.delete operation
    expect(operations[2]).toEqual({
      kind: 'map.delete',
      key: 'key2',
      prev: 'value2',
      path: ['map', 'key2'],
    });
    
    // Check map.clear operation
    expect(operations[3]).toEqual({
      kind: 'map.clear',
      path: ['map'],
    });
  });

  test('set operations with hooks', () => {
    const operations: any[] = [];
    const baseState = {
      set: new Set(['value1', 'value2']),
    };

    const state = create(
      baseState,
      (draft) => {
        draft.set.add('value3');
        draft.set.add('value1'); // Should not trigger (already exists)
        draft.set.delete('value2');
        draft.set.clear();
      },
      {
        hooks: {
          onChange: (event) => {
            operations.push(event);
          },
        },
      }
    );

    expect(state.set.size).toBe(0);
    expect(operations).toHaveLength(3); // add, delete, clear (no duplicate add)
    
    // Check set.add operation
    expect(operations[0]).toEqual({
      kind: 'set.add',
      value: 'value3',
      path: ['set'],
    });
    
    // Check set.delete operation
    expect(operations[1]).toEqual({
      kind: 'set.delete',
      value: 'value2',
      existed: true,
      path: ['set'],
    });
    
    // Check set.clear operation
    expect(operations[2]).toEqual({
      kind: 'set.clear',
      path: ['set'],
    });
  });

  test('nested object operations with hooks', () => {
    const operations: any[] = [];
    const baseState: {
      user: {
        profile: {
          name: string;
          age?: number;
        };
      };
    } = {
      user: {
        profile: {
          name: 'Alice',
          age: 30,
        },
      },
    };

    const state = create(
      baseState,
      (draft) => {
        draft.user.profile.name = 'Bob';
        delete draft.user.profile.age;
      },
      {
        hooks: {
          onChange: (event) => {
            operations.push(event);
          },
        },
      }
    );

    expect(state.user.profile).toEqual({ name: 'Bob' });
    expect(operations).toHaveLength(2);
    
    // Check nested set operation
    expect(operations[0]).toEqual({
      kind: 'set',
      key: 'name',
      prev: 'Alice',
      next: 'Bob',
      path: ['user', 'profile', 'name'],
    });
    
    // Check nested delete operation
    expect(operations[1]).toEqual({
      kind: 'delete',
      key: 'age',
      prev: 30,
      path: ['user', 'profile', 'age'],
    });
  });

  test('no hooks provided', () => {
    const baseState = { name: 'Alice' };

    // Should not throw when no hooks are provided
    const state = create(baseState, (draft) => {
      draft.name = 'Bob';
    });

    expect(state).toEqual({ name: 'Bob' });
  });

  test('hooks with error handling', () => {
    const baseState = { name: 'Alice' };

    // Should not throw even if hook throws an error
    const state = create(
      baseState,
      (draft) => {
        draft.name = 'Bob';
      },
      {
        hooks: {
          onChange: () => {
            throw new Error('Hook error');
          },
        },
      }
    );

    expect(state).toEqual({ name: 'Bob' });
  });

  test('array operations with hooks', () => {
    const operations: any[] = [];
    const baseState = {
      items: ['item1', 'item2'],
    };

    const state = create(
      baseState,
      (draft) => {
        draft.items[0] = 'newItem1';
        draft.items.push('item3');
      },
      {
        hooks: {
          onChange: (event) => {
            operations.push(event);
          },
        },
      }
    );

    expect(state.items).toEqual(['newItem1', 'item2', 'item3']);
    expect(operations).toHaveLength(2); // array[0] set, array[2] set (length changes aren't captured by markChanged)
    
    // Check array set operation
    expect(operations[0]).toEqual({
      kind: 'set',
      key: '0',
      prev: 'item1',
      next: 'newItem1',
      path: ['items', '0'],
    });
    
    // Check array push operation (sets new item)
    expect(operations[1]).toEqual({
      kind: 'set',
      key: '2',
      prev: undefined,
      next: 'item3',
      path: ['items', '2'],
    });
  });
});