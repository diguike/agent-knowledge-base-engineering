# promote-tool：就地沉淀 → promote 成规范 L1 条目

第 16 章配套示例。实现「就地沉淀 → 定期 promote」这条贡献回路：从零门槛的随手记，
到带完整元数据、可治理的共享 L1 知识条目。

## 运行

需要 Node >= 20.11。

```bash
npx tsx src/main.ts
# 或
npm install && npm start
```

只用 Node 内置模块，无运行时依赖。

## 目录

- `.kb/local/scratch.md` —— 就地沉淀的随手记（脏、无格式、不审核；内容正是第 15 章审计出的欠账）
- `src/promote.ts` —— promote：把选中的随手记补齐 frontmatter，写成规范 L1 条目
- `src/main.ts` —— 选几条上收，展示「脏 → 净」流转
- `out/` —— promote 产物（运行时生成，已 gitignore）

## 预期输出

- 5 条随手记里，promote 选中 4 条（退款审核阈值、大促扩容、legacy_channel、风控不自动退款；
  正是第 15 章审计出的 4 条业务欠账），每条被补上 `title`/`type`/`owner`/`last_reviewed`/`status` 写成规范 L1 条目。
- 第 5 条「今天中午吃啥」是噪音，不上收、留在本地。

> `main.ts` 里硬编码 specs 只是为了在书里把流程钉死、方便复现；真实场景是维护者打开 scratch.md
> 肉眼判断哪几条值得收，不是写代码选。

结论：一条脏随手记 → 带 owner、last_reviewed、status 的可治理 L1 条目——先脏后净的一次完整流转。
就地沉淀零门槛捕获（多数人只需随手记），promote 集中规整（少数维护者定期做），
摩擦被放到对的地方，绕开「成本我出、收益别人拿」的困局。

## 说明

promote 出来的条目在真实项目里会作为 PR 候选，走第 17 章的 docs-as-code 共建流程被审核入库。
本例聚焦「脏 → 净」的结构化这一步。
