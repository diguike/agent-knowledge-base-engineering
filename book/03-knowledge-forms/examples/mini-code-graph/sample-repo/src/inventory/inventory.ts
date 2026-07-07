// 与状态机无关的库存代码。
export function reserveStock(sku: string, qty: number): boolean {
  return qty > 0;
}
