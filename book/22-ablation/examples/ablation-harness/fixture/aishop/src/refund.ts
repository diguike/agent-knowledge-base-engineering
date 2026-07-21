// 退款处理：阈值是代码衍生知识（常量 + 注释），消融掉 docs/ 后 agent 仍可能从这里兜底。
export const REFUND_REVIEW_THRESHOLD = 5000; // 超过此金额的退款需人工审核（现行值）

export type ReviewResult = 'auto' | 'manual';

export function review(amount: number): ReviewResult {
  return amount > REFUND_REVIEW_THRESHOLD ? 'manual' : 'auto';
}
