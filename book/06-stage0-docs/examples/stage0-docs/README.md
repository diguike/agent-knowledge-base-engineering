# stage0-docs：aishop 阶段0 知识库

第 6 章配套示例。在 `aishop` 上搭一个能力阶梯最底层的阶段0 知识库：一个 `docs/` 文件夹 +
`llms.txt` 索引 + `AGENTS.md` 本地层，再用一个脚本模拟 agent 的确定性导航。零基础设施。

## 运行

需要 Node >= 20.11。

```bash
npx tsx src/navigate.ts "6000 元订单能不能自动退款"
npx tsx src/navigate.ts "大促库存要怎么扩容"
# 或
npm install && npm start
```

只用 Node 内置模块，无运行时依赖。

## 目录

- `aishop/` —— 阶段0 知识库
  - `docs/` —— 分主题的 MD 知识（订单、库存、退款、风控、对账）
  - `llms.txt` —— 仓库自描述索引（agent 先读它建立全局认识；也是第一种对外暴露形态）
  - `AGENTS.md` —— 本地层（L2）：仓库特有约定 + 指路
  - `src/` —— 代码入口（供 llms.txt 指向）
- `src/navigate.ts` —— 模拟 agent：① 读 llms.txt → ② 按 2-gram 词片确定性定位文档 → ③ 完整读回

## 预期输出

以「6000 元订单能不能自动退款」为例：

1. 读 `llms.txt`，知道有 5 篇知识（订单、库存、退款、风控、对账）。
2. 确定性定位到「退款」（`docs/refund.md`）。
3. 完整读回退款规则：只有 paid 后可退、超 5000 需人工审核、命中风控名单不允许自动退款。

换成「大促库存要怎么扩容」定位到 `docs/inventory.md`，「对账差异怎么排查」定位到 `docs/reconcile.md`——
全程确定性、可复现、零基础设施。问一个索引里没有的问题（如「今天天气怎么样」），脚本会老实报
「未命中」而不是硬给一个错答案——确定性系统找不到锚点就该说找不到。

## 关键点

阶段0 就三样东西：`docs/` + `llms.txt` + `AGENTS.md`。主动写一份 `llms.txt` 的成本，
远低于让每个 agent 每次现抓现搜。这个 `docs/` 目录是 `aishop` 能力阶梯的第一层，
后面几章会把它升级成分层知识包、再到 MCP 服务。
