// 库存服务（代码衍生知识）。
// BIZ-RULE: 下单必须先锁库存再创建订单，否则会超卖。（业务规则，代码里只留了一句注释）
export function reserveStock(sku: string, qty: number): boolean {
  // 省略：真实实现会走分布式锁
  return qty > 0;
}
