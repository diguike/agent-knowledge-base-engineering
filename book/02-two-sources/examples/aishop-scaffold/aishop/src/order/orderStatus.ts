// 订单状态机（代码衍生知识：结构化、可寻址）。
export enum OrderStatus {
  Created = 'created',
  Paid = 'paid',
  Shipped = 'shipped',
  Delivered = 'delivered',
  Cancelled = 'cancelled',
  Refunded = 'refunded',
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  const t: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.Created]: [OrderStatus.Paid, OrderStatus.Cancelled],
    [OrderStatus.Paid]: [OrderStatus.Shipped, OrderStatus.Refunded],
    [OrderStatus.Shipped]: [OrderStatus.Delivered],
    [OrderStatus.Delivered]: [OrderStatus.Refunded],
    [OrderStatus.Cancelled]: [],
    [OrderStatus.Refunded]: [],
  };
  return t[from].includes(to);
}
