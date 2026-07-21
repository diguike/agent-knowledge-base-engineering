---
title: 附录 A　知识库方案生态速查
feishu_url: "https://fivwvysqdz.feishu.cn/wiki/T9aCwbNK6iiU0mkSmJVcuYdqnWd"
last_synced: "2026-07-21T17:24:59+08:00"
---

## 怎么用这张速查

正文把各类知识库方案打散在对应章节里讲。这个附录把它们收拢成几张横向对照表，供你选型时快速定位：**你的需求属于哪一类、有哪些现成方案、各自的定位和坑**。表里的「对应章」指向正文里详细讲它的地方。

一个总原则先摆在前面：**不要整套照搬任何一个闭源 SaaS**——读者跑不起来、也学不到机制。优先选开源可自托管的做主线，闭源方案当「成熟目标态」参照即可。方案演进很快，具体能力以各自官网为准，本表反映的是本书成稿时（2026 年年中）的定位。

## 一、公共文档即上下文（docs-as-context）

把公开的库/仓库文档变成 agent 可调用的知识源。属代码衍生知识层，**直接声明依赖、别自建**（正文第 11 章）。

| 方案 | 机制 | 开源/自托管 | 定位 | 对应章 |
|---|---|---|---|---|
| [Context7](https://context7.com) | 预索引精选库 + 版本化文档，`resolve-id → query-docs` 两步召回 | 后端闭源，[MCP](https://modelcontextprotocol.io) 外壳开源，托管为主 | 热门库的版本化文档 | 第 2、11 章 |
| [GitMCP](https://gitmcp.io) | 把任意 GitHub 仓库即时变成 MCP 端点，按需现抓 | 开源，可自托管（绑 Cloudflare 全家桶） | 任意 repo 即时知识源 | 第 2、6、11 章 |
| [DeepWiki](https://deepwiki.com) | 自动把 repo 索引成结构化 wiki + MCP | 托管 | 从代码自动生成 wiki | 第 2 章 |

## 二、面向 agent 的代码库理解

不是扁平文本，而是符号/调用关系的「代码图谱」（正文第 3 章）。

| 方案 | 机制 | 开源/自托管 | 定位 | 对应章 |
|---|---|---|---|---|
| [Sourcegraph](https://sourcegraph.com) | 基于 [SCIP](https://github.com/sourcegraph/scip) 的代码语义索引、跨大库上下文 | 部分开源，可自托管 | 代码图谱、跨库理解 | 第 3 章 |
| [Greptile](https://www.greptile.com) / [Augment](https://www.augmentcode.com) | 仓库级语义索引 + 自然语言问答 | 支持自托管 | 代码库问答 | 横向对比&nbsp;† |

† 正文未展开，仅作同类横向列出。

## 三、企业搜索 / 知识图谱（整体级）

跨源聚合、面向全员。重，适合企业级、不适合小团队起步。

| 方案 | 机制 | 开源/自托管 | 定位 | 对应章 |
|---|---|---|---|---|
| [Onyx](https://onyx.app)（前 Danswer） | 50+ 连接器（2026-07 源码核实 54 个）+ 混合检索 + 权限同步，**自身即 MCP server** | 开源，docker 可自托管（onyx-lite 起最小闭环） | 企业级成熟目标态、本书主线对标 | 第 11 章 |
| [Glean](https://www.glean.com) | 企业知识图谱（实体+关系），专属语义模型，单一 MCP 端点 | 闭源 | 「全局大库」做到极致的样子（重） | 第 3、11 章 |

## 四、自建地基（框架）

用来从零搭知识库/检索管线。本书主线脊柱用 TS 生态自建（正文第 10 章）。

| 方案 | 语言 | 开源/自托管 | 定位 | 对应章 |
|---|---|---|---|---|
| MCP TS SDK | TS | 开源（官方） | 把知识暴露成 MCP 服务 | 第 10 章 |
| [promptfoo](https://www.promptfoo.dev) | Node/TS | 开源，可自托管 | 评测（断言式 + CI） | 第 21 章 |
| LlamaIndexTS | TS（Node/Deno/Bun/Workers） | 开源 | 分块/embedding/检索地基 | 生产参考&nbsp;‡ |
| [R2R](https://github.com/SciPhi-AI/R2R) / [Haystack](https://haystack.deepset.ai) / [Cognee](https://www.cognee.ai) | Python 为主 | 开源，可自托管 | 自建 RAG/知识管线 | 横向对比&nbsp;§ |

‡ 本书评估过、生产可替换进第 10 章脊柱的候选；第 10 章示例为教学用零依赖手写检索，未接入它。
§ 正文未使用、未深入评估，纯作同类横向列出。

## 五、接现成团队 wiki

知识不必新建，先接已有 wiki（正文第 7 章）。

| 方案 | 特点 | 开源/自托管 | 对应章 |
|---|---|---|---|
| Notion MCP | 官方，最成熟 | 托管 | 第 7 章 |
| [Outline](https://www.getoutline.com) | 开源、Markdown-first、返回文本省 token | 开源，可自托管 | 第 7 章 |
| Confluence | 装机量最大，CQL 检索 | 可自托管 | 第 7 章 |

## 六、跨 agent 分发工具

一份源分发成多家 agent 格式，可移植内核 vs 分发外壳分离（正文第 12 章）。

| 方案 | 机制 | 对应章 |
|---|---|---|
| [Ruler](https://github.com/intellectronica/ruler) | 一份 `.ruler/` 源分发成 20+ 家 agent 配置格式 | 第 12 章 |
| Packmind | ContextOps 全生命周期（Build→Distribute→Govern→Maintain） | 第 12、22 章 |

## 七、边界辨析：agent 记忆 ≠ 知识库

这些是 agent **记忆**（会话状态、个性化），不是可治理的组织知识资产，别混用（正文第 2 章）。

| 方案 | 是什么 | 和知识库的区别 | 对应章 |
|---|---|---|---|
| [Mem0](https://mem0.ai) / [Zep](https://www.getzep.com) / [Letta](https://www.letta.com) | agent 记忆：记住某用户的历史、偏好、会话状态 | 记忆是「关于某次交互的状态」，知识库是「关于业务的、可治理的组织资产」 | 第 2 章 |

## 对标基准（给你的知识库打分用）

- **召回/embedding 选型**：[MTEB](https://huggingface.co/spaces/mteb/leaderboard)（含 BEIR 子集）retrieval 轨——横向比 embedding 模型；引具体分数须标日期（榜单洗牌快）。
- **端到端 RAG 质量**：RAGAS（faithfulness/answer relevancy/context precision/recall；第 21 章生成层指标即沿用其定义）+ 自建 golden set；参考线 Hit@5 > 80%、faithfulness > 0.85。
- **任务级可靠性**：[tau-bench](https://github.com/sierra-research/tau-bench) 思路的 pass^k（正文第 21 章）。

---

> 本章来自《Agent 知识库工程实战：组织、分发、共建与度量》开源版 · 作者「递归客」
> 在线阅读完整书系：[inferloop.dev](https://inferloop.dev)