import { create } from '../src';

global.__DEV__ = true;

describe('create() on a draft', () => {
  test('drafts a copy whose unchanged values are objects of the base state, and warns once', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const base = { x: { name: 'a', child: { v: 0 } } };
    const rename = (node: typeof base.x, name: string) =>
      create(node, (draft) => {
        draft.name = name;
      });
    const state = create(base, (draft) => {
      draft.x = rename(draft.x, 'b');
      // The child the helper left unchanged is the object of the base state.
      expect(draft.x.child).toBe(base.x.child);
      draft.x = rename(draft.x, 'c');
    });
    expect(state).toEqual({ x: { name: 'c', child: { v: 0 } } });
    expect(base).toEqual({ x: { name: 'a', child: { v: 0 } } });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain(
      'https://github.com/unadlib/mutative/issues/160'
    );
    warn.mockRestore();
  });
});
