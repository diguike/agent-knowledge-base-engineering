# aishop-kb

这是你读完《Agent 知识库工程实战：组织、分发、共建与度量》后拿到的成品：一座完整、可运行、可自托管的 Agent 知识库，外加一套统一 CLI。

全书用虚构电商后端 `aishop` 作主线，从「一个 docs 文件夹」一路长到「分层包化 + MCP 服务 + 共建流水线 + 健康度门禁」。这个仓库把各章分散实现的能力收拢成一件东西：`kb/` 是知识内容，`aishop-kb <command>` 是围绕它的七类工程能力。所有命令零/最小外部依赖，离线可跑；embedding 用本地词袋替身，生产替换成真模型即可（代码里已标注替换插槽）。

## 快速开始

```bash
npm install
npx tsx src/cli.ts --help        # 看所有命令
npx tsx src/cli.ts health        # 一眼看知识库健不健康
```

每条命令都有对应的 npm script（`npm run coverage` / `npm run eval` …）。

## 目录结构

```
aishop-kb/
  kb/                        # 知识内容本体（分层组织）
    L0/base.md               #   组织级基础层：提交规范、安全红线、金额单位
    L1/                       #   领域知识包（可复用单元，各带 knowledge.yaml 依赖清单）
      kb-orders/             #     订单与下单：先锁库存、状态机、advanceOrder、legacy_channel
      kb-inventory/          #     库存与大促：分布式锁、大促扩容 3 倍
      kb-refund/             #     退款审核：超 5000 人工审核、先校验风控
      kb-risk/               #     风控名单：命中不许自动退款、下单二次验证
      kb-reconcile/          #     对账：每日对账、差异排查、legacy_channel
  llms.txt                   # 仓库自描述索引（阶段0：零基础设施对外暴露）
  AGENTS.md                  # L2 本地层：依赖声明 + 本地约定
  .kb/local/scratch.md       # 就地随手记（先脏后净的「脏」入口）
  coverage/questions.json    # 覆盖度测试问题集
  eval/golden.json           # golden 问答 + pass^k 试验数据
  extract/sources.json       # 抽取来源（事故复盘 / PR 讨论）
  src/
    cli.ts                   # 统一分发器：aishop-kb <command>
    commands/                # 七类命令，各复用对应章节的核心逻辑
    lib/                     # 共享层：kb 加载器、词袋 embedding、frontmatter、k-means
  .github/workflows/kb-health.yml  # CI：coverage + check + eval + drift 门禁
```

每个 L1 知识包含两个文件：`knowledge.md`（五字段 frontmatter：title/type/owner/last_reviewed/status，type 走 Diátaxis）+ `knowledge.yaml`（name/version/owner/deps，像 npm 包一样声明依赖）。

## 七条命令

| 命令 | 干什么 | 怎么跑 |
|---|---|---|
| `coverage` | 把知识块与测试问题嵌进同一空间聚类，逐簇算覆盖率，揪出「有知识却没题考」的盲区 | `npx tsx src/cli.ts coverage` |
| `serve` | 启动知识 MCP 服务，暴露 `search_docs`：namespace 过滤 + 角色 ACL + 关键词/向量混合检索 | `npx tsx src/cli.ts serve`（长驻）/ `serve --smoke`（自测） |
| `promote` | 把 `.kb/local/scratch.md` 里的随手记上收成带元数据的规范 L1 条目，噪音留在本地 | `npx tsx src/cli.ts promote` |
| `check` | 知识质量门禁：结构/元数据、Diátaxis 单型、prose lint（AI 味道）、死链，四层客观检查 | `npx tsx src/cli.ts check` |
| `extract` | 从事故复盘/PR 抽取候选知识，对已入库知识做近重复 + 语义冲突检测，产出人审队列 | `npx tsx src/cli.ts extract` |
| `eval` | 有效性度量：断言式评测（必答点/禁答点）+ pass^k 任务级可靠性 | `npx tsx src/cli.ts eval` |
| `drift` / `health` | 漂移检测（时间/废弃/一致性）；health 汇总覆盖度+有效性+新鲜度三位一体看板 | `npx tsx src/cli.ts drift` / `health` |

`serve` 默认走 stdio，可直接挂进任意 MCP 客户端（Claude / Cursor / Codex …）。客户端配置示例：

```json
{
  "mcpServers": {
    "aishop-knowledge": { "command": "npx", "args": ["tsx", "src/cli.ts", "serve"] }
  }
}
```

## 每条命令在书里第几章建的

| 命令 | 章节 | 章节示例来源 |
|---|---|---|
| `coverage` | 第 5 章　覆盖度的量化 | `05-coverage-tool/examples/coverage-tool` |
| `serve` | 第 10 章　知识 MCP 服务；第 11 章　召回边界工程（ACL） | `10-knowledge-mcp`、`11-scoped-recall` |
| `promote` | 第 16 章　低摩擦沉淀：就地记录与定期上收 | `16-capture-promote/examples/promote-tool` |
| `check` | 第 17 章　docs-as-code 共建：CODEOWNERS 与质量门禁 | `17-docs-as-code/examples/docs-as-code` |
| `extract` | 第 18 章　知识的自动抽取：候选提炼、冲突检测与人工审核 | `18-extract-review/examples/extract-review` |
| `eval` | 第 21 章　有效性度量：promptfoo 与任务级可靠性 | `21-eval-promptfoo/examples/eval-promptfoo` |
| `drift` / `health` | 第 22 章　治理与生命周期：漂移检测与健康度看板 | `22-governance-roadmap/examples/governance-ci` |

知识内容的分层组织与依赖声明来自第 8 章（`08-layered-org`）和第 9 章（`09-deps-metadata`）。

## CI 门禁

`.github/workflows/kb-health.yml` 在每次 push / PR 上跑 `coverage` + `check` + `eval` + `drift` 四道门禁，任一红则流水线红。这就是全书结尾的主张：把知识库当软件工程，健康度进 CI，回归被自动挡下。

## 生产化插槽

这套代码为「可离线、可复现、能进书」刻意做了简化，落地时替换以下几处即可换挡到生产：

- `src/lib/embed.ts` 的本地词袋 → 真 embedding 模型（bge / text-embedding-3），检索与聚类质量提升，骨架不变。
- `src/commands/serve.ts` 的混合检索 → 接 pgvector + 专门 rerank 模型。
- `src/commands/extract.ts` 的关键词抽取 → LLM 抽取候选。
- `src/commands/eval.ts` 的最小断言器 → promptfoo（原生 TS/YAML/CI 友好）。
- `drift` 的「代码真实值」 → 从代码库静态分析真实抽取，而非常量。
