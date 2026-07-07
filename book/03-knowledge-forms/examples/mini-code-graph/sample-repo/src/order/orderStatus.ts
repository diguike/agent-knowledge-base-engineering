export enum OrderStatus {
  Created = 'created', Paid = 'paid', Shipped = 'shipped',
  Delivered = 'delivered', Cancelled = 'cancelled', Refunded = 'refunded',
}

// canTransition 的定义处（不是调用处）。
export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  const t: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.Created]: [OrderStatus.Paid, OrderStatus.Cancelled],
    [OrderStatus.Paid]: [OrderStatus.Shipped, OrderStatus.Refunded],
    [OrderStatus.Shipped]: [OrderStatus.Delivered],
    [OrderStatus.Delivered]: [OrderStatus.Refunded],
    [OrderStatus.Cancelled]: [], [OrderStatus.Refunded]: [],
  };
  return t[from].includes(to);
}
