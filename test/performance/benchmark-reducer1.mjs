import { produce as produce10, setAutoFreeze as setAutoFreeze10 } from 'immer';
import { create as produceMutative } from '../..';
import { bench, run, summary } from 'mitata';

// repo: https://github.com/markerikson/immer-perf-tests
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

const immerProducers = {
  immer10: produce10,
  mutative: (data, fn, options) =>
    produceMutative(data, fn, { ...options, enableOptimizedArray: false }),
  mutativeOptimized: (data, fn, options) =>
    produceMutative(data, fn, { ...options, enableOptimizedArray: true }),
};

const setAutoFreezes = {
  vanilla: () => {},
  immer10: setAutoFreeze10,
  mutative: () => {},
  mutativeOptimized: () => {},
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

const createImmerReducer = (produce) => {
  const immerReducer = (state = createInitialState(), action) =>
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

  return immerReducer;
};

function mapValues(obj, fn) {
  const result = {};
  for (const key in obj) {
    result[key] = fn(obj[key]);
  }
  return result;
}

const reducers = {
  vanilla: vanillaReducer,
  ...mapValues(immerProducers, createImmerReducer),
};

function createBenchmarks() {
  for (const action in actions) {
    summary(function () {
      bench(`$action: $version (freeze: $freeze)`, function* (args) {
        const version = args.get('version');
        const freeze = args.get('freeze');
        const action = args.get('action');

        const initialState = createInitialState();

        function benchMethod() {
          setAutoFreezes[version](freeze);
          for (let i = 0; i < MAX; i++) {
            reducers[version](initialState, actions[action](i));
          }
          setAutoFreezes[version](false);
        }

        yield benchMethod;
      }).args({
        version: Object.keys(reducers),
        freeze: [false, true],
        action: [action],
      });
    });
  }
}

async function main() {
  createBenchmarks();
  await run();
}

main();
