// 通用日志工具，和订单状态机的「定义」无关，
// 只是日志文本里恰好出现了 order / status 字样。
export function logOrderStatusChange(orderId: string, status: string): void {
  console.log(`[order] order ${orderId} status changed to ${status}`);
}
