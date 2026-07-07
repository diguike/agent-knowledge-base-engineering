---
title: 对账规则
type: reference
owner: 对账组
last_reviewed: 2026-06-14
status: active
---

- 对账任务每日凌晨跑，差异写入对账差异表。
- 对账差异优先排查支付回调是否丢失。
- legacy_channel 字段是对账的关键输入，不可删除。
