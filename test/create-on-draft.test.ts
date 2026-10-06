import { create, isDraft, makeCreator } from '../src';

global.__DEV__ = true;

type Node = { name: string; metadata: { value: string } };

// A helper that calls create() on a draft, whose result the outer recipe then
// changes where the helper left it unchanged.
function visit(options?: { cloneDraftBase?: <T>(state: T) => T }) {
  const original = { nodes: [{ name: 'a', metadata: { value: '' } }] };
  const rename = (node: Node, name: string) =>
    create(
      node,
      (draft) => {
        draft.name = name;
      },
      options
    );
  const result = create(original, (draft) => {
    draft.nodes = draft.nodes.map((node) => {
      const renamed = rename(node, 'b');
      renamed.metadata.value = 'changed';
      return renamed;
    });
  });
  return { original, result };
}

// It runs before the warning below, which development builds give only once.
describe('the cloneDraftBase option', () => {
  test('a helper result that the outer recipe changes leaves the base state unchanged', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { original, result } = visit({ cloneDraftBase: structuredClone });
    expect(original).toEqual({
      nodes: [{ name: 'a', metadata: { value: '' } }],
    });
    expect(result).toEqual({
      nodes: [{ name: 'b', metadata: { value: 'changed' } }],
    });
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  test('the function receives the current state of the draft', () => {
    const received: unknown[] = [];
    const clone = <T>(state: T): T => {
      received.push(state);
      return structuredClone(state);
    };
    const base = { x: { v: 0, child: { w: 0 } } };
    const state = create(base, (draft) => {
      draft.x.v = 1;
      draft.x = create(
        draft.x,
        (x) => {
          x.child.w = 2;
        },
        { cloneDraftBase: clone }
      );
    });
    expect(received).toHaveLength(1);
    expect(isDraft(received[0])).toBe(false);
    expect(received[0]).toEqual({ v: 1, child: { w: 0 } });
    expect(state).toEqual({ x: { v: 1, child: { w: 2 } } });
    expect(base).toEqual({ x: { v: 0, child: { w: 0 } } });
  });

  test('a creator from makeCreator() uses it, also for create(draft) without a recipe', () => {
    const createDetached = makeCreator({ cloneDraftBase: structuredClone });
    const base = {
      item: { tags: new Set(['a']), meta: new Map([['k', { v: 0 }]]) },
    };
    create(base, (draft) => {
      const [copy, finalize] = createDetached(draft.item);
      copy.tags.add('b');
      const result = finalize();
      expect(result.meta.get('k')).toEqual({ v: 0 });
      expect(result.meta.get('k')).not.toBe(base.item.meta.get('k'));
      result.meta.get('k')!.v = 1;
      expect([...result.tags]).toEqual(['a', 'b']);
    });
    expect(base.item.meta.get('k')).toEqual({ v: 0 });
    expect([...base.item.tags]).toEqual(['a']);
  });
});

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
      'https://mutative.js.org/docs/api-reference/create#create-on-a-draft'
    );
    warn.mockRestore();
  });
});
