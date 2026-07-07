# aishop-scaffold：贯穿全书的 demo 骨架

第 2 章配套示例，也是全书 demo `aishop`（虚构电商后端）的起点。后面每一章都在这个骨架上继续加东西。

## 运行

需要 Node >= 20.11（脚本用到 `import.meta.dirname`）。

```bash
npx tsx src/scan.ts
# 或
npm install && npm start
```

只用 Node 内置模块，无运行时依赖。

## 目录

- `aishop/` —— demo 仓库骨架
  - `src/order/orderStatus.ts`、`src/inventory/inventory.ts`、`src/payment/refund.ts` —— 代码衍生知识（结构化、可寻址）
  - `docs/aishop.md` —— 随代码维护的文档
  - `notes/scratch.md` —— 未结构化的业务知识（随手记，典型的「只在人脑/聊天里」）
  - 代码注释里的 `BIZ-RULE:` 标记 —— 埋在注释里、尚未被当作知识用的业务规则
- `src/scan.ts` —— 扫描骨架，统计两类知识的起点差异

## 预期输出

脚本会报告：

- **代码衍生知识**：3 个代码文件、4 个导出声明，均已结构化、可寻址、可自动抽取。
- **手写业务知识**：2 条埋在注释里的 `BIZ-RULE`、3 条随手记条目，均未结构化。

结论：代码符号一开始就是结构化的；而业务知识还散在注释和随手记里。
全书要做的，就是把右边这堆「散的」一步步变成可组织、可分发、可治理的知识。
