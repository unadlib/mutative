// Adapted from immerjs/immer perf-testing at 061c2425e1c9dff89e4e4189d42af1b7839dfe0a.
// Copyright (c) 2017 Michel Weststrate. See LICENSE in this directory.

export function createInitialState(config = DEFAULT_CONFIG) {
  const arraySize = config.arraySize;
  const initialState = {
    largeArray: Array.from({ length: arraySize }, (_, i) => ({
      id: i,
      value: (i + 1) / (arraySize + 1),
      nested: { key: `key-${i}`, data: (i + 1) / (arraySize + 2) },
      moreNested: {
        items: Array.from({ length: config.nestedArraySize }, (_, i) => ({
          id: i,
          name: String(i),
        })),
      },
    })),
    otherData: Array.from({ length: arraySize }, (_, i) => ({
      id: i,
      name: `name-${i}`,
      isActive: i % 2 === 0,
    })),
    largeObject1: createLargeObject(config.largeObjectSize1),
    largeObject2: createLargeObject(config.largeObjectSize2),
    api: {
      queries: {},
      provided: {
        keys: {},
      },
      subscriptions: {},
    },
  };
  return initialState;
}

export const DEFAULT_CONFIG = {
  arraySize: 100,
  nestedArraySize: 10,
  largeObjectSize1: 1000,
  largeObjectSize2: 3000,
  multiUpdateCount: 5,
  reuseStateIterations: 10,
  rtkqCount: 100,
};

// Utility functions for calculating array indices based on size
export const getValidIndex = (arraySize = DEFAULT_CONFIG.arraySize) =>
  Math.max(0, arraySize - 2);

export const getValidId = getValidIndex;

function createLargeObject(size = 100) {
  const obj = {};
  for (let i = 0; i < size; i++) {
    obj[`property${i}`] = {
      id: i,
      value: (i + 1) / (size + 1),
      name: `item-${i}`,
      active: i % 2 === 0,
    };
  }
  return obj;
}

const add = (index) => ({
  type: 'test/addItem',
  payload: { id: index, value: index, nested: { data: index } },
});
const remove = (index) => ({ type: 'test/removeItem', payload: index });
const filter = (percentToKeep) => ({
  type: 'test/filterItem',
  payload: percentToKeep,
});
const update = (index) => ({
  type: 'test/updateItem',
  payload: { id: index, value: index, nestedData: index },
});
const updateLargeObject1 = (index) => ({
  type: 'test/updateLargeObject1',
  payload: { value: index },
});
const updateLargeObject2 = (index) => ({
  type: 'test/updateLargeObject2',
  payload: { value: index },
});
const concat = (index) => ({
  type: 'test/concatArray',
  payload: Array.from({ length: 500 }, (_, i) => ({ id: i, value: index })),
});
const mapNested = () => ({
  type: 'test/mapNested',
});

const sortByIdReverse = () => ({
  type: 'test/sortByIdReverse',
});

const reverseArray = () => ({
  type: 'test/reverseArray',
});

// RTKQ-style action creators
export const rtkqPending = (index) => ({
  type: 'rtkq/pending',
  payload: {
    cacheKey: `some("test-${index}-")`,
    requestId: `req-${index}`,
    id: `test-${index}-`,
  },
});

export const rtkqResolved = (index) => ({
  type: 'rtkq/resolved',
  payload: {
    cacheKey: `some("test-${index}-")`,
    requestId: `req-${index}`,
    id: `test-${index}-`,
    data: `test-${index}-1`,
  },
});

