---
title: 订单与下单规则
type: reference
owner: 订单组
last_reviewed: 2026-06-20
status: active
---

- 下单必须先锁库存再创建订单，否则会超卖。
- 订单状态机：created → paid → shipped → delivered；paid 后才允许退款。
- 改订单 status 一律走 advanceOrder，禁止直接赋值。
- legacy_channel 字段不可删除，对账系统仍在读取它。
