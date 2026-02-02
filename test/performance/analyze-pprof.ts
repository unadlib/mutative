/**
 * Mutative Profile Analyzer
 *
 * 分析 V8 cpuprofile 格式的 CPU profile 并输出 markdown 报告
 *
 * Usage:
 *   npx ts-node test/performance/analyze-pprof.ts
 */

import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

interface CPUProfileNode {
  id: number;
  callFrame: {
    functionName: string;
    scriptId: string;
    url: string;
    lineNumber: number;
    columnNumber: number;
  };
  hitCount: number;
  children?: number[];
}

interface CPUProfile {
  nodes: CPUProfileNode[];
  startTime: number;
  endTime: number;
  samples: number[];
  timeDeltas: number[];
}

interface FunctionStats {
  name: string;
  selfTime: number;
  totalHits: number; // Total hits across all instances
  file: string;
  line: number;
  children: string[];
}

function analyzeProfile(profilePath: string): void {
  console.log(`Analyzing profile: ${profilePath}`);

  // 读取 profile
  const data = readFileSync(profilePath, 'utf-8');
  const profile: CPUProfile = JSON.parse(data);

  console.log(`Profile has ${profile.nodes.length} nodes`);
  console.log(`Samples: ${profile.samples?.length ?? 0}`);

  const durationMicros = profile.endTime - profile.startTime;
  console.log(`Duration: ${(durationMicros / 1e6).toFixed(2)}s`);

  // 统计每个函数的 hit count
  const nodeMap = new Map<number, CPUProfileNode>();
  for (const node of profile.nodes) {
    nodeMap.set(node.id, node);
  }

  // 合并同名函数的统计
  const stats = new Map<string, FunctionStats>();
  let totalHits = 0;

  for (const node of profile.nodes) {
    const cf = node.callFrame;
    const key = `${cf.functionName}|${cf.url}`;
    totalHits += node.hitCount;

    const existing = stats.get(key) ?? {
      name: cf.functionName || '(anonymous)',
      selfTime: 0,
      totalHits: 0,
      file: cf.url,
      line: cf.lineNumber + 1,
      children: [],
    };

    existing.selfTime += node.hitCount;
    existing.totalHits += node.hitCount;

    // 收集 children 信息
    if (node.children) {
      for (const childId of node.children) {
        const child = nodeMap.get(childId);
        if (child && child.callFrame.functionName) {
          const childName = child.callFrame.functionName;
          if (!existing.children.includes(childName)) {
            existing.children.push(childName);
          }
        }
      }
    }

    stats.set(key, existing);
  }

  // 排序
  const sortedStats = Array.from(stats.values()).sort(
    (a, b) => b.selfTime - a.selfTime
  );

  console.log(`Total functions: ${sortedStats.length}`);
  console.log(`Total hits: ${totalHits}`);

  // 生成 Markdown 报告
  const lines: string[] = [];
  const profileLabel = process.env.BASELINE_MUTATIVE
    ? 'Mutative Array Operations CPU Profile Analysis (mutative@1.3.0 baseline)'
    : 'Mutative Array Operations CPU Profile Analysis (current)';
  lines.push(`# ${profileLabel}`);
  lines.push('');
  lines.push('## Profile Summary');
  lines.push('');
  lines.push(`- **Profile file:** \`${path.basename(profilePath)}\``);
  lines.push(`- **Duration:** ${(durationMicros / 1e6).toFixed(2)}s`);
  lines.push(`- **Total nodes:** ${profile.nodes.length}`);
  lines.push(`- **Total samples:** ${profile.samples?.length ?? 0}`);
  lines.push(`- **Total functions:** ${sortedStats.length}`);
  lines.push('');

  lines.push('## Top Hotspots (by self-time)');
  lines.push('');
  lines.push('| Rank | Function | Self% | Hits | Location |');
  lines.push('|------|----------|-------|------|----------|');

  const topN = 30;
  for (let i = 0; i < Math.min(topN, sortedStats.length); i++) {
    const stat = sortedStats[i];
    if (stat.selfTime === 0) continue;

    const selfPct = ((stat.selfTime / totalHits) * 100).toFixed(2);

    // 简化文件路径
    let location = stat.file ?? '';
    if (location.includes('/mutative/')) {
      location = location.split('/mutative/').pop() ?? location;
    }
    // 移除 file:// 前缀
    location = location.replace('file://', '');
    if (stat.line > 0) {
      location += `:${stat.line}`;
    }

    // 截断长函数名
    let funcName = stat.name;
    if (funcName.length > 40) {
      funcName = funcName.substring(0, 37) + '...';
    }

    lines.push(
      `| ${i + 1} | \`${funcName}\` | ${selfPct}% | ${stat.selfTime} | \`${location}\` |`
    );
  }

  lines.push('');
  lines.push('## Mutative-Specific Hotspots');
  lines.push('');
  lines.push('以下是与 mutative 库相关的热点函数（按 self-time 排序）：');
  lines.push('');

  const mutativeStats = sortedStats.filter(
    (s) =>
      s.file?.includes('mutative/src') ||
      s.file?.includes('mutative/dist') ||
      s.name.includes('Proxy') ||
      s.name.includes('draft') ||
      s.name.includes('create') ||
      s.name.includes('finalize')
  );

  if (mutativeStats.length > 0) {
    lines.push('| Function | Self% | Hits | Children | Location |');
    lines.push('|----------|-------|------|----------|----------|');

    for (const stat of mutativeStats.slice(0, 20)) {
      if (stat.selfTime === 0) continue;

      const selfPct = ((stat.selfTime / totalHits) * 100).toFixed(2);

      let location = stat.file ?? '';
      if (location.includes('/mutative/')) {
        location = location.split('/mutative/').pop() ?? location;
      }
      location = location.replace('file://', '');
      if (stat.line > 0) {
        location += `:${stat.line}`;
      }

      const childrenStr =
        stat.children.length > 3
          ? stat.children.slice(0, 3).join(', ') + '...'
          : stat.children.join(', ');

      lines.push(
        `| \`${stat.name}\` | ${selfPct}% | ${stat.selfTime} | ${childrenStr} | \`${location}\` |`
      );
    }
  } else {
    lines.push('*No mutative-specific hotspots found in this profile.*');
  }

  lines.push('');
  lines.push('## Key Observations');
  lines.push('');

  // 分析关键观察
  const proxyHandlerStats = sortedStats.filter(
    (s) =>
      s.name.includes('get') ||
      s.name.includes('set') ||
      s.name.includes('Proxy') ||
      s.name.includes('handler')
  );
  const arrayStats = sortedStats.filter(
    (s) =>
      s.name.includes('Array') ||
      s.name.includes('push') ||
      s.name.includes('splice') ||
      s.name.includes('shift') ||
      s.name.includes('pop') ||
      s.name.includes('sort') ||
      s.name.includes('reverse')
  );

  if (proxyHandlerStats.length > 0) {
    const totalProxyTime = proxyHandlerStats.reduce(
      (sum, s) => sum + s.selfTime,
      0
    );
    const pct = ((totalProxyTime / totalHits) * 100).toFixed(2);
    lines.push(`- **Proxy 相关操作:** ${pct}% of CPU time`);
    lines.push(
      `  - 主要函数: ${proxyHandlerStats
        .slice(0, 5)
        .map((s) => s.name)
        .join(', ')}`
    );
  }

  if (arrayStats.length > 0) {
    const totalArrayTime = arrayStats.reduce((sum, s) => sum + s.selfTime, 0);
    const pct = ((totalArrayTime / totalHits) * 100).toFixed(2);
    lines.push(`- **Array 操作:** ${pct}% of CPU time`);
    lines.push(
      `  - 主要函数: ${arrayStats
        .slice(0, 5)
        .map((s) => s.name)
        .join(', ')}`
    );
  }

  // Native 函数统计
  const nativeStats = sortedStats.filter(
    (s) =>
      !s.file ||
      s.file === '' ||
      s.file.startsWith('native ') ||
      s.name.startsWith('native ')
  );
  if (nativeStats.length > 0) {
    const totalNativeTime = nativeStats.reduce((sum, s) => sum + s.selfTime, 0);
    const pct = ((totalNativeTime / totalHits) * 100).toFixed(2);
    lines.push(`- **Native 函数:** ${pct}% of CPU time`);
  }

  lines.push('');
  lines.push('## Potential Performance Improvements');
  lines.push('');
  lines.push('基于 profile 分析，以下是 mutative 可能的性能改进方向：');
  lines.push('');
  lines.push('### 1. Proxy Handler 优化');
  lines.push('');
  lines.push('- **减少 Proxy trap 调用次数**: 对于频繁访问的属性，考虑缓存');
  lines.push('- **优化 `get` trap**: 减少不必要的检查和类型判断');
  lines.push('- **延迟代理创建**: 只在需要时创建嵌套对象的代理');
  lines.push('- **内联热路径代码**: 减少函数调用开销');
  lines.push('');
  lines.push('### 2. 数组操作优化');
  lines.push('');
  lines.push('- **批量操作支持**: 对于连续的 push/pop 操作，可以批量处理');
  lines.push('- **splice 优化**: 减少中间数组的创建，使用原地操作');
  lines.push('- **shift/unshift 优化**: 考虑使用双端队列结构优化头部操作');
  lines.push('- **避免不必要的 copy**: 如果只是读取，不要触发 copy-on-write');
  lines.push('');
  lines.push('### 3. 内存分配优化');
  lines.push('');
  lines.push(
    '- **对象池**: 对于频繁创建的临时对象（如 ProxyDraft），使用对象池'
  );
  lines.push('- **减少闭包创建**: 避免在热路径中创建新的函数/闭包');
  lines.push('- **预分配数组空间**: 对于已知大小的数组操作，预分配空间');
  lines.push('');
  lines.push('### 4. 结构性优化');
  lines.push('');
  lines.push('- **Copy-on-Write 优化**: 延迟复制，只在真正需要修改时才复制');
  lines.push('- **增量更新**: 对于大数组，考虑使用增量更新而不是完整复制');
  lines.push('- **Immutable 快速路径**: 对于未修改的子树，直接复用原引用');
  lines.push('- **Finalization 优化**: 减少 finalize 阶段的遍历开销');

  // 写入文件
  const outputPath = path.join(
    path.dirname(profilePath),
    'array-profile-analysis.md'
  );
  writeFileSync(outputPath, lines.join('\n'));
  console.log(`\nAnalysis saved to: ${outputPath}`);
}

// 运行分析
const profilePath = path.join(__dirname, 'cpu-profile-array.cpuprofile');
try {
  analyzeProfile(profilePath);
} catch (error) {
  console.error('Error analyzing profile:', error);
  console.log(
    '\nMake sure to run the profiling script first:\n  npx ts-node test/performance/pprof-array-profile.ts'
  );
}