export function createActions(config = DEFAULT_CONFIG) {
  const updateHigh = (index) => ({
    type: 'test/updateHighIndex',
    payload: {
      id:
        Math.floor(config.arraySize * 0.8) +
        (index % Math.floor(config.arraySize * 0.2)),
      value: index,
      nestedData: index,
    },
  });
  const updateMultiple = (index) => ({
    type: 'test/updateMultiple',
    payload: Array.from({ length: config.multiUpdateCount }, (_, i) => ({
      id: (index + i) % config.arraySize,
      value: index + i,
      nestedData: index + i,
    })),
  });
  const removeHigh = (index) => ({
    type: 'test/removeHighIndex',
    payload:
      Math.floor(config.arraySize * 0.8) +
      (index % Math.floor(config.arraySize * 0.2)),
  });

  return {
    add,
    remove,
    filter,
    update,
    concat,
    mapNested,
    // dash-named fields to improve readability in benchmark results

    'update-largeObject1': updateLargeObject1,
    'update-largeObject2': updateLargeObject2,
    'update-high': updateHigh,
    'update-multiple': updateMultiple,
    'remove-high': removeHigh,
    'sortById-reverse': sortByIdReverse,
    'reverse-array': reverseArray,
  };
}

// RTKQ-style separate reducer functions (simulating separate RTK slices)
const updateQueries = (queries, action) => {
  switch (action.type) {
    case 'rtkq/pending':
      return {
        ...queries,
        [action.payload.cacheKey]: {
          id: action.payload.id,
          status: 'pending',
          data: undefined,
        },
      };
    case 'rtkq/resolved':
      return {
        ...queries,
        [action.payload.cacheKey]: {
          ...queries[action.payload.cacheKey],
          status: 'fulfilled',
          data: action.payload.data,
        },
      };
    default:
      return queries;
  }
};

const updateProvided = (provided, action) => {
  switch (action.type) {
    case 'rtkq/pending':
    case 'rtkq/resolved':
      return {
        ...provided,
        keys: {
          ...provided.keys,
          [action.payload.cacheKey]: {},
        },
      };
    default:
      return provided;
  }
};

const updateSubscriptions = (subscriptions, action) => {
  switch (action.type) {
    case 'rtkq/pending':
      return {
        ...subscriptions,
        [action.payload.cacheKey]: {
          [action.payload.requestId]: {
            pollingInterval: 0,
            skipPollingIfUnfocused: false,
          },
        },
      };
    case 'rtkq/resolved':
      return subscriptions; // No change on resolved
    default:
      return subscriptions;
  }
};

