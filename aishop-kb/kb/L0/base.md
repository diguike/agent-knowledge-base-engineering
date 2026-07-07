---
title: 组织级基础约定
type: reference
owner: 平台组
last_reviewed: 2026-06-15
status: active
---

- 提交规范：conventional commits，英文信息，一次提交只做一件事。
- 安全红线：禁止硬编码密钥、token、数据库口令；密钥一律走 secrets 管理。
- 金额单位统一为「分」，跨服务传递不得用浮点数。
- 代码风格：TypeScript 严格模式，单引号，2 空格缩进，带分号。
