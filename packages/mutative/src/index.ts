const createDraft = <T>(state: T): T => {
  const { proxy, revoke } = Proxy.revocable<any>(state, {
    get: (target, prop) => {
      if (prop in target) return target[prop];
    },
    set: (target, prop, value) => {
      return true;
    },
  });
  return proxy;
};

export const create = <T>(initialState: T, mutate: (draft: T) => void): T => {
  const draft = createDraft(initialState);
  const result = mutate(draft) as any;
  return result;
};
