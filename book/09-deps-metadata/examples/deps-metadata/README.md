# deps-metadata：manifest 解析 + 元数据新鲜度校验

第 9 章配套示例。解析 `aishop` 的 `knowledge.yaml`（展示召回边界），再校验所有 L1 知识包的
frontmatter 元数据（新鲜度、owner、状态），对标 `ai-asset-standards` 的 `check-frontmatter.mjs`。

## 运行

需要 Node >= 20.11。

```bash
npx tsx src/main.ts
# 或
npm install && npm start
```

只用 Node 内置模块，无运行时依赖。manifest 用手写解析（不引 YAML 库，保持零依赖；生产用 js-yaml）。

## 目录

- `aishop/knowledge.yaml` —— 仓库 manifest（extends L0 + 带版本的 L1 依赖 + 订阅的 namespace + 本地目录）
- `kb/L1/kb-orders` —— 元数据齐全、新鲜（校验 OK）
- `kb/L1/kb-inventory` —— 缺 `owner`（校验 ERROR）
- `kb/L1/kb-refund` —— `last_reviewed` 超过 90 天 TTL（校验 WARN）
- `kb/L1/kb-legacy-shipping` —— `status: deprecated` 却仍被依赖（校验 WARN）
- `src/manifest.ts` —— manifest 解析器
- `src/validate.ts` —— frontmatter 五字段 + TTL + deprecated 校验
- `src/main.ts` —— 跑解析 + 校验

## 预期输出

- **召回边界**：文件侧 3 个带版本依赖（@kb/orders ^3.1.0 等）+ 服务侧 2 个 namespace（payment/*、risk/blocklist）。
- **元数据校验**（三类问题都触发）：kb-orders OK；kb-inventory 报「缺字段 owner」（ERROR）；kb-refund 报「last_reviewed 已 186 天，超过 TTL 90 天」（WARN）；kb-legacy-shipping 报「status=deprecated，但仍被依赖」（WARN）。合计 1 个错误、2 个告警。
- **退出码 1**：因为有 ERROR，脚本以非零退出码结束——这是**故意的**，让它能直接当 CI 门禁用（有硬错误就让流水线失败）。

## 关键点

manifest 把「一行依赖」升级成带版本、可校验的清单；五字段 frontmatter 让每份知识可被治理。
这两块是第 23 章漂移检测与治理的地基——这里先让「缺 owner」「超期未复核」变得可被机器检出。
