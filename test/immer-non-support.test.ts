import { produce, enableMapSet } from 'immer';
import { create } from '../src';

enableMapSet();

test('Set draft constructor is not equal to Set', () => {
  const data = new Set([1, 2, 3]);

  produce(data, (draft) => {
    expect(draft.constructor).not.toBe(Set);
  });

  create(data, (draft) => {
    expect(draft.constructor).toBe(Set);
  });
});

test('Map draft constructor is not equal to Map', () => {
  const data = new Map([[1, 'a']]);

  produce(data, (draft) => {
    expect(draft.constructor).not.toBe(Map);
  });

  create(data, (draft) => {
    expect(draft.constructor).toBe(Map);
  });
});

test('Unexpected operation check of Set draft', () => {
  const data = new Set([1]);

  produce(data, (draft) => {
    // @ts-ignore
    draft.x = 1;
  });

  expect(() => {
    create(data, (draft) => {
      // @ts-ignore
      draft.x = 1;
    });
  }).toThrowError('Set draft does not support any property assignment.');
});

test('Unexpected operation check of Map draft', () => {
  const data = new Map([[1, 'a']]);

  produce(data, (draft) => {
    // @ts-ignore
    draft.x = 1;
  });

  expect(() => {
    create(data, (draft) => {
      // @ts-ignore
      draft.x = 1;
    });
  }).toThrowError('Map draft does not support any property assignment.');
});
