import { OrderStatus, canTransition } from './orderStatus';

// 推进订单到下一个状态，非法流转直接抛错。
export function advanceOrder(order: { status: OrderStatus }, to: OrderStatus): void {
  if (!canTransition(order.status, to)) {
    throw new Error(`illegal transition: ${order.status} -> ${to}`);
  }
  order.status = to;
}
