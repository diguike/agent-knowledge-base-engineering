# kb-orders

- 订单状态机：created → paid → shipped → delivered；paid 后可退款。
- 改 status 一律走 advanceOrder。
