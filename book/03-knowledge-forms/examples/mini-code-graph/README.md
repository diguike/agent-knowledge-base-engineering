# mini-code-graph：代码图谱 vs 向量召回

第 3 章配套示例。在一段 `aishop` 代码上建一张最小代码图谱（符号 + 调用关系），
回答「谁调用了 `canTransition`」，并与向量召回对照。

## 运行

需要 Node >= 20.11（脚本用到 `import.meta.dirname`）。

```bash
npx tsx src/compare.ts
# 或
npm install && npm start
```

只用 Node 内置模块，无运行时依赖。

## 目录

- `sample-repo/` —— 示例代码
  - `src/order/orderStatus.ts` —— 定义 `canTransition`
  - `src/order/orderService.ts` —— `advanceOrder` 真正调用了 `canTransition`
  - `src/order/legacy.ts` —— 干扰项：注释里提到 `canTransition`，但并未调用
  - `src/inventory/inventory.ts` —— 无关代码
- `src/graph.ts` —— 用正则抽函数定义与调用关系，沿「被调用」边找调用者
- `src/embed.ts` —— 本地确定性词袋 embedding
- `src/compare.ts` —— 图谱查询 vs 向量召回对照

## 预期输出

- **代码图谱**：确定返回唯一真实调用者 `advanceOrder`（`orderService.ts`）。
- **向量召回**：按文本相似度排序，把「只在注释里提到 `canTransition`、并未调用」的
  `legacy.ts` 排到了前面；更打脸的是，真正定义 `canTransition` 的 `orderStatus.ts`
  得分反而垫底（用词少、字面重合低）。向量相似度对「真正相关但用词少」的文件并不友好。

结论：代码图谱沿调用边给确定答案，向量召回靠文本相似度、会把「提到但没调用」的干扰项捞进来——
这就是为什么「谁调用了谁、改它影响谁」这类问题该用图，而不是向量。

## 局限

`graph.ts` 用正则做最小演示，只识别 `function` 声明与直接调用，不处理方法调用、
别名 import、箭头函数赋值等。真实项目会用编译器/LSP 生成 AST 级索引（如 SCIP），
但「图沿调用边确定定位」这个核心点，用最小实现就能说清。
