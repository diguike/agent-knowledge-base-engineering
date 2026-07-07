# trust-gate-ci：trust gate 策略检查器

第 14 章配套示例。实现一个最小的 trust gate 策略检查器：区分被动知识与会跑代码的组件，
结合工作区信任与 marketplace 白名单，判定每个组件该直接加载、启用、受限还是拒绝。

## 运行

需要 Node >= 20.11。

```bash
npx tsx src/main.ts
# 或
npm install && npm start
```

只用 Node 内置模块，无运行时依赖。

## 目录

- `src/gate.ts` —— 策略判定：白名单 → 被动/会跑代码 → 工作区信任
- `src/main.ts` —— 同一批组件在「工作区可信」和「未信任」两种策略下的判定

## 判定逻辑

对每个组件，按顺序判断：

1. marketplace 不在受管白名单 → **拒绝**
2. 被动知识（knowledge/Skill，不执行代码）→ **直接加载**
3. 会跑代码的组件（hook/mcp/lsp）：工作区可信 → **启用**；未信任 → **受限不启用**

## 预期输出

- **工作区可信 + 白名单只含 aishop-kb**：知识直接加载、hook/MCP 启用、来自 `random-marketplace` 的未知 hook 被拒绝。
- **工作区未信任**：知识仍直接加载，但 hook/MCP 变成受限不启用；未知来源仍被拒绝。

结论：被动知识始终直接加载；会跑代码的组件只有工作区可信才启用；白名单外来源无论如何都被拒绝。
这三种判定结果对应到 CI，就是流水线该放行还是该失败的依据。

## 说明

本例演示 trust gate 的**判定机制**，是对 Claude Code 信任模型的教学抽象。真实的 trust gate 由
Claude Code 运行时实施；组织层面的 `strictKnownMarketplaces` / `blockedMarketplaces` 是受管设置。
