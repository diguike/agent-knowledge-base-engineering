# plugin-distribution：plugin 依赖图解析 + prune

第 13 章配套示例。给出一个 `marketplace.json`（列出 plugin 及各自 `dependencies`）和一个
`.claude/settings.json`（声明式分发配置），实现依赖解析（传递依赖自动带上）和 prune（识别孤儿）。

## 运行

需要 Node >= 20.11。

```bash
npx tsx src/main.ts
# 或
npm install && npm start
```

只用 Node 内置模块，无运行时依赖。

## 目录

- `marketplace.json` —— marketplace 清单：4 个 plugin（base/orders/inventory/refund）及依赖关系
- `.claude/settings.json` —— 声明式分发：`extraKnownMarketplaces` + `enabledPlugins`（对象 map，官方 schema）
- `src/resolve.ts` —— 依赖解析器 + prune
- `src/main.ts` —— 跑解析 + prune

## 预期输出

- `enabledPlugins` 只声明了 `aishop-refund`，依赖解析后实际会装 3 个：
  `aishop-refund` → 依赖 `aishop-orders` → 依赖 `aishop-base`，传递依赖自动带上。
- prune：假设环境里多装了 `aishop-inventory`（不被任何启用项依赖），prune 把它识别为孤儿，应被清理。

结论：声明顶层需要什么，传递依赖自动装、孤儿自动识别——这就是 npm 式依赖图的分发管理。

## 说明

`.claude/settings.json` 里的字段名和语义（`extraKnownMarketplaces`、`enabledPlugins` 对象 map）
对应 Claude Code 官方 schema；`marketplace.json` 实操时放在 `.claude-plugin/` 目录下（本例为让解析器简单放在了根目录）。
本示例用最小解析器演示依赖图和 prune 的**机制**，不实际调用安装命令（那需要 Claude Code 环境）。
真实的「克隆信任时提示安装 + 确认」流程与信任边界见第 14 章。
