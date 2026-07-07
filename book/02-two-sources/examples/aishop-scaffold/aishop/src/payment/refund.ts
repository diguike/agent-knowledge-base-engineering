// 退款服务（代码衍生知识）。
// BIZ-RULE: 退款必须先过风控名单校验，命中名单的订单不允许自动退款。（业务规则，仅注释）
export function refund(orderId: string, amount: number): { ok: boolean } {
  return { ok: amount >= 0 };
}
