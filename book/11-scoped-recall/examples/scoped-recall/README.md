# scoped-recall：召回的双重过滤（namespace + 权限）

第 11 章配套示例。在上一章检索层的基础上加一道 ACL：每个知识片段标注允许访问的角色，
`search_docs` 在召回阶段做 namespace + 角色权限双重过滤——权限在召回那一刻生效，不是事后过滤。

## 运行

需要 Node >= 20.11。

```bash
npx tsx src/demo.ts
# 或
npm install && npm start
```

只用 Node 内置模块，无运行时依赖。

## 目录

- `kb/refund`、`kb/orders` —— 知识片段，每条用 `(roles: ...)` 标注 ACL
- `src/retrieval-acl.ts` —— 检索层：namespace + 角色双重过滤（权限下推）+ 混合打分
- `src/demo.ts` —— 同一个退款审核问题，分别以「客服」和「财务」角色调用
- `clients.example.json` —— 客户端同时挂「自建知识服务 + GitMCP 端点」的配置示例

## 预期输出

同一个问题「退款超过多少要人工审核」（namespace=refund）：

- **role=support（客服）**：召回为空——退款审核片段都是财务可见，客服无权访问，在召回阶段就被挡住了。
- **role=finance（财务）**：召回到「退款金额超过 5000 需人工审核」等三条财务可见片段。

结论：财务能召回审核细则、客服召回为空——权限是在召回那一刻生效的，不是事后过滤。
这既安全（无权知识压根不进内存）又准确（不会被无权片段挤掉该看的）。

## 代码衍生层：声明依赖，别自建

`clients.example.json` 演示 agent 同时挂两类端点：`aishop-knowledge`（上一章自建的私有业务知识服务）
+ 一个 GitMCP 端点（公开的代码衍生知识，直接声明依赖、按需现抓，不自建）。两类互补：
自建服务管私有业务知识，GitMCP/Context7 管公开代码衍生知识。
