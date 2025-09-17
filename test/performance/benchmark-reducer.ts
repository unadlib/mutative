/* eslint-disable import/no-relative-packages */
/* eslint-disable prefer-template */
// @ts-nocheck
import fs from 'fs';
import https from 'https';
import { Suite } from 'benchmark';
import { parse } from 'json2csv';
import deepFreeze from 'deep-freeze';
import QuickChart from 'quickchart-js';
import {
  produce,
  enablePatches,
  produceWithPatches,
  setAutoFreeze,
} from 'immer';
import { create } from '../..';

function createInitialState() {
  const initialState = {
    largeArray: Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      value: Math.random(),
      nested: { key: `key-${i}`, data: Math.random() },
      moreNested: {
        items: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          name: String(i),
        })),
      },
    })),
    otherData: Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      name: `name-${i}`,
      isActive: i % 2 === 0,
    })),
  };
  return initialState;
}

const MAX = 1;

const add = (index) => ({
  type: 'test/addItem',
  payload: { id: index, value: index, nested: { data: index } },
});
const remove = (index) => ({ type: 'test/removeItem', payload: index });
const update = (index) => ({
  type: 'test/updateItem',
  payload: { id: index, value: index, nestedData: index },
});
const concat = (index) => ({
  type: 'test/concatArray',
  payload: Array.from({ length: 500 }, (_, i) => ({ id: i, value: index })),
});

const actions = {
  add,
  remove,
  update,
  concat,
};

const vanillaReducer = (state = createInitialState(), action) => {
  switch (action.type) {
    case 'test/addItem':
      return {
        ...state,
        largeArray: [...state.largeArray, action.payload],
      };
    case 'test/removeItem': {
      const newArray = state.largeArray.slice();
      newArray.splice(action.payload, 1);
      return {
        ...state,
        largeArray: newArray,
      };
    }
    case 'test/updateItem': {
      return {
        ...state,
        largeArray: state.largeArray.map((item) =>
          item.id === action.payload.id
            ? {
                ...item,
                value: action.payload.value,
                nested: { ...item.nested, data: action.payload.nestedData },
              }
            : item
        ),
      };
    }
    case 'test/concatArray': {
      const length = state.largeArray.length;
      const newArray = action.payload.concat(state.largeArray);
      newArray.length = length;
      return {
        ...state,
        largeArray: newArray,
      };
    }
    default:
      return state;
  }
};

const createMutativeReducer =
  (produce) =>
  (state = createInitialState(), action) =>
    produce(state, (draft) => {
      switch (action.type) {
        case 'test/addItem':
          draft.largeArray.push(action.payload);
          break;
        case 'test/removeItem':
          draft.largeArray.splice(action.payload, 1);
          break;
        case 'test/updateItem': {
          const item = draft.largeArray.find(
            (item) => item.id === action.payload.id
          );
          item.value = action.payload.value;
          item.nested.data = action.payload.nestedData;
          break;
        }
        case 'test/concatArray': {
          const length = state.largeArray.length;
          const newArray = action.payload.concat(state.largeArray);
          newArray.length = length;
          draft.largeArray = newArray;
          break;
        }
      }
    });
const MAX_ITERATIONS = 100;
// {
//   const initialState = createInitialState();
//   console.time('immer:autoFreeze');
//   const immerReducer = createMutativeReducer(produce);
//   let next = immerReducer(initialState, add(0));
//   console.timeEnd('immer:autoFreeze');
//   console.time('immer:autoFreeze:nextAction');
//   for (let i = 0; i < MAX_ITERATIONS; i++) {
//     next = immerReducer(next, add(i));
//   }
//   console.timeEnd('immer:autoFreeze:nextAction');
// }
// {
//   setAutoFreeze(false);
//   const initialState = createInitialState();
//   console.time('immer');
//   const immerReducer = createMutativeReducer(produce);
//   let next = immerReducer(initialState, add(0));
//   console.timeEnd('immer');
//   console.time('immer:nextAction');
//   for (let i = 0; i < MAX_ITERATIONS; i++) {
//     next = immerReducer(next, add(i));
//   }
//   console.timeEnd('immer:nextAction');
// }
// {
//   const initialState = createInitialState();
//   console.time('immer:autoFreeze');
//   const immerReducer = createMutativeReducer(produce);
//   let next = immerReducer(initialState, update(0));
//   console.timeEnd('immer:autoFreeze');
//   console.time('immer:autoFreeze:nextAction');
//   for (let i = 0; i < MAX_ITERATIONS; i++) {
//     next = immerReducer(next, update(i));
//   }
//   console.timeEnd('immer:autoFreeze:nextAction');
// }
// {
//   setAutoFreeze(false);
//   const initialState = createInitialState();
//   console.time('immer');
//   const immerReducer = createMutativeReducer(produce);
//   let next = immerReducer(initialState, update(0));
//   console.timeEnd('immer');
//   console.time('immer:nextAction');
//   for (let i = 0; i < MAX_ITERATIONS; i++) {
//     next = immerReducer(next, update(i));
//   }
//   console.timeEnd('immer:nextAction');
// }
{
  const initialState = createInitialState();
  console.time('immer:autoFreeze');
  const immerReducer = createMutativeReducer(produce);
  let next = immerReducer(initialState, remove(0));
  console.timeEnd('immer:autoFreeze');
  console.time('immer:autoFreeze:nextAction');
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    next = immerReducer(next, remove(i));
  }
  console.timeEnd('immer:autoFreeze:nextAction');
}
{
  setAutoFreeze(false);
  const initialState = createInitialState();
  console.time('immer');
  const immerReducer = createMutativeReducer(produce);
  let next = immerReducer(initialState, remove(0));
  console.timeEnd('immer');
  console.time('immer:nextAction');
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    next = immerReducer(next, remove(i));
  }
  console.timeEnd('immer:nextAction');
}

{
  const initialState = createInitialState();
  console.time('mutative:autoFreeze');
  const mutativeReducer = createMutativeReducer(create);
  let next = mutativeReducer(initialState, remove(0));
  console.timeEnd('mutative:autoFreeze');
  console.time('mutative:autoFreeze:nextAction');
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    next = mutativeReducer(next, remove(i));
  }
  console.timeEnd('mutative:autoFreeze:nextAction');
}

{
  const initialState = createInitialState();
  console.time('vanilla');
  let next = vanillaReducer(initialState, remove(0));
  console.timeEnd('vanilla');
  console.time('vanilla:nextAction');
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    next = vanillaReducer(next, remove(i));
  }
  console.timeEnd('vanilla:nextAction');
}
