import {
  applyExtendedRecipe,
  expectedExtendedReads,
  reduceExtended,
} from './extended-workloads.mjs';

// Additional fixtures omit the upstream wide objects so small-state and pure
// array measurements do not silently retain unrelated large graphs.
export function createArrayState(config, shape = 'nested') {
  return {
    rows: Array.from({ length: config.arraySize }, (_, i) =>
      shape === 'primitive'
        ? i
        : shape === 'shallow'
          ? { value: i }
          : {
              value: i,
              nested: { value: i + 1 },
              items: Array.from({ length: config.nestedArraySize }, (_, j) => ({
                value: j,
              })),
            }
    ),
    stable: { value: 'untouched' },
  };
}

export function createAdditionalScenarios(config) {
  const array = (name, type) => ({
    name,
    steps: [{ type: `bench/${type}` }],
    createBase: () => createArrayState(config),
  });
  return [
    ...['index', 'forEach', 'iterator', 'missing', 'length'].map((method) =>
      array(`read-${method}`, `read-${method}`)
    ),
    array('noop-empty', 'noop-empty'),
    array('noop-same-value', 'noop-same-value'),
    {
      name: 'small-object-update',
      steps: [{ type: 'bench/small-object-update' }],
      createBase: () => ({
        value: 1,
        nested: { value: 2 },
        stable: { value: 'untouched' },
      }),
    },
    ...[1, 10].map((size) => ({
      name: `small-array-${size}-update`,
      steps: [{ type: 'bench/small-array-update' }],
      createBase: () =>
        createArrayState({ ...config, arraySize: size, nestedArraySize: 1 }),
    })),
    ...[1, 10, 100].map((percent) => ({
      name: `mutation-density-${percent}pct`,
      steps: [
        {
          type: 'bench/density',
          count: Math.max(1, Math.ceil((config.arraySize * percent) / 100)),
        },
      ],
      createBase: () => createArrayState(config),
    })),
    ...['primitive', 'shallow', 'nested'].flatMap((shape) =>
      [
        'push',
        'pop',
        'shift',
        'unshift',
        'splice-insert',
        'splice-remove',
        'splice-replace',
        'fill',
        'copyWithin',
        'sort',
        'reverse',
      ].map((operation) => ({
        name: `array-${operation}-${shape}`,
        steps: [
          {
            type: 'bench/array',
            operation,
            index: Math.floor(config.arraySize / 2),
            payload: createArrayState({ ...config, arraySize: 1 }, shape)
              .rows[0],
          },
        ],
        createBase: () => {
          const base = createArrayState(config, shape);
          if (operation === 'sort') {
            // Deterministic Fisher-Yates shuffle; sort always does useful work.
            let seed = 42;
            for (let i = base.rows.length - 1; i > 0; i--) {
              seed = (seed * 16807) % 2147483647;
              const j = seed % (i + 1);
              [base.rows[i], base.rows[j]] = [base.rows[j], base.rows[i]];
            }
          }
          return base;
        },
      }))
    ),
  ];
}

// Reference reads use native array reduction, independently of draft traversal.
export function expectedReads(state, action) {
  switch (action.type) {
    case 'bench/read-index':
    case 'bench/read-forEach':
    case 'bench/read-iterator':
      return [state.rows.reduce((sum, row) => sum + row.nested.value, 0)];
    case 'bench/read-missing':
      return [!state.rows.some((row) => row.value === -1)];
    case 'bench/read-length':
      return [state.rows.length];
    default:
      return expectedExtendedReads(state, action);
  }
}

