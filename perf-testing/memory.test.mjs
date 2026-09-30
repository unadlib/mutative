import assert from 'node:assert/strict';
import test from 'node:test';
import { measureMemory } from './memory.mjs';

test('allocation and retained heap distinguish copied outputs from shared inputs', async () => {
  const shared = new Array(4096).fill(17);
  const options = { iterations: 64, samplingInterval: 256, warmup: 5 };
  const identity = await measureMemory(() => shared, options);
  const copying = await measureMemory(() => shared.slice(), options);
  assert.ok(
    copying.sampledAllocatedBytesPerIteration >
      identity.sampledAllocatedBytesPerIteration + 16 * 1024
  );
  assert.ok(
    copying.retainedHeapBytesPerIteration >
      identity.retainedHeapBytesPerIteration + 16 * 1024
  );
  assert.ok(Number.isFinite(copying.snapshots.released.rss));
});

test('allocation sampling includes temporary objects collected by major GC', async () => {
  const shared = { value: 1 };
  let checksum = 0;
  const metrics = await measureMemory(
    () => {
      let temporary = new Array(8192).fill(17);
      checksum += temporary[123];
      temporary = null;
      globalThis.gc();
      return shared;
    },
    { iterations: 8, samplingInterval: 256, warmup: 0 }
  );
  assert.equal(checksum, 8 * 2 * 17); // separate allocation and retention passes
  assert.ok(metrics.sampledAllocatedBytesPerIteration > 32 * 1024);
});

test('retained-output heap excludes persistent cache growth during the pass', async () => {
  const shared = { value: 1 };
  let calls = 0;
  let cache;
  const metrics = await measureMemory(
    () => {
      if (++calls === 22) cache = new Array(65536).fill(17); // after warmup + allocation pass
      return shared;
    },
    { iterations: 16, samplingInterval: 256, warmup: 5 }
  );
  assert.equal(cache.length, 65536);
  assert.ok(metrics.postGcHeapDeltaBytes > 400 * 1024);
  assert.ok(Math.abs(metrics.retainedHeapDeltaBytes) < 32 * 1024);
});
