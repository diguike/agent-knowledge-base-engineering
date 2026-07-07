# nav-vs-rag：确定性导航 vs 向量 RAG

第 1 章配套示例。在同一个示例仓库（`sample-repo/`，虚构电商后端 `aishop` 的雏形）上，
对同一个问题「订单状态机是怎么流转的」跑两条检索路径，对照结果。

## 运行

需要 Node >= 20.11（脚本用到 `import.meta.dirname`）。

```bash
npx tsx src/compare.ts
# 或
npm install && npm start
```

只用到 Node 内置模块，运行时无第三方依赖；`tsx` 用于直接执行 TypeScript。
向量路径用的是本地确定性词袋 embedding（见 `src/embed.ts`），不需要任何 API key，
生产中会换成真正的 embedding 模型（见本书第 10 章）。

## 目录

- `sample-repo/` —— 被检索的示例仓库
  - `src/order/orderStatus.ts` —— 订单状态机定义（问题的权威答案）
  - `src/order/orderService.ts` —— 使用状态机的业务代码
  - `src/logging/logger.ts` —— 干扰项：日志文本里出现 order/status，但不是定义
  - `test/order.fixture.ts` —— 干扰项：含 status 字段的测试夹具
  - `docs/orders.md` —— 订单模块说明
- `src/navigate.ts` —— 确定性导航：grep 定义符号 → 完整 read
- `src/rag.ts` —— 向量 RAG：按行切块 → embedding → top-k 概率召回
- `src/embed.ts` —— 本地确定性词袋 embedding + 余弦相似度
- `src/compare.ts` —— 跑两条路径并对照

## 预期输出

- **导航路径**：命中 `src/order/orderStatus.ts`，完整取回该文件（26 行），
  包含 `canTransition` 与完整流转表，结构未被切断。
- **RAG 路径**：召回 3 个片段，横跨 3 个文件，其中状态机定义被按行切断
  （召回到「有 enum 无 canTransition」的残缺片段）。

结论：对边界可枚举的代码知识，导航取回完整结构，RAG 取回跨文件残片——
这正是「你要的可能根本不是 RAG」的直观证据。