export function reduceAdditional(state, action) {
  switch (action.type) {
    case 'bench/density':
      return {
        ...state,
        rows: state.rows.map((row, i) =>
          i < action.count
            ? { ...row, nested: { ...row.nested, value: row.nested.value + 1 } }
            : row
        ),
      };
    case 'bench/array': {
      const { rows } = state;
      const { operation, index, payload } = action;
      let next;
      switch (operation) {
        case 'push':
          next = [...rows, payload];
          break;
        case 'pop':
          next = rows.slice(0, -1);
          break;
        case 'shift':
          next = rows.slice(1);
          break;
        case 'unshift':
          next = [payload, ...rows];
          break;
        case 'splice-insert':
          next = [...rows.slice(0, index), payload, ...rows.slice(index)];
          break;
        case 'splice-remove':
          next = [...rows.slice(0, index), ...rows.slice(index + 1)];
          break;
        case 'splice-replace':
          next = rows.map((row, i) => (i === index ? payload : row));
          break;
        case 'fill':
          next = rows.map((row, i) =>
            i >= index && i < index + 3 ? payload : row
          );
          break;
        case 'copyWithin':
          next = rows.map((row, i) =>
            i >= index && i < index + 3 ? rows[i - index] : row
          );
          break;
        case 'sort':
          next = rows.toSorted((a, b) => rowValue(a) - rowValue(b));
          break;
        case 'reverse':
          next = rows.toReversed();
          break;
        default:
          throw new Error(`Unknown array reference: ${operation}`);
      }
      return { ...state, rows: next };
    }
    case 'bench/small-object-update':
      return {
        ...state,
        nested: { ...state.nested, value: state.nested.value + 1 },
      };
    case 'bench/small-array-update':
      return {
        ...state,
        rows: state.rows.map((row, i) =>
          i ? row : { ...row, value: row.value + 1 }
        ),
      };
    default:
      return reduceExtended(state, action);
  }
}

export function applyAdditionalRecipe(
  draft,
  action,
  consumeRead,
  state,
  rawReturn,
  current
) {
  switch (action.type) {
    case 'bench/density':
      for (let i = 0; i < action.count; i++) draft.rows[i].nested.value += 1;
      break;
    case 'bench/array': {
      const { operation, index, payload } = action;
      switch (operation) {
        case 'push':
          draft.rows.push(payload);
          break;
        case 'pop':
          draft.rows.pop();
          break;
        case 'shift':
          draft.rows.shift();
          break;
        case 'unshift':
          draft.rows.unshift(payload);
          break;
        case 'splice-insert':
          draft.rows.splice(index, 0, payload);
          break;
        case 'splice-remove':
          draft.rows.splice(index, 1);
          break;
        case 'splice-replace':
          draft.rows.splice(index, 1, payload);
          break;
        case 'fill':
          draft.rows.fill(payload, index, index + 3);
          break;
        case 'copyWithin':
          draft.rows.copyWithin(index, 0, 3);
          break;
        case 'sort':
          draft.rows.sort((a, b) => rowValue(a) - rowValue(b));
          break;
        case 'reverse':
          draft.rows.reverse();
          break;
        default:
          throw new Error(`Unknown array recipe: ${operation}`);
      }
      break;
    }
    case 'bench/read-index': {
      let sum = 0;
      for (let i = 0; i < draft.rows.length; i++)
        sum += draft.rows[i].nested.value;
      consumeRead(sum);
      break;
    }
    case 'bench/read-forEach': {
      let sum = 0;
      draft.rows.forEach((row) => {
        sum += row.nested.value;
      });
      consumeRead(sum);
      break;
    }
    case 'bench/read-iterator': {
      let sum = 0;
      for (const row of draft.rows) sum += row.nested.value;
      consumeRead(sum);
      break;
    }
    case 'bench/read-missing':
      consumeRead(draft.rows.find((row) => row.value === -1) === undefined);
      break;
    case 'bench/read-length':
      consumeRead(draft.rows.length);
      break;
    case 'bench/noop-empty':
      break;
    case 'bench/noop-same-value':
      draft.rows[0].value = draft.rows[0].value;
      break;
    case 'bench/small-object-update':
      draft.nested.value += 1;
      break;
    case 'bench/small-array-update':
      draft.rows[0].value += 1;
      break;
    default:
      return applyExtendedRecipe(
        draft,
        action,
        consumeRead,
        state,
        rawReturn,
        current
      );
  }
  return undefined;
}

function rowValue(row) {
  return typeof row === 'object' ? row.value : row;
}
