test('set - Set.prototype.difference is not supported', () => {
  // @ts-ignore
  if (Set.prototype.difference) {
    // @ts-ignore
    delete Set.prototype.difference;
    const { create } = require('../src');
    const state = new Set([1, 2, 3]);
    // @ts-ignore
    const newState = create(state, (draft) => {
      expect(draft.difference).toBeUndefined();
    });
    expect(newState).toEqual(state);
  }
});
