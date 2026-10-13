import assert from 'node:assert/strict';
import { Session } from 'node:inspector';
import { performance } from 'node:perf_hooks';

export function allocatedBytes(node) {
  return (
    node.selfSize +
    node.children.reduce((sum, child) => sum + allocatedBytes(child), 0)
  );
}

// A heap reading right after a full GC can include hundreds of KiB that the
// next GC reclaims, as on GitHub's Linux runners with Node 24, so read the heap
// after several collections and keep the lowest reading.
function collectedMemoryUsage() {
  let lowest;
  for (let i = 0; i < 3; i++) {
    globalThis.gc();
    const usage = process.memoryUsage();
    if (!lowest || usage.heapUsed < lowest.heapUsed) lowest = usage;
  }
  return lowest;
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
  const before = collectedMemoryUsage();
  retainOutputs();
  const batchEnd = process.memoryUsage();
  const gcStart = performance.now();
  globalThis.gc();
  const gcAfterRetainMs = performance.now() - gcStart;
  const retained = collectedMemoryUsage();
  // Observe the contents after measurement, keeping every output live through GC.
  // Patches retain the last tuple per iteration. Avoid storing an output in a
  // separate local, which would keep it alive after clearing the holder.
  let observedOutputs = 0;
  for (let i = 0; i < outputs.length; i++)
    if (outputs[i] !== undefined) observedOutputs++;
  assert.equal(observedOutputs, iterations);
  outputs.fill(null);
  const released = collectedMemoryUsage();
  return {
    iterations,
    samplingInterval,
    allocationSamples,
    sampledAllocatedBytes,
    sampledAllocatedBytesPerIteration: sampledAllocatedBytes / iterations,
    // Compare live outputs to their released state, cancelling persistent JIT
    // and runtime-cache growth during the pass. Preserve the raw before delta.
    postGcHeapDeltaBytes: retained.heapUsed - before.heapUsed,
    retainedHeapDeltaBytes: retained.heapUsed - released.heapUsed,
    retainedHeapBytesPerIteration:
      (retained.heapUsed - released.heapUsed) / iterations,
    batchEndHeapDeltaBytes: batchEnd.heapUsed - before.heapUsed,
    rssDeltaBytes: batchEnd.rss - before.rss,
    gcAfterRetainMs,
    releasedHeapDeltaBytes: released.heapUsed - before.heapUsed,
    snapshots: { before, batchEnd, retained, released },
  };
}