export const vanillaReducer = (state, action) => {
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
    case 'test/filterItem': {
      const length = state.largeArray.length;
      const newArray = state.largeArray.filter(
        (item, i) => i / length < action.payload
      );
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
    case 'test/updateLargeObject1': {
      return {
        ...state,
        largeObject1: {
          ...state.largeObject1,
          [`propertyAdded${action.payload.value}`]: {
            id: action.payload.value,
          },
        },
      };
    }
    case 'test/updateLargeObject2': {
      return {
        ...state,
        largeObject2: {
          ...state.largeObject2,
          [`propertyAdded${action.payload.value}`]: {
            id: action.payload.value,
          },
        },
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
    case 'test/mapNested': {
      // Extract nested data - common pattern for denormalization or view preparation
      const nestedData = state.largeArray.map((item) => item.nested);
      return {
        ...state,
        otherData: nestedData, // Store extracted nested objects
      };
    }
    case 'test/updateHighIndex': {
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
    case 'test/updateMultiple': {
      const updates = new Map(action.payload.map((p) => [p.id, p]));
      return {
        ...state,
        largeArray: state.largeArray.map((item) => {
          const update = updates.get(item.id);
          return update
            ? {
                ...item,
                value: update.value,
                nested: { ...item.nested, data: update.nestedData },
              }
            : item;
        }),
      };
    }
    case 'test/removeHighIndex': {
      const newArray = state.largeArray.slice();
      const indexToRemove = newArray.findIndex(
        (item) => item.id === action.payload
      );
      if (indexToRemove !== -1) {
        newArray.splice(indexToRemove, 1);
      }
      return {
        ...state,
        largeArray: newArray,
      };
    }
    case 'test/sortByIdReverse': {
      const newArray = state.largeArray.slice();
      newArray.sort((a, b) => b.id - a.id); // Sort by ID in reverse order
      return {
        ...state,
        largeArray: newArray,
      };
    }
    case 'test/reverseArray': {
      const newArray = state.largeArray.slice();
      newArray.reverse();
      return {
        ...state,
        largeArray: newArray,
      };
    }
    case 'rtkq/pending':
    case 'rtkq/resolved': {
      // Simulate separate RTK slice reducers with combined reducer pattern
      return {
        ...state,
        api: {
          queries: updateQueries(state.api.queries, action),
          provided:
            action.type === 'rtkq/pending'
              ? updateProvided(state.api.provided, action)
              : state.api.provided,
          subscriptions: updateSubscriptions(state.api.subscriptions, action),
        },
      };
    }
    default:
      return state;
  }
};

export const createDraftReducer = (produce) => {
  const draftReducer = (state, action) =>
    produce(state, (draft) => {
      switch (action.type) {
        case 'test/addItem':
          draft.largeArray.push(action.payload);
          break;
        case 'test/removeItem':
          draft.largeArray.splice(action.payload, 1);
          break;
        case 'test/filterItem': {
          const length = state.largeArray.length;
          draft.largeArray = draft.largeArray.filter(
            (item, i) => i / length < action.payload
          );
          break;
        }
        case 'test/updateItem': {
          const item = draft.largeArray.find(
            (item) => item.id === action.payload.id
          );
          item.value = action.payload.value;
          item.nested.data = action.payload.nestedData;
          break;
        }
        case 'test/updateLargeObject1': {
          draft.largeObject1[`propertyAdded${action.payload.value}`] = {
            id: action.payload.value,
          };
          break;
        }
        case 'test/updateLargeObject2': {
          draft.largeObject2[`propertyAdded${action.payload.value}`] = {
            id: action.payload.value,
          };
          break;
        }
        case 'test/concatArray': {
          const length = state.largeArray.length;
          const newArray = action.payload.concat(state.largeArray);
          newArray.length = length;
          draft.largeArray = newArray;
          break;
        }
        case 'test/mapNested': {
          // Extract nested data
          draft.otherData = draft.largeArray.map((item) => item.nested);
          break;
        }
        case 'test/updateHighIndex': {
          const item = draft.largeArray.find(
            (item) => item.id === action.payload.id
          );
          if (item) {
            item.value = action.payload.value;
            item.nested.data = action.payload.nestedData;
          }
          break;
        }
        case 'test/updateMultiple': {
          action.payload.forEach((update) => {
            const item = draft.largeArray.find((item) => item.id === update.id);
            if (item) {
              item.value = update.value;
              item.nested.data = update.nestedData;
            }
          });
          break;
        }
        case 'test/removeHighIndex': {
          const indexToRemove = draft.largeArray.findIndex(
            (item) => item.id === action.payload
          );
          if (indexToRemove !== -1) {
            draft.largeArray.splice(indexToRemove, 1);
          }
          break;
        }
        case 'test/sortByIdReverse': {
          draft.largeArray.sort((a, b) => b.id - a.id);
          break;
        }
        case 'test/reverseArray': {
          draft.largeArray.reverse();
          break;
        }
        case 'rtkq/pending': {
          // Simulate separate RTK slice reducers with combined reducer pattern
          const cacheKey = action.payload.cacheKey;
          draft.api.queries[cacheKey] = {
            id: action.payload.id,
            status: 'pending',
            data: undefined,
          };
          draft.api.provided.keys[cacheKey] = {};
          draft.api.subscriptions[cacheKey] = {
            [action.payload.requestId]: {
              pollingInterval: 0,
              skipPollingIfUnfocused: false,
            },
          };
          break;
        }
        case 'rtkq/resolved': {
          const cacheKey = action.payload.cacheKey;
          draft.api.queries[cacheKey].status = 'fulfilled';
          draft.api.queries[cacheKey].data = action.payload.data;
          // provided and subscriptions don't change on resolved
          break;
        }
      }
    });

  return draftReducer;
};
