# 订单模块说明

订单（order）是 aishop 的核心实体。订单的状态流转由状态机统一约束，
定义见 `src/order/orderStatus.ts`。请勿在业务代码里手改 status 字段，
一律走 `advanceOrder`。
