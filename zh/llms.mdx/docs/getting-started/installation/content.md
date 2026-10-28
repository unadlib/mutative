# 安装 (/zh/docs/getting-started/installation)

从 npm 安装 Mutative 或通过 CDN 加载，并了解支持的运行环境。

## 包管理器 [#package-managers]



```bash
npm install mutative
```

```bash
pnpm add mutative
```

```bash
yarn add mutative
```

```bash
bun add mutative
```

Mutative 没有依赖。仅包含 `create` 的生产构建经 Brotli 压缩后约为 8.3 kB；包含 `create`、`apply`、`current` 和 `original` 时约为 8.9 kB。其中已包含补丁、`Map`、`Set` 和原生数组方法支持，无需插件。

```ts
import { create } from 'mutative';
```

## 环境要求 [#requirements]

* **JavaScript**：Mutative 需要 `Proxy`，以及构建产物保留的 ES2018 语法（如对象展开）：支持 Node.js 14.0 及以上、现代浏览器和 React Native 0.64 及以上。支持 `Proxy` 但不支持 ES2018 语法的引擎，如 Chrome 49–59、Firefox 18–54、Safari 10–11.0 和 Edge 12–18，需要由项目构建工具转译 Mutative。Internet Explorer 没有 `Proxy`，因此不受支持。
* **TypeScript**：类型声明支持 TypeScript 5.0 及以上，详见 [TypeScript](/zh/docs/advanced-guides/typescript)。

## 开发与生产构建 [#development-and-production-builds]

包内提供开发构建和压缩后的生产构建。前者包含完整错误信息、警告和额外检查；后者用[数字错误码](/zh/docs/extra-topics/errors)表示错误。实际使用哪个构建由 `process.env.NODE_ENV` 决定：

* **打包工具**解析 ESM 构建，其中的开发检查比较 `process.env.NODE_ENV` 与 `'production'`。webpack、Vite、Rollup 和 esbuild 的常见生产配置会将它定义为 `'production'`，从而移除开发代码。目标为 Node.js 的打包配置会解析 CommonJS 入口；请在该配置中定义 `process.env.NODE_ENV`，或将 Mutative 设为外部依赖。
* **Node.js** 无论使用 `require` 还是 `import`，都会运行 CommonJS 构建，并在加载 Mutative 时根据 `NODE_ENV` 选择开发或生产版本。
* **未使用打包工具的浏览器**没有 `process`，需要使用下方的生产 ESM 文件或 UMD 构建。

## CDN [#cdn]

* Unpkg：`<script src="https://unpkg.com/mutative"></script>`
* JSDelivr：`<script src="https://cdn.jsdelivr.net/npm/mutative"></script>`
* ES 模块：`import { create } from 'https://unpkg.com/mutative/dist/mutative.esm.production.min.mjs';`

`<script>` 标签加载生产 UMD 构建，提供全局变量 `Mutative`，例如 `Mutative.create(baseState, recipe)`。包中的其他 ESM 文件会读取 `process.env.NODE_ENV`，它由打包工具或 Node.js 提供；无打包工具的浏览器应使用上方的生产文件。

```html
<script type="module">
  import { create } from 'https://unpkg.com/mutative/dist/mutative.esm.production.min.mjs';

  const state = create({ count: 0 }, (draft) => {
    draft.count += 1;
  });
  console.log(state.count); // 1
</script>
```
