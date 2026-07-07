# layered-kb：L0/L1/L2 分层 + 选择性依赖

第 8 章配套示例。把知识按三层组织（L0 组织级 / L1 领域包 / L2 仓库本地），
用一个加载器演示「仓库只加载它声明依赖的 L1 包 + L0」，从而「依赖声明即召回边界」。

## 运行

需要 Node >= 20.11。

```bash
npx tsx src/compare.ts
# 或
npm install && npm start
```

只用 Node 内置模块，无运行时依赖。

## 目录

- `kb/L0/base.md` —— 组织级基础层（提交规范、安全红线、代码风格）
- `kb/L1/kb-orders`、`kb-inventory`、`kb-refund`、`kb-search` —— 领域知识包（L1）
- `repos/aishop/AGENTS.md` —— 声明依赖 kb-orders/kb-inventory/kb-refund + 本地约定（L2）
- `repos/search-svc/AGENTS.md` —— 只声明依赖 kb-search + 本地约定（L2）
- `src/loader.ts` —— 按依赖声明加载 L0 + 声明的 L1 + L2；在已加载范围内检索
- `src/compare.ts` —— 同一个退款问题在两个仓库的召回对照

## 预期输出

问「退款金额超过多少要人工审核」：

- **aishop**（依赖含 kb-refund）：加载范围含 kb-refund，✓ 命中「退款金额超过 5000 元需人工审核」。
- **search-svc**（只依赖 kb-search）：加载范围没有 kb-refund，✗ 未召回——退款知识压根没加载进来。

结论：召回污染不是被过滤掉的，而是依赖声明从一开始就把范围圈定了。这就是「裁剪 = 选择性依赖」，
也是「依赖声明即召回边界」在文件层的体现（下一章深入这套机制）。
