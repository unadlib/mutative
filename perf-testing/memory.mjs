import assert from 'node:assert/strict';
import { Session } from 'node:inspector';
import { performance } from 'node:perf_hooks';

export function allocatedBytes(node) {
  return (
    node.selfSize +
    node.children.reduce((sum, child) => sum + allocatedBytes(child), 0)
  );
}

// Allocation sampling and retained-heap measurement are separate passes. Neither
// pass supplies latency results: inspector and explicit GC change execution.
export async function measureMemory(
  execute,
  { iterations, samplingInterval, warmup = 5 }
) {
  assert.equal(
    typeof globalThis.gc,
    'function',
    'Run memory workers with --expose-gc'
  );
  assert.ok(Number.isSafeInteger(iterations) && iterations > 0);
  assert.ok(Number.isSafeInteger(samplingInterval) && samplingInterval >= 128);
  for (let i = 0; i < warmup; i++) execute();
  const outputs = new Array(iterations).fill(null);
  function retainOutputs() {
    for (let i = 0; i < iterations; i++) outputs[i] = execute();
  }
  const session = new Session();
  session.connect();
  const post = (method, params = {}) =>
    new Promise((resolve, reject) => {
      session.post(method, params, (error, value) =>
        error ? reject(error) : resolve(value)
      );
    });
  let sampledAllocatedBytes;
  let allocationSamples;
  try {
    await post('HeapProfiler.enable');
    globalThis.gc();
    await post('HeapProfiler.startSampling', {
      samplingInterval,
      includeObjectsCollectedByMajorGC: true,
      includeObjectsCollectedByMinorGC: true,
    });
    retainOutputs();
    // Collected temporary allocations must remain in the sampled profile.
    globalThis.gc();
    const { profile } = await post('HeapProfiler.stopSampling');
    // Include the whole pass; protocol/loop overhead is small but not subtracted.
    sampledAllocatedBytes = allocatedBytes(profile.head);
    allocationSamples = profile.samples.length;
  } finally {
    session.disconnect();
    outputs.fill(null);
  }
  globalThis.gc();
  const before = process.memoryUsage();
  retainOutputs();
  const batchEnd = process.memoryUsage();
  const gcStart = performance.now();
  globalThis.gc();
  const gcAfterRetainMs = performance.now() - gcStart;
  const retained = process.memoryUsage();
  // Keep output references live until after memoryUsage; the array itself was
  // allocated before the baseline. Patches retain the last tuple per iteration.
  assert.equal(outputs.length, iterations);
  outputs.fill(null);
  globalThis.gc();
  const released = process.memoryUsage();
  return {
    iterations,
    samplingInterval,
    allocationSamples,
    sampledAllocatedBytes,
    sampledAllocatedBytesPerIteration: sampledAllocatedBytes / iterations,
    retainedHeapDeltaBytes: retained.heapUsed - before.heapUsed,
    retainedHeapBytesPerIteration:
      (retained.heapUsed - before.heapUsed) / iterations,
    batchEndHeapDeltaBytes: batchEnd.heapUsed - before.heapUsed,
    rssDeltaBytes: batchEnd.rss - before.rss,
    gcAfterRetainMs,
    releasedHeapDeltaBytes: released.heapUsed - before.heapUsed,
    snapshots: { before, batchEnd, retained, released },
  };
}
