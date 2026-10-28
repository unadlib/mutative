import type { Locale } from './i18n';

const zh: Record<string, string> = {
  Reducers: 'Reducer 支持',
  'Copyright ©': '版权所有 ©',
  'Admin panels, internal tools and dashboards': '管理面板、内部工具与仪表盘',
  'Using mutative instead of immer, this has reduced the main thread scripting by about 1 second.':
    '使用 Mutative 替代 Immer 后，主线程脚本执行时间减少了约 1 秒。',
  'Replaced Immer with Mutative in its client.':
    '在客户端用 Mutative 替换了 Immer。',
  'Pull request': '拉取请求',
  'February 2025': '2025 年 2 月',
  'A backend with auth, permissions, storage and presence':
    '提供认证、权限、存储和在线状态的后端',
  'Mutative is about 3ms on a single transaction.':
    'Mutative 单次事务约耗时 3 ms。',
  'With Immer, a single transaction took about 8 ms, and about 40 ms as pending transactions were added.':
    '使用 Immer 时，单次事务约需 8 ms，增加待处理事务后约为 40 ms。',
  'September 2024': '2024 年 9 月',
  'An end-to-end encrypted note-taking app': '端到端加密的笔记应用',
  "…you'll notice slight improvements in app responsiveness.":
    '……你会感受到应用响应速度的小幅提升。',
  'Replaced Immer with Mutative in version 3.0.11.':
    '在 3.0.11 版本用 Mutative 替换了 Immer。',
  'Release notes': '发布说明',
  'July 2024': '2024 年 7 月',
  'A rich-text editor for React': 'React 富文本编辑器',
  'All plugin stores now use zustand-mutative for immutable state updates, which is faster than immer.':
    '所有插件 store 现已使用 zustand-mutative 进行不可变状态更新，它比 Immer 更快。',
  'Moved its plugin stores to zustand-mutative in version 42.':
    '在 42 版本将插件 store 迁移到 zustand-mutative。',
  Release: '版本发布',
  'January 2025': '2025 年 1 月',
  'In production': '生产实践',
  'From Immer to Mutative': '从 Immer 到 Mutative',
  'Open-source projects that replaced Immer with Mutative, in their own words.':
    '看看迁移到 Mutative 的开源项目如何评价（以下为引文译文）。',
  'Also used by': '其他使用项目：',
  ' and ': ' 和 ',
  'See who uses Mutative': '查看使用 Mutative 的项目',
  'Time per update, relative to Mutative': '每次更新耗时，相对于 Mutative',
  'Shorter is better': '越短越好',
  View: '视图',
  chart: '图表',
  table: '表格',
  faster: '相对 Immer 加速',
  'µs per update': 'µs / 次更新',
  'Microseconds per update, shorter is better':
    '每次更新耗时（微秒），越短越好',
  Workload: '工作负载',
  'Faster than Immer': '相对于 Immer 的性能倍数',
  'Faster than Immer with matched settings':
    '相同配置下相对于 Immer 的性能倍数',
  "Faster than Immer with each library's defaults":
    '各自默认配置下相对于 Immer 的性能倍数',
  'Benchmarked workloads': '基准工作负载',
  'Every result checked against hand-written reducers':
    '每项结果均与手写 reducer 核对',
  Fast: '高效',
  'Faster than Immer, by design': '设计使然，快于 Immer',
  'Mutative copies each object at most once per update and moves array elements natively on its copy, instead of through a draft proxy.':
    '每次更新最多复制每个对象一次，并在副本上原生移动数组元素，无需逐个经过草稿代理。',
  'See the benchmarks': '查看基准测试',
  'Ready to try Mutative?': '准备好试试 Mutative 了吗？',
  'Learn the most important Mutative concepts in 5 minutes.':
    '用 5 分钟了解 Mutative 最重要的概念。',
  'Get Started': '快速入门',
  'Migrate from Immer': '从 Immer 迁移',
  Simple: '简单',
  'Immutable updates without the spread': '告别层层展开，轻松更新状态',
  'Mark the last item of a list as done and add a new one. With spread syntax, you copy each level of the state yourself; with Mutative, you change a draft.':
    '将列表最后一项标为完成，再添加一项。展开语法需要逐层复制状态；使用 Mutative，只需修改草稿。',
  'Spread syntax': '展开语法',
  'With Mutative': '使用 Mutative',
  'A 2-6x faster alternative to useState with spread operation.':
    '比使用展开语法的 useState 快 2–6 倍的替代方案。',
  'A Mutative middleware for Zustand.': 'Zustand 的 Mutative 中间件。',
  'A Mutative extension for Jotai.': 'Jotai 的 Mutative 扩展。',
  'Utilities for using Mutative with XState.':
    '在 XState 中使用 Mutative 的工具。',
  'Yjs collaborative web applications built with Mutative.':
    '用 Mutative 构建 Yjs 协同 Web 应用。',
  'Undo and redo': '撤销与重做',
  'A fast, framework-agnostic undo/redo core powered by Mutative JSON Patch.':
    '基于 Mutative JSON Patch、快速且与框架无关的撤销与重做核心。',
  'A React hook for state time travel with undo, redo, reset and archive.':
    '支持撤销、重做、重置和归档的 React 状态时间旅行 Hook。',
  'An undo and redo middleware for Zustand, built on travels.':
    '基于 travels 的 Zustand 撤销与重做中间件。',
  'A Mutative wrapper with full Immer API compatibility.':
    '完全兼容 Immer API 的 Mutative 封装。',
  Framework: '框架',
  'A framework for building React applications with Mutative.':
    '使用 Mutative 构建 React 应用的框架。',
  'State modules': '状态模块',
  'A concise and flexible state model for Redux, MobX, Vuex, Pinia and more.':
    '面向 Redux、MobX、Vuex、Pinia 等的简洁灵活状态模型。',
  'Mutable updates': '可变更新',
  'A JavaScript library for transactional mutable updates.':
    '支持事务式可变更新的 JavaScript 库。',
  Ecosystem: '生态系统',
  'Works with your stack': '融入你的技术栈',
  'Libraries built on Mutative for React, Zustand, Jotai, XState, Yjs and more.':
    '基于 Mutative，支持 React、Zustand、Jotai、XState、Yjs 等的生态库。',
  'See the ecosystem': '探索生态系统',
  'Mutation makes immutable updates': '用可变写法完成不可变更新',
  'Immutable updates of objects, arrays, Sets and Maps, written as mutations of a draft.':
    '通过修改草稿，对对象、数组、Set 和 Map 进行不可变更新。',
  'High performance': '高性能',
  'Optional freezing': '可选冻结',
  'No freezing of immutable data by default, and auto-freeze when you want it.':
    '默认不冻结不可变数据，需要时可开启自动冻结。',
  'Patches and inverse patches of each update, which can be JSON Patch operations.':
    '每次更新可生成正向与逆向补丁，并支持 JSON Patch 格式。',
  'Custom shallow copy': '自定义浅拷贝',
  'Your own shallow copy for more types of immutable data, such as class instances.':
    '通过自定义浅拷贝支持类实例等更多不可变数据类型。',
  'Non-invasive marking': '非侵入式标记',
  'Mark immutable and mutable data without changing its structure.':
    '无需改变结构，即可标记不可变与可变数据。',
  'Strict mode': '严格模式',
  'Explicit reads of data that is not drafted, which a recipe could otherwise change in place.':
    '显式读取未创建草稿的数据，避免无意中原地修改。',
  'Producers that work as reducers, with Redux and any other immutable state library.':
    '生产函数可作为 reducer，配合 Redux 等不可变状态库使用。',
  Features: '功能',
  'Everything immutable updates need': '不可变更新所需的功能',
  'Drafts for every data structure, with patches, freezing, marks and strict mode when you need them.':
    '为多种数据结构提供草稿，按需开启补丁、冻结、标记与严格模式。',
  Better: '更易用的',
  immutability: '不可变数据',
  Faster: '更高效的',
  'immutable updates': '不可变更新',
  'A JavaScript library for efficient immutable updates. Write plain mutations on a draft, and get the next immutable state.':
    '高效的 JavaScript 不可变更新库。像修改普通数据一样修改草稿，即可得到下一个不可变状态。',
  Copied: '已复制',
  'Copy the install command': '复制安装命令',
  'Time for the same updates': '完成相同更新的耗时',
  Docs: '文档',
  Introduction: '简介',
  'Getting Started': '快速入门',
  'API Reference': 'API 参考',
  Performance: '性能',
  Community: '社区',
  More: '更多',
  Blog: '博客',
  'A JavaScript library for efficient immutable updates.':
    '高效的 JavaScript 不可变更新库。',
  'Released under the MIT License.': '基于 MIT 许可证发布。',
  'Matched settings': '相同配置',
  'Same auto-freeze and patch settings': '自动冻结与补丁设置一致',
  'Each library’s defaults': '各自默认配置',
  'Only Immer auto-freezes; patches off': '仅 Immer 自动冻结，均关闭补丁',
  'Mutative faster': 'Mutative 更快',
  'Within 5%': '差距在 5% 以内',
  'Immer faster': 'Immer 更快',
  'The overall comparison': '整体性能对比',
  'Each card covers a different set of measured cases. Faster means more than 5% less time; the factors are geometric means, not a speedup guaranteed for every workload.':
    '两张卡片分别覆盖不同的测量案例。“更快”指耗时减少超过 5%；倍数为几何平均值，不保证每项工作负载都有同样的提升。',
  'faster on geometric mean': '耗时比的几何平均值',
  'cases favor Mutative': '个案例中 Mutative 更快',
  'How the gap changes with array size': '性能差距如何随数组规模变化',
  'Immer / Mutative time · higher is better for Mutative':
    'Immer 耗时 / Mutative 耗时 · 越高越有利于 Mutative',
  'Array workload group': '数组工作负载分组',
  'All workloads': '全部场景',
  'Element moves': '元素移动',
  'Both libraries use the same settings. The vertical axis is logarithmic; 1× means equal time. Element moves cover shift, unshift, splice insertion, and reverse. Immer’s array-method plugin is off.':
    '两库配置相同。纵轴为对数刻度，1× 表示耗时相同。元素移动包括 shift、unshift、splice 插入和 reverse。未开启 Immer 数组方法插件。',
  'All large-array workloads': '全部大数组场景',
  'Only workloads that move elements': '仅移动元素的场景',
  'Log scale': '对数刻度',
  Freeze: '冻结',
  '· patches': '· 补丁',
  on: '开启',
  off: '关闭',
  '1,000 rows': '1,000 行',
  '10,000 rows': '10,000 行',
  'at 1k → 10k rows': '规模从 1 千行 → 1 万行',
  'The cost of updates with patches': '生成补丁时的更新成本',
  'Microseconds per update · shorter is better':
    '每次更新耗时（微秒）· 越短越好',
  'Patch benchmark comparator': '补丁性能对比对象',
  'Push a row and insert a property': '追加一行并插入一个属性',
  'Remove the first row with shift': '用 shift 删除第一行',
  'Update every row': '更新每一行',
  'Update one of 10,000 records': '更新 10,000 条记录中的一条',
  '200 RTK Query-style updates': '200 次 RTK Query 风格更新',
  '100 pending and 100 resolved requests':
    '100 个待处理请求和 100 个已完成请求',
  'Update one field of a small object': '更新小对象的一个字段',
  'A tiny plain object': '一个小型普通对象',
  'Add a number to a Set': '向 Set 添加一个数字',
  'A Set of 10,000 numbers': '包含 10,000 个数字的 Set',
  'Remove the first row': '删除第一行',
  'An array of 10,000 rows, with shift()': '使用 shift() 的 10,000 行数组',
  'Immer, auto-freeze': 'Immer，自动冻结',
};

/** English text is also the fallback for product names and technical identifiers. */
export function translator(locale: Locale) {
  return (text: string): string =>
    locale === 'zh' ? (zh[text] ?? text) : text;
}
