import { OrderStatus, canTransition } from './orderStatus';

// 真正调用 canTransition 的地方。
export function advanceOrder(order: { status: OrderStatus }, to: OrderStatus): void {
  if (!canTransition(order.status, to)) {
    throw new Error('illegal transition');
  }
  order.status = to;
}
