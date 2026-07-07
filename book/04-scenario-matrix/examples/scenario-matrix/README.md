# scenario-matrix：业务场景 × 任务场景 覆盖矩阵

第 4 章配套示例。把 SME 访谈和真实 query 日志两个来源合并，构建 `aishop` 的覆盖矩阵，
标出盲区，并生成 golden 问答对骨架。产出的 `scenario-matrix.json` 是下一章覆盖度工具的输入。

## 运行

需要 Node >= 20.11。

```bash
npx tsx src/build.ts
# 或
npm install && npm start
```

只用 Node 内置模块，无运行时依赖。

## 目录

- `src/data.ts` —— 两个来源的原始输入：SME 访谈场景 + **未打标的原始 query 问句**（带频次）+ golden 骨架
- `src/build.ts` —— `classify()` 把原始问句归类到业务场景（演示「聚类」这一步；生产换 embedding + 相似度聚类），
  再合并两来源、构建矩阵、标盲区、写出 `scenario-matrix.json`

## 预期输出

- 一张 `业务场景 × 任务场景` 矩阵，每格 ✓（有 golden）/ ✗（盲区）。
- 覆盖率统计（示例数据下为 3/18 ≈ 17%）。
- **SME 访谈漏掉、只在 query 日志里出现的场景**：风控、对账——其中「风控」query 频次高达 25，
  却是 SME 完全没提到的，直观证明「人工枚举 + query 日志聚类」两个来源缺一不可。
- 写出 `scenario-matrix.json` 供第 5 章覆盖度工具消费。

## 关键点

矩阵把「覆盖了多少」从一维的「有多少篇文档」变成二维的「哪些格子有知识」，盲区因此可见、可派活。
golden 用「必答点 / 禁答点」断言把「覆盖没覆盖」变成可运行的判定，这是第 5 章量化覆盖度的尺子。
