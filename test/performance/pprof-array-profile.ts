/**
 * Mutative Array Operations Performance Profiling Script
 *
 * 使用 Node.js 内置的 V8 Inspector Profiler 收集 CPU profile，
 * 输出 JSON 格式便于分析。
 *
 * Usage:
 *   npx ts-node test/performance/pprof-array-profile.ts
 *
 * Then view the .cpuprofile file in Chrome DevTools
 */
// @ts-nocheck

import { writeFileSync } from 'fs';
import path from 'path';
import { Session } from 'inspector';
import { promisify } from 'util';

const baseline =
  process.env.BASELINE_MUTATIVE === '1' ||
  process.env.BASELINE_MUTATIVE === 'true';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { create } = baseline ? require('mutative-130') : require('../..');
import mutative130 from 'mutative@1.3.0';

// 配置
const ARRAY_SIZE = 50000; // 数组大小
const ITERATIONS = 100; // 每个操作的迭代次数

interface TestItem {
  id: number;
  name: string;
  value: number;
  nested: {
    a: number;
    b: string;
  };
}

// 创建测试数据
function createTestArray(size: number): TestItem[] {
  return Array(size)
    .fill(null)
    .map((_, index) => ({
      id: index,
      name: `item-${index}`,
      value: Math.random() * 1000,
      nested: {
        a: index * 2,
        b: `nested-${index}`,
      },
    }));
}

// ============= Add Operations =============

function testPush(baseState: TestItem[], iterations: number) {
  console.log('  Testing push...');
  for (let i = 0; i < iterations; i++) {
    create(baseState, (draft) => {
      draft.push({
        id: baseState.length + i,
        name: `new-item-${i}`,
        value: Math.random() * 1000,
        nested: { a: i, b: `new-nested-${i}` },
      });
    });
  }
}

function testUnshift(baseState: TestItem[], iterations: number) {
  console.log('  Testing unshift...');
  for (let i = 0; i < iterations; i++) {
    create(baseState, (draft) => {
      draft.unshift({
        id: -i - 1,
        name: `unshift-item-${i}`,
        value: Math.random() * 1000,
        nested: { a: -i, b: `unshift-nested-${i}` },
      });
    });
  }
}

function testSpliceAdd(baseState: TestItem[], iterations: number) {
  console.log('  Testing splice (add)...');
  const midIndex = Math.floor(baseState.length / 2);
  for (let i = 0; i < iterations; i++) {
    create(baseState, (draft) => {
      draft.splice(midIndex, 0, {
        id: 100000 + i,
        name: `splice-add-item-${i}`,
        value: Math.random() * 1000,
        nested: { a: i, b: `splice-nested-${i}` },
      });
    });
  }
}

// ============= Delete Operations =============

function testPop(baseState: TestItem[], iterations: number) {
  console.log('  Testing pop...');
  for (let i = 0; i < iterations; i++) {
    create(baseState, (draft) => {
      draft.pop();
    });
  }
}

function testShift(baseState: TestItem[], iterations: number) {
  console.log('  Testing shift...');
  for (let i = 0; i < iterations; i++) {
    create(baseState, (draft) => {
      draft.shift();
    });
  }
}

function testSpliceDelete(baseState: TestItem[], iterations: number) {
  console.log('  Testing splice (delete)...');
  const midIndex = Math.floor(baseState.length / 2);
  for (let i = 0; i < iterations; i++) {
    create(baseState, (draft) => {
      draft.splice(midIndex, 1);
    });
  }
}

// ============= Modify Operations =============

function testModifySingle(baseState: TestItem[], iterations: number) {
  console.log('  Testing single item modification...');
  for (let i = 0; i < iterations; i++) {
    const index = i % baseState.length;
    create(baseState, (draft) => {
      draft[index].value = Math.random() * 1000;
    });
  }
}

function testModifyNested(baseState: TestItem[], iterations: number) {
  console.log('  Testing nested property modification...');
  for (let i = 0; i < iterations; i++) {
    const index = i % baseState.length;
    create(baseState, (draft) => {
      draft[index].nested.a = Math.random() * 1000;
      draft[index].nested.b = `modified-${i}`;
    });
  }
}

function testModifyBatch(baseState: TestItem[], iterations: number) {
  console.log('  Testing batch modification (10 items per iteration)...');
  for (let i = 0; i < iterations; i++) {
    create(baseState, (draft) => {
      for (let j = 0; j < 10; j++) {
        const index = (i * 10 + j) % draft.length;
        draft[index].value = Math.random() * 1000;
      }
    });
  }
}

