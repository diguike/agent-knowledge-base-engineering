// BIZ-RULE: 退款金额超过阈值需人工审核（这条规则只活在这行注释里）
const REVIEW_THRESHOLD = 5000; // 魔法数字：为什么是 5000？没人写下来
export function needsManualReview(amount: number): boolean {
  return amount > REVIEW_THRESHOLD;
}
