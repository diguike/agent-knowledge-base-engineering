// BIZ-RULE: 命中风控名单的订单不允许自动退款
export function canAutoRefund(inBlocklist: boolean): boolean {
  return !inBlocklist;
}
