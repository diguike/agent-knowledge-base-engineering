# docs-as-code：知识质量门禁 + CODEOWNERS

第 17 章配套示例。一套知识仓库的最小质量门禁：CODEOWNERS 声明审核归属，CI 脚本对待入库知识
跑四层客观检查（结构/元数据、Diátaxis 单型、prose lint、死链），机器先筛，人只审筛不掉的。

## 运行

需要 Node >= 20.11。

```bash
npx tsx src/main.ts
# 或
npm install && npm start
```

只用 Node 内置模块，无运行时依赖。

## 目录

- `.github/CODEOWNERS` —— 各知识包的审核归属（关键包至少两名 owner）
- `kb/` —— 5 条待入库知识条目（1 条干净、4 条各含一种问题）
- `src/gate.ts` —— 四层门禁检查
- `src/main.ts` —— 对所有条目跑门禁 + 报告 + 退出码

## 四层门禁

1. **结构/元数据**：五字段 frontmatter 齐不齐（复用第 9 章）。
2. **Diátaxis 单型**：`type` 是不是 tutorial/how-to/reference/explanation 之一。
3. **prose lint**：正文命中「让我们来探索」等 AI 味道黑名单（Vale 风格规则）。
4. **死链**：正文里指向的本地文件是否存在。

## 预期输出

- `kb-refund/good.md`：**PASS**（干净过关）。
- `kb-inventory/bad-type.md`：FAIL —— `type: guide` 不是 Diátaxis 合法类型。
- `kb-orders/no-owner.md`：FAIL —— 缺 `owner`。
- `kb-risk/ai-taste.md`：FAIL —— 命中「让我们来探索」。
- `kb-orders/dead-link.md`：FAIL —— 链接指向不存在的文件。
- 4 条被拦，脚本以**退出码 1** 结束（故意的 CI 门禁行为）。

结论：机器筛掉这些客观问题，CODEOWNERS 只审剩下过关的「内容对不对、该不该入库」——
人审花在刀刃上，「人人能贡献」和「不写成一团乱」同时成立。

## 说明

prose lint 这里用内置黑名单演示，生产用 Vale（可自托管、规则可自定义）承载完整的 AI 味道规则集。
