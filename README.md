# Agent 知识库工程实战：组织、分发、共建与度量

> 把 Agent 知识库当软件工程来做——分层组织、包化分发、CI 集成、共建治理与度量

先读 **[前言](preface/README.md)**（这本书为什么写、写给谁、怎么读）。

Agent 工程高度依赖知识库。但真实的团队困境是：不同业务、不同仓库需要的知识不一样。
建一个全局大库会检索污染、复用边界糊；每个仓库各搞一套则零碎、团队复用性差。理想
形态，是知识能像 npm 包一样被组织、分发、按需安装到不同仓库。

更难的一层：GitMCP、DeepWiki、Sourcegraph 这类工具能把代码库快速「知识库化」，是因为
知识本就在代码里、可自动抽取。但企业真正最值钱的业务知识，散落在不同人、不同角落，
需要手动编写和沉淀——**这才是价值最高、也最难做的一块，是本书要重点攻克的核心问题。**

本书把「Agent 知识库」当软件工程来做：分层组织 → 包化分发 → CI 集成 → 共建治理，
给出开源、可自托管、可运行的落地方案。

**你会亲手建出什么**：全书带你把一座知识库 `aishop-kb`（给虚构电商后端 `aishop` 建的知识库）从空目录一路建到完整可跑——分层知识包、一个知识 MCP 服务、一套逐章长出来的 CLI（`coverage` / `serve` / `promote` / `check` / `extract` / `eval` / `drift`）和一条健康度 CI。读完你拿到的成品就在书根 [`aishop-kb/`](aishop-kb/)，`npx tsx src/cli.ts health` 一键跑出三位一体健康度看板。就像《自己动手写 AI Agent》带你写出 Ling、《AI 评测工程》带你写出 EvalKit——这本书带你建出 `aishop-kb`。

## 这本书写给谁

- 正在为团队建设 Agent 知识基础设施的工程师、平台工程师、DevEx 工程师
- 需要把散落的业务知识系统化沉淀的 AI 工程师
- 前端全栈背景、想深入 Agent 基础设施的工程师（示例以 Node + TS 为主）

不适合：只想「一键接入某 SaaS」而不关心组织与治理的读者；追求 RAG 算法数学推导的读者。

## 怎么读这本书

- **快速上手**：读第一部分建立心智模型，直接跳到第三部分（阶段0/1）动手搭最小可行知识库，够用就停在那。
- **系统学习**：从头顺序读，示例以单一 demo 仓库 `aishop` 贯穿全书、逐章长大，跟着跑一遍手里就有一个完整知识库。
- **只解决共建难题**：直奔第五部分（手写业务知识的共建），这是全书最难、最值钱的重头。
- **只关心度量**：第二部分（覆盖度前置）+ 第六部分（有效性度量与治理）单独成线，可先读。

## 目录

全书 22 章 / 6 部 + 附录，主线是一条能力阶梯：MD 文件夹 → 分层包化 → MCP 知识服务 → 多包分发；
覆盖度前置、共建为重头、运营收尾。示例以单一 demo 仓库 `aishop`（虚构电商后端）贯穿、逐章长大。

**第一部分　基础：检索机制、知识来源与载体形态**
- [第 1 章　检索机制的选择：确定性文件导航与向量检索](book/01-not-rag/README.md)
- [第 2 章　知识的两类来源与能力阶梯模型](book/02-two-sources/README.md)
- [第 3 章　知识的载体形态：文件、切块、代码图谱与知识图谱](book/03-knowledge-forms/README.md)

**第二部分　知识覆盖度的建模与度量**
- [第 4 章　覆盖度建模：业务场景与任务场景矩阵](book/04-scenario-matrix/README.md)
- [第 5 章　覆盖度的量化：语义测试覆盖率及其实现](book/05-coverage-tool/README.md)

**第三部分　知识的分层组织与包化**
- [第 6 章　文件式知识库：docs 目录、llms.txt 与确定性导航](book/06-stage0-docs/README.md)
- [第 7 章　存量知识的冷启动：接入与迁移的分诊](book/07-cold-start/README.md)
- [第 8 章　分层组织模型：L0/L1/L2 与选择性依赖](book/08-layered-org/README.md)
- [第 9 章　依赖清单与包元数据：召回边界与新鲜度治理](book/09-deps-metadata/README.md)

**第四部分　知识服务化与跨端分发**
- [第 10 章　知识 MCP 服务：架构、检索与调优](book/10-knowledge-mcp/README.md)
- [第 11 章　召回边界工程：命名空间、权限与 Onyx 对标](book/11-scoped-recall/README.md)
- [第 12 章　跨 agent 可移植：单一知识源的多端分发](book/12-cross-agent/README.md)
- [第 13 章　包化分发：plugin、marketplace 与声明式安装](book/13-plugin-distribution/README.md)
- [第 14 章　分发的信任边界：trust gate 与 CI 集成](book/14-trust-gate-ci/README.md)

**第五部分　业务知识的沉淀与协同共建**
- [第 15 章　手写业务知识：难点、价值与共建回路](book/15-why-handwritten-hard/README.md)
- [第 16 章　低摩擦沉淀：就地记录与定期上收](book/16-capture-promote/README.md)
- [第 17 章　docs-as-code 共建：CODEOWNERS 与质量门禁](book/17-docs-as-code/README.md)
- [第 18 章　知识的自动抽取：候选提炼、冲突检测与人工审核](book/18-extract-review/README.md)

**第六部分　消费、安全、度量与治理**
- [第 19 章　消费端工程：检索时机与上下文注入](book/19-consume-context/README.md)
- [第 20 章　知识库安全：权限隔离、投毒防护与审计](book/20-security/README.md)
- [第 21 章　有效性度量：评测指标、promptfoo 与任务级可靠性](book/21-eval-promptfoo/README.md)
- [第 22 章　治理与生命周期：漂移检测、废弃机制与落地路线图](book/22-governance-roadmap/README.md)

**附录**
- [附录 A　知识库方案生态速查：Context7 / GitMCP / Sourcegraph / Glean / Onyx / Mem0 选型表](book/appendix-a-landscape/README.md)

## 配套仓库

各章 `examples/` 下为可独立运行的示例代码，依赖写在各自的 `package.json`。

## 许可

（待补）
