---
title: 库存与大促规则
type: reference
owner: 库存组
last_reviewed: 2026-06-22
status: active
---

- 下单先锁库存再创建订单，否则会超卖。
- 库存扣减走分布式锁，锁的 key 是 sku。
- 大促期间库存服务提前扩容到平时的 3 倍。
