import { ProxyDraft, OperationEvent } from '../interface';
import { ensureShallowCopy } from './copy';

/**
 * Get the path to a proxy draft node
 */
function getPath(proxyDraft: ProxyDraft): (string | number)[] | null {
  const path: (string | number)[] = [];
  let current: ProxyDraft | null = proxyDraft;
  
  while (current && current.parent) {
    if (current.key !== undefined) {
      path.unshift(current.key as string | number);
    }
    current = current.parent;
  }
  
  return path;
}

/**
 * Emit an operation event through the hooks system
 */
export function _emitOp(proxyDraft: ProxyDraft | null, key: any, evt: Omit<OperationEvent, 'path'>): void {
  const hooks = proxyDraft && proxyDraft.options && proxyDraft.options.hooks;
  const onOperation = hooks && hooks.onOperation;
  if (!onOperation) return;
  
  // Ensure path is computed against the *current* draft node.
  // getPath(proxyDraft) returns the path to the container; append key when present.
  try {
    // ensure the container has a shallow copy so getPath() can validate
    ensureShallowCopy(proxyDraft);
    const basePath = getPath(proxyDraft);
    if (!basePath) return;
    const path = (key === undefined) ? basePath.slice() : basePath.concat([key]);
    onOperation(Object.assign({ path }, evt));
  } catch (e) {
    // Be conservative: never throw from hooks
  }
}