function testReplace(baseState: TestItem[], iterations: number) {
  console.log('  Testing item replacement...');
  for (let i = 0; i < iterations; i++) {
    const index = i % baseState.length;
    create(baseState, (draft) => {
      draft[index] = {
        id: index,
        name: `replaced-item-${i}`,
        value: Math.random() * 1000,
        nested: { a: i, b: `replaced-nested-${i}` },
      };
    });
  }
}

// ============= Complex Operations =============

function testFilter(baseState: TestItem[], iterations: number) {
  console.log('  Testing filter-like operation...');
  for (let i = 0; i < iterations; i++) {
    create(baseState, (draft) => {
      for (let j = draft.length - 1; j >= 0; j--) {
        if (draft[j].id % 100 === 0) {
          draft.splice(j, 1);
        }
      }
    });
  }
}

function testMap(baseState: TestItem[], iterations: number) {
  console.log('  Testing map-like operation...');
  for (let i = 0; i < iterations; i++) {
    create(baseState, (draft) => {
      for (let j = 0; j < draft.length; j++) {
        draft[j].value = draft[j].value * 2;
      }
    });
  }
}

function testSort(baseState: TestItem[], iterations: number) {
  console.log('  Testing sort operation...');
  for (let i = 0; i < iterations; i++) {
    create(baseState, (draft) => {
      draft.sort((a, b) => a.value - b.value);
    });
  }
}

function testReverse(baseState: TestItem[], iterations: number) {
  console.log('  Testing reverse operation...');
  for (let i = 0; i < iterations; i++) {
    create(baseState, (draft) => {
      draft.reverse();
    });
  }
}

// ============= Main Profiling Function =============

async function runProfiling() {
  console.log('='.repeat(60));
  console.log(
    `Mutative Array Operations Performance Profiling (${
      baseline ? 'baseline 1.3.0' : 'current workspace'
    })`
  );
  console.log('='.repeat(60));
  console.log(`Array Size: ${ARRAY_SIZE}`);
  console.log(`Iterations per operation: ${ITERATIONS}`);
  console.log('='.repeat(60));

  // 创建测试数据
  console.log('\nCreating test data...');
  const baseState = createTestArray(ARRAY_SIZE);
  console.log(`Created array with ${baseState.length} items`);

  // 使用 V8 Inspector 进行 CPU profiling
  const session = new Session();
  session.connect();

  const post = promisify(session.post.bind(session));

  console.log('\nStarting CPU profiling...');
  await post('Profiler.enable');
  await post('Profiler.start');

  const startTime = Date.now();

  // ============= Run All Tests =============

  console.log('\n--- Add Operations ---');
  testPush(baseState, ITERATIONS);
  testUnshift(baseState, ITERATIONS);
  testSpliceAdd(baseState, ITERATIONS);

  console.log('\n--- Delete Operations ---');
  testPop(baseState, ITERATIONS);
  testShift(baseState, ITERATIONS);
  testSpliceDelete(baseState, ITERATIONS);

  console.log('\n--- Modify Operations ---');
  testModifySingle(baseState, ITERATIONS);
  testModifyNested(baseState, ITERATIONS);
  testModifyBatch(baseState, ITERATIONS);
  testReplace(baseState, ITERATIONS);

  console.log('\n--- Complex Operations ---');
  const complexIterations = Math.max(10, Math.floor(ITERATIONS / 10));
  testFilter(createTestArray(1000), complexIterations);
  testMap(createTestArray(1000), complexIterations);
  testSort(createTestArray(1000), complexIterations);
  testReverse(baseState, complexIterations);

  const elapsedTime = Date.now() - startTime;
  console.log(`\nAll tests completed in ${elapsedTime}ms`);

  // 停止 profiling 并保存结果
  console.log('\nStopping CPU profiling...');
  const { profile } = (await post('Profiler.stop')) as { profile: any };
  await post('Profiler.disable');
  session.disconnect();

  const outputPath = path.join(__dirname, 'cpu-profile-array.cpuprofile');
  console.log(`\nSaving profile to: ${outputPath}`);
  writeFileSync(outputPath, JSON.stringify(profile, null, 2));

  console.log('\n' + '='.repeat(60));
  console.log('Profiling Complete!');
  console.log('='.repeat(60));
  console.log(`\nTo analyze the profile:`);
  console.log(`1. Open Chrome DevTools (F12)`);
  console.log(`2. Go to Performance tab`);
  console.log(`3. Load the profile: ${outputPath}`);
  console.log(`\nOr run the analysis script:`);
  console.log(`  npx ts-node test/performance/analyze-pprof.ts`);
}

// 运行
runProfiling().catch(console.error);
