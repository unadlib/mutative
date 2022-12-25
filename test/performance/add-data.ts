// @ts-nocheck
'use strict';

import produce, { setAutoFreeze, setUseProxies, enableAllPlugins } from 'immer';
import lodash from 'lodash';
import { fromJS } from 'immutable';
import Seamless from 'seamless-immutable';
import deepFreeze from 'deep-freeze';
import { measure } from './measure';
import { create } from '../../src';

const { cloneDeep } = lodash;

enableAllPlugins();

console.log('\n# add-data - loading large set of data\n');

const dataSet = require('./data.json');
const baseState = {
  data: null,
};
const frozenBazeState = deepFreeze(cloneDeep(baseState));
const immutableJsBaseState = fromJS(baseState);
const seamlessBaseState = Seamless.from(baseState);

const MAX = 10000;
const time = 100;

measure(
  'just mutate',
  () => ({ draft: cloneDeep(baseState) }),
  ({ draft }) => {
    draft.data = dataSet;
  },
  time
);

measure(
  'just mutate, freeze',
  () => ({ draft: cloneDeep(baseState) }),
  ({ draft }) => {
    draft.data = dataSet;
    deepFreeze(draft);
  },
  time
);

measure(
  'handcrafted reducer (no freeze)',
  () => {},
  () => {
    const nextState = {
      ...baseState,
      data: dataSet,
    };
  },
  time
);

measure(
  'handcrafted reducer (with freeze)',
  () => {},
  () => {
    const nextState = deepFreeze({
      ...baseState,
      data: dataSet,
    });
  },
  time
);

measure(
  'immutableJS',
  () => {},
  () => {
    let state = immutableJsBaseState.withMutations((state) => {
      state.setIn(['data'], fromJS(dataSet));
    });
  },
  time
);

measure(
  'immutableJS + toJS',
  () => {},
  () => {
    let state = immutableJsBaseState
      .withMutations((state) => {
        state.setIn(['data'], fromJS(dataSet));
      })
      .toJS();
  },
  time
);

measure(
  'seamless-immutable',
  () => {},
  () => {
    seamlessBaseState.set('data', dataSet);
  },
  time
);

measure(
  'seamless-immutable + asMutable',
  () => {},
  () => {
    seamlessBaseState.set('data', dataSet).asMutable({ deep: true });
  },
  time
);

measure(
  'immer (proxy) - without autofreeze * ' + MAX,
  () => cloneDeep(baseState),
  () => {
    setUseProxies(true);
    setAutoFreeze(false);
    for (let i = 0; i < MAX; i++)
      produce(baseState, (draft) => {
        draft.data = dataSet;
      });
  },
  time
);

measure(
  'immer (proxy) - with autofreeze * ' + MAX,
  () => cloneDeep(baseState),
  (baseState) => {
    setUseProxies(true);
    setAutoFreeze(true);
    for (let i = 0; i < MAX; i++)
      produce(baseState, (draft) => {
        draft.data = dataSet;
      });
  },
  time
);

measure(
  'immer (es5) - without autofreeze * ' + MAX,
  () => cloneDeep(baseState),
  (baseState) => {
    setUseProxies(false);
    setAutoFreeze(false);
    for (let i = 0; i < MAX; i++)
      produce(baseState, (draft) => {
        draft.data = dataSet;
      });
  },
  time
);

measure(
  'immer (es5) - with autofreeze * ' + MAX,
  () => cloneDeep(baseState),
  (baseState) => {
    setUseProxies(false);
    setAutoFreeze(true);
    for (let i = 0; i < MAX; i++)
      produce(baseState, (draft) => {
        draft.data = dataSet;
      });
  },
  time
);

measure(
  'mutative without autofreeze * ' + MAX,
  () => cloneDeep(baseState),
  (baseState) => {
    for (let i = 0; i < MAX; i++)
      create(baseState, (draft) => {
        draft.data = dataSet;
      });
  }
);

measure(
  'mutative with autofreeze * ' + MAX,
  () => cloneDeep(baseState),
  (baseState) => {
    for (let i = 0; i < MAX; i++)
      create(
        baseState,
        (draft) => {
          draft.data = dataSet;
        },
        {
          enableAutoFreeze: true,
        }
      );
  },
  time
);
