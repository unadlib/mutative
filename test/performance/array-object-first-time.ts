// @ts-nocheck
'use strict';

import { produce, setUseProxies, setAutoFreeze, enableMapSet } from 'immer';
import { create } from '../../src';
import { measure } from './measure';

enableMapSet();
// produce the base state
// https://github.com/immerjs/immer/issues/649
const getData = () => {
  const MAX = 200000;
  const arrayBaseState: any = [];
  const objectBaseState: any = {};
  const mapBaseState: any = new Map();

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
  return { arrayBaseState, objectBaseState, mapBaseState };
};

measure(
  '[FIRST-TIME][ARRAY] immer (proxy) - without autofreeze',
  () => {
    setUseProxies(true);
    setAutoFreeze(false);
    return getData().arrayBaseState;
  },
  (arrayBaseState: any) => {
    produce(arrayBaseState, (draft: any) => {
      draft[0].done = true;
    });
  }
);

measure(
  '[FIRST-TIME][OBJECT] immer (proxy) - without autofreeze',
  () => {
    setUseProxies(true);
    setAutoFreeze(false);
    return getData().objectBaseState;
  },
  (objectBaseState: any) => {
    produce(objectBaseState, (draft: any) => {
      draft[`id-0`].done = true;
    });
  }
);

measure(
  '[FIRST-TIME][MAP] immer (proxy) - without autofreeze',
  () => {
    setUseProxies(true);
    setAutoFreeze(false);
    return getData().mapBaseState;
  },
  (mapBaseState: any) => {
    produce(mapBaseState, (draft: any) => {
      draft.get('id-0').done = true;
    });
  }
);

measure(
  '[FIRST-TIME][ARRAY] immer (proxy) - with autofreeze',
  () => {
    setUseProxies(true);
    setAutoFreeze(true);
    return getData().arrayBaseState;
  },
  (arrayBaseState: any) => {
    produce(arrayBaseState, (draft: any) => {
      draft[0].done = true;
    });
  }
);

measure(
  '[FIRST-TIME][OBJECT] immer (proxy) - with autofreeze',
  () => {
    setUseProxies(true);
    setAutoFreeze(true);
    return getData().objectBaseState;
  },
  (objectBaseState: any) => {
    produce(objectBaseState, (draft: any) => {
      draft[`id-0`].done = true;
    });
  }
);

measure(
  '[FIRST-TIME][MAP] immer (proxy) - with autofreeze',
  () => {
    setUseProxies(true);
    setAutoFreeze(true);
    return getData().mapBaseState;
  },
  (mapBaseState: any) => {
    produce(mapBaseState, (draft: any) => {
      draft.get('id-0').done = true;
    });
  }
);

console.log('----------------------------------------');

measure(
  '[FIRST-TIME][ARRAY] mutative (proxy) - without autofreeze',
  () => {
    return getData().arrayBaseState;
  },
  (arrayBaseState: any) => {
    create(arrayBaseState, (draft: any) => {
      draft[0].done = true;
    });
  }
);

measure(
  '[FIRST-TIME][OBJECT] mutative (proxy) - without autofreeze',
  () => {
    return getData().objectBaseState;
  },
  (objectBaseState: any) => {
    create(objectBaseState, (draft: any) => {
      draft[`id-0`].done = true;
    });
  }
);

measure(
  '[FIRST-TIME][MAP] mutative (proxy) - without autofreeze',
  () => {
    return getData().mapBaseState;
  },
  (mapBaseState: any) => {
    create(mapBaseState, (draft: any) => {
      draft.get('id-0').done = true;
    });
  }
);

measure(
  '[FIRST-TIME][ARRAY] mutative (proxy) - with autofreeze',
  () => {
    return getData().arrayBaseState;
  },
  (arrayBaseState: any) => {
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
  '[FIRST-TIME][OBJECT] mutative (proxy) - with autofreeze',
  () => {
    return getData().objectBaseState;
  },
  (objectBaseState: any) => {
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
  '[FIRST-TIME][MAP] mutative (proxy) - with autofreeze',
  () => {
    return getData().mapBaseState;
  },
  (mapBaseState: any) => {
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
