import { assert, _ } from './assert';
import { create, Draft } from '../../src';
import * as redux from 'redux';

// Mutable Redux
{
  interface State {
    counter: number;
  }

  interface Action {
    type: string;
    payload: number;
  }

  const initialState: State = {
    counter: 0,
  };

  /// =============== Actions

  const reduceCounterProducer = (state: State = initialState, action: Action) =>
    create(state, (draftState) => {
      switch (action.type) {
        case 'ADD_TO_COUNTER':
          draftState.counter += action.payload;
          break;
        case 'SUB_FROM_COUNTER':
          draftState.counter -= action.payload;
          break;
      }
    });

  // const reduceCounterCurriedProducer = create(
  //   (draftState: State, action: Action) => {
  //     switch (action.type) {
  //       case 'ADD_TO_COUNTER':
  //         draftState.counter += action.payload;
  //         break;
  //       case 'SUB_FROM_COUNTER':
  //         draftState.counter -= action.payload;
  //         break;
  //     }
  //   },
  //   initialState
  // );

  /// =============== Reducers

  const reduce = redux.combineReducers({
    counterReducer: reduceCounterProducer,
  });

  // const curredReduce = redux.combineReducers({
  //   counterReducer: reduceCounterCurriedProducer,
  // });

  // reducing the current state to get the next state!
  // console.log(reduce(initialState, addToCounter(12));

  // ================ store

  const store = redux.createStore(reduce);
  // const curriedStore = redux.createStore(curredReduce);

  it('#470 works with Redux combine reducers', () => {
    assert(
      store.getState().counterReducer,
      _ as {
        counter: number;
      }
    );
    // assert(
    //   curriedStore.getState().counterReducer,
    //   _ as {
    //     counter: number;
    //   }
    // );
  });
}

// Readonly Redux
{
  {
    interface State {
      readonly counter: number;
    }

    interface Action {
      readonly type: string;
      readonly payload: number;
    }

    const initialState: State = {
      counter: 0,
    };

    /// =============== Actions

    const reduceCounterProducer = (
      state: State = initialState,
      action: Action
    ) =>
      create(state, (draftState) => {
        switch (action.type) {
          case 'ADD_TO_COUNTER':
            draftState.counter += action.payload;
            break;
          case 'SUB_FROM_COUNTER':
            draftState.counter -= action.payload;
            break;
        }
      });

    // const reduceCounterCurriedProducer = create(
    //   (draftState: Draft<State>, action: Action) => {
    //     switch (action.type) {
    //       case 'ADD_TO_COUNTER':
    //         draftState.counter += action.payload;
    //         break;
    //       case 'SUB_FROM_COUNTER':
    //         draftState.counter -= action.payload;
    //         break;
    //     }
    //   },
    //   initialState
    // );

    /// =============== Reducers

    const reduce = redux.combineReducers({
      counterReducer: reduceCounterProducer,
    });

    // const curredReduce = redux.combineReducers({
    //   counterReducer: reduceCounterCurriedProducer,
    // });

    // reducing the current state to get the next state!
    // console.log(reduce(initialState, addToCounter(12));

    // ================ store

    const store = redux.createStore(reduce);
    // const curriedStore = redux.createStore(curredReduce);

    it('#470 works with Redux combine readonly reducers', () => {
      assert(
        store.getState().counterReducer,
        _ as {
          readonly counter: number;
        }
      );
      // assert(
      //   curriedStore.getState().counterReducer,
      //   _ as {
      //     readonly counter: number;
      //   }
      // );
    });
  }
}

it('works with inferred curried reducer', () => {
  type State = {
    count: number;
  };

  type Action = {
    type: 'inc';
    count: number;
  };

  const defaultState = {
    count: 3,
  };

  const store = redux.createStore(
    (state: State = defaultState, action: Action) =>
      create(state, (draftState) => {
        if (action.type === 'inc') draftState.count += action.count;
        // @ts-expect-error
        draftState.count2;
      })
  );

  assert(store.getState(), _ as State);
  store.dispatch({
    type: 'inc',
    count: 2,
  });

  store.dispatch({
    // @ts-expect-error
    type: 'inc2',
    count: 2,
  });
});

it('works with inferred curried reducer - readonly', () => {
  type State = {
    readonly count: number;
  };

  type Action = {
    readonly type: 'inc';
    readonly count: number;
  };

  const defaultState: State = {
    count: 3,
  };

  const store = redux.createStore(
    (state: State = defaultState, action: Action) =>
      create(state, (draftState: Draft<State>) => {
        if (action.type === 'inc') draftState.count += action.count;
        // @ts-expect-error
        draftState.count2;
      })
  );

  assert(store.getState(), _ as State);
  store.dispatch({
    type: 'inc',
    count: 2,
  });

  store.dispatch({
    // @ts-expect-error
    type: 'inc2',
    count: 2,
  });
});
