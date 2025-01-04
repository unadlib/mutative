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
  // add,
  // remove,
  update,
  // concat,
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
  (produce, isMutativeAutoFreeze) =>
  (state = createInitialState(), action) =>
    produce(
      state,
      (draft) => {
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
      },
      isMutativeAutoFreeze ? { enableAutoFreeze: true } : undefined
    );
const MAX_ITERATIONS = 1;

Object.entries(actions).forEach(([actionName, action]) => {
  {
    const initialState = createInitialState();
    console.time(`[${actionName}]immer:autoFreeze`);
    const immerReducer = createMutativeReducer(produce);
    let next = immerReducer(initialState, action(0));
    console.timeEnd(`[${actionName}]immer:autoFreeze`);
    console.time(`[${actionName}]immer:autoFreeze:nextAction`);
    for (let i = 0; i < MAX_ITERATIONS; i++) {
      next = immerReducer(next, action(i));
    }
    console.timeEnd(`[${actionName}]immer:autoFreeze:nextAction`);
  }
  console.log('---------------------------------');
  {
    const initialState = createInitialState();
    console.time(`[${actionName}]mutative:autoFreeze`);
    const mutativeReducer = createMutativeReducer(create, true);
    let next = mutativeReducer(initialState, action(0));
    console.timeEnd(`[${actionName}]mutative:autoFreeze`);
    console.time(`[${actionName}]mutative:autoFreeze:nextAction`);
    for (let i = 0; i < MAX_ITERATIONS; i++) {
      next = mutativeReducer(next, action(i));
    }
    console.timeEnd(`[${actionName}]mutative:autoFreeze:nextAction`);
  }
  console.log('---------------------------------');
  {
    setAutoFreeze(false);
    const initialState = createInitialState();
    console.time(`[${actionName}]immer:noAutoFreeze`);
    const immerReducer = createMutativeReducer(produce);
    let next = immerReducer(initialState, action(0));
    console.timeEnd(`[${actionName}]immer:noAutoFreeze`);
    console.time(`[${actionName}]immer:noAutoFreeze:nextAction`);
    for (let i = 1; i < 2; i++) {
      immerReducer(initialState, action(i));
    }
    console.timeEnd(`[${actionName}]immer:noAutoFreeze:nextAction`);
  }
  console.log('---------------------------------');
  {
    const initialState = createInitialState();
    console.time(`[${actionName}]mutative:noAutoFreeze`);
    const mutativeReducer = createMutativeReducer(create);
    let next = mutativeReducer(initialState, action(0));
    console.timeEnd(`[${actionName}]mutative:noAutoFreeze`);
    console.time(`[${actionName}]mutative:noAutoFreeze:nextAction`);
    for (let i = 0; i < MAX_ITERATIONS; i++) {
      next = mutativeReducer(next, action(i));
    }
    console.timeEnd(`[${actionName}]mutative:noAutoFreeze:nextAction`);
  }
  console.log('---------------------------------');
  {
    const initialState = createInitialState();
    console.time(`[${actionName}]vanilla`);
    let next = vanillaReducer(initialState, action(0));
    console.timeEnd(`[${actionName}]vanilla`);
    console.time(`[${actionName}]vanilla:nextAction`);
    for (let i = 0; i < MAX_ITERATIONS; i++) {
      next = vanillaReducer(next, action(i));
    }
    console.timeEnd(`[${actionName}]vanilla:nextAction`);
  }
  console.log('=================================');
});
