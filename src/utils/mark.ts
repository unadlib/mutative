import { ProxyDraft } from '../interface';

export function markChanged(proxyDraft: ProxyDraft, key?: string | number | symbol, operation?: {
  kind: 'set' | 'delete' | 'map.set' | 'map.delete' | 'map.clear' | 'set.add' | 'set.delete' | 'set.clear';
  prev?: any;
  next?: any;
  value?: any;
  existed?: boolean;
}) {
  proxyDraft.assignedMap = proxyDraft.assignedMap ?? new Map();
  if (!proxyDraft.operated) {
    proxyDraft.operated = true;
    if (proxyDraft.parent) {
      markChanged(proxyDraft.parent);
    }
  }
  
  // Emit operation hook if provided
  if (operation && proxyDraft.options.hooks?.onOperation) {
    try {
      // Build path from root to this node
      const path: (string | number)[] = [];
      let current: ProxyDraft | null = proxyDraft;
      
      while (current && current.parent) {
        if (current.key !== undefined) {
          path.unshift(current.key as string | number);
        }
        current = current.parent;
      }
      
      // Add the current key if provided
      if (key !== undefined) {
        path.push(key as string | number);
      }
      
      proxyDraft.options.hooks.onOperation({
        ...operation,
        path,
        key,
      });
    } catch (e) {
      // Be conservative: never throw from hooks
    }
  }
}
