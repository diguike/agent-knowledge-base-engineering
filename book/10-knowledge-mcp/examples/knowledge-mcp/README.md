# knowledge-mcp：手搭知识 MCP 服务

第 10 章配套示例，也是全书脊柱的阶段2 高潮。用官方 TS SDK（`@modelcontextprotocol/sdk`）
搭一个真的能连的知识 MCP 服务，把 `aishop` 的 L1 知识包索引进去，`search_docs` 工具做
「namespace 过滤 → 混合检索（关键词 + 向量）→ rerank → 带出处返回」，再用 InMemoryTransport
把一个 MCP 客户端连上服务、真实调用一次。

## 运行

需要 Node >= 20.11。本例用了真实依赖（MCP SDK + zod），需要先安装：

```bash
npm install
npm start
# 或 npx tsx src/smoke.ts
```

## 目录

- `kb/orders`、`kb/inventory`、`kb/refund` —— L1 知识包，每个是一个 namespace
- `src/retrieval.ts` —— 检索层：索引 + namespace 过滤 + 混合检索（关键词+向量）+ rerank（零依赖）
- `src/server.ts` —— MCP 服务：用 `registerTool` 注册 `search_docs`
- `src/smoke.ts` —— 端到端：InMemoryTransport 连接客户端与服务，真实调用 `search_docs`

## 预期输出

- 客户端发现服务暴露的 tool：`search_docs`。
- `search_docs("退款超过多少要人工审核", namespace="refund")`：只在退款包召回，
  返回「退款金额超过 5000 元需人工审核」（top）+「命中风控名单不允许自动退款」，都带 `[refund]` 出处。
- `search_docs("大促库存要怎么处理")`（不带 namespace）：跨包召回，返回库存包的扩容规则。

结论：限定 namespace 时只在该域召回，不限定则跨包——这就是第 9 章「订阅即召回边界」在服务侧的兑现。
`aishop` 的知识到这里第一次变成了任意 agent（Claude/Cursor/Copilot…）都能接入的 MCP 服务。

## 两个「换成真模型」的插槽

`retrieval.ts` 用本地词袋 embedding + 朴素 rerank，为的是零配置离线跑通。生产里：
把 embedding 换成 MTEB 榜单靠前的模型，把 rerank 换成专门的重排模型，检索质量会明显更好，
但「namespace 过滤 → 混合检索 → rerank」这套数据流和 MCP 服务的骨架完全不变。
