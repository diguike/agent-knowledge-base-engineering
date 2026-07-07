# aishop 本地层（L2）

依赖: kb-orders, kb-inventory, kb-refund, kb-risk, kb-reconcile

本仓库的 agent 继承 L0 组织级基础层，并选择性依赖上面声明的 L1 知识包。
依赖声明即召回边界：没声明的知识包不会进入检索范围（详见第 8 章）。

## 本地约定
- 本仓库金额单位是「分」，展示层再转元。
- 新增业务规则先在 `.kb/local/scratch.md` 随手记，定期 `aishop-kb promote` 上收为 L1 条目（第 16 章）。
- 提交知识变更走 PR，由 CODEOWNERS 审核，CI 跑 `check` / `eval` / `drift` 三道门禁（第 14、17、22 章）。
