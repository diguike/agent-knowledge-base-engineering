# 目录

> 《Agent 知识库工程实战：组织、分发、共建与度量》
> 全书 23 章 / 6 部 + 附录。示例以单一 demo 仓库 `aishop`（虚构电商后端）贯穿、逐章长大。

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
- [第 22 章　消融实验：知识库边际贡献的度量与归因](book/22-ablation/README.md)
- [第 23 章　治理与生命周期：漂移检测、废弃机制与落地路线图](book/23-governance-roadmap/README.md)

**附录**

- [附录 A　知识库方案生态速查：Context7 / GitMCP / Sourcegraph / Glean / Onyx / Mem0 选型表](book/appendix-a-landscape/README.md)
