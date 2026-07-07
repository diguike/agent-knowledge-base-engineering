# 订单

- 订单状态机：created → paid → shipped → delivered；paid 后可退款。
- 改订单 status 一律走 `advanceOrder`，禁止在业务代码里直接赋值。
- 状态机定义见 `src/order/orderStatus.ts`。
