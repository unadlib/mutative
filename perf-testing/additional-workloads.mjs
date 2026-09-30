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
      return [];
  }
}

export function reduceAdditional(state, action) {
  switch (action.type) {
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
      return state;
  }
}

export function applyAdditionalRecipe(draft, action, consumeRead) {
  switch (action.type) {
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
      throw new Error(`Unknown additional recipe: ${action.type}`);
  }
}
