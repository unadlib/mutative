// @ts-nocheck
'use strict';

import { produce, setUseProxies, setAutoFreeze, enableMapSet } from 'immer';
import { create } from '../..';
import { measure } from './measure';
import './array-object-first-time';

console.log('----------------------------------------');
console.log('----------------------------------------');

enableMapSet();

const MAX = 200000;
const arrayBaseState: any = [];
const objectBaseState: any = {};
const mapBaseState: any = new Map();

// produce the base state
// https://github.com/immerjs/immer/issues/649

for (let i = 0; i < MAX; i++) {
  const id = `id-${i}`;

  arrayBaseState.push({
    id: id,
    todo: 'todo_' + i,
    done: false,
    someThingCompletelyIrrelevant: [1, 2, 3, 4, 5, 6, 7, 8, 9, 0],
  });

  objectBaseState[id] = {
    id: id,
    todo: 'todo_' + i,
    done: false,
    someThingCompletelyIrrelevant: [1, 2, 3, 4, 5, 6, 7, 8, 9, 0],
  };

  mapBaseState.set(id, {
    id: id,
    todo: 'todo_' + i,
    done: false,
    someThingCompletelyIrrelevant: [1, 2, 3, 4, 5, 6, 7, 8, 9, 0],
  });
}

measure(
  '[ARRAY] immer (proxy) - without autofreeze',
  () => {
    setUseProxies(true);
    setAutoFreeze(false);
  },
  () => {
    produce(arrayBaseState, (draft: any) => {
      draft[0].done = true;
    });
  }
);

measure(
  '[OBJECT] immer (proxy) - without autofreeze',
  () => {
    setUseProxies(true);
    setAutoFreeze(false);
  },
  () => {
    produce(objectBaseState, (draft: any) => {
      draft[`id-0`].done = true;
    });
  }
);

measure(
  '[MAP] immer (proxy) - without autofreeze',
  () => {
    setUseProxies(true);
    setAutoFreeze(false);
  },
  () => {
    produce(mapBaseState, (draft: any) => {
      draft.get('id-0').done = true;
    });
  }
);

measure(
  '[ARRAY] immer (proxy) - with autofreeze',
  () => {
    setUseProxies(true);
    setAutoFreeze(true);
  },
  () => {
    produce(arrayBaseState, (draft: any) => {
      draft[0].done = true;
    });
  }
);

measure(
  '[OBJECT] immer (proxy) - with autofreeze',
  () => {
    setUseProxies(true);
    setAutoFreeze(true);
  },
  () => {
    produce(objectBaseState, (draft: any) => {
      draft[`id-0`].done = true;
    });
  }
);

measure(
  '[MAP] immer (proxy) - with autofreeze',
  () => {
    setUseProxies(true);
    setAutoFreeze(true);
  },
  () => {
    produce(mapBaseState, (draft: any) => {
      draft.get('id-0').done = true;
    });
  }
);

console.log('----------------------------------------');

measure(
  '[ARRAY] mutative (proxy) - without autofreeze',
  () => {},
  () => {
    create(arrayBaseState, (draft: any) => {
      draft[0].done = true;
    });
  }
);

measure(
  '[OBJECT] mutative (proxy) - without autofreeze',
  () => {},
  () => {
    create(objectBaseState, (draft: any) => {
      draft[`id-0`].done = true;
    });
  }
);

measure(
  '[MAP] mutative (proxy) - without autofreeze',
  () => {},
  () => {
    create(mapBaseState, (draft: any) => {
      draft.get('id-0').done = true;
    });
  }
);

measure(
  '[ARRAY] mutative (proxy) - with autofreeze',
  () => {},
  () => {
    create(
      arrayBaseState,
      (draft: any) => {
        draft[0].done = true;
      },
      {
        enableAutoFreeze: true,
      }
    );
  }
);

measure(
  '[OBJECT] mutative (proxy) - with autofreeze',
  () => {},
  () => {
    create(
      objectBaseState,
      (draft: any) => {
        draft[`id-0`].done = true;
      },
      {
        enableAutoFreeze: true,
      }
    );
  }
);

measure(
  '[MAP] mutative (proxy) - with autofreeze',
  () => {},
  () => {
    create(
      mapBaseState,
      (draft: any) => {
        draft.get('id-0').done = true;
      },
      {
        enableAutoFreeze: true,
      }
    );
  }
);
