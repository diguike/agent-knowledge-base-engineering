# cross-agent：一份知识源，分发到四种 agent 格式

第 12 章配套示例。维护一份 `.kb/rules.yaml` 单一源，用生成器渲染成 Claude Code、Codex、
Cursor、GitHub Copilot 四种配置格式，并反向核对四份一致——从根上消除多份手写的漂移。

## 运行

需要 Node >= 20.11。

```bash
npx tsx src/main.ts
# 或
npm install && npm start
```

只用 Node 内置模块，无运行时依赖。

## 目录

- `.kb/rules.yaml` —— 单一知识源（几条 aishop 约定，改规则只改这里）
- `src/generate.ts` —— 解析源 + 渲染四种格式（CLAUDE.md / AGENTS.md / .cursor/rules/*.mdc / copilot-instructions.md）
- `src/main.ts` —— 生成 + 一致性检查
- `out/` —— 生成产物（运行时生成，已 gitignore）

## 预期输出

- 从 `.kb/rules.yaml` 生成 4 种格式到 `out/`。
- 一致性检查：反向解析四个文件，确认各承载相同的 3 条规则，全部 ✓。
- **手写内容保留检查**：往 `out/CLAUDE.md` 生成区之外塞一段手写补充，重新生成后它仍然保留（✓）——
  生成器只替换 `<!-- KB:GENERATED:BEGIN -->` / `<!-- KB:GENERATED:END -->` 标记之间的内容。

试一下：改 `.kb/rules.yaml` 里任意一条规则，重新跑，四个文件的生成区同步更新、手写部分不动。

## 三个工程细节

- **不覆盖手写内容**：用 BEGIN/END 标记框住生成区，重生成只替换标记之间——真实仓库的 `CLAUDE.md`
  往往有手写介绍，绝不能整文件覆盖。这是 Ruler 等真实工具的做法。
- **`.mdc` 是真 Cursor 格式**：`description` 给索引用，`alwaysApply: true` 表示始终生效（否则用 `globs` 指定文件范围）。
- **`scope` 字段暂不参与生成**：源里每条规则的 `scope` 是留给「按范围决定进哪个文件」的扩展点，本例作元数据保留、暂不启用。

知识内核要可移植（MCP + Skills/AGENTS.md），分发外壳可以专有（各家格式从单一源生成）。
现成工具有 Ruler（一份源分发 20+ 格式）、Packmind；本例是自写的最小生成器，核心是守住「单一源」纪律。